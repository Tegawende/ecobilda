"""
Microsoft Graph API email backend for Django.

Uses OAuth2 client credentials to send emails via the Microsoft Graph API.
Requires: msal, requests

Settings (via environment / django-decouple):
    MS_GRAPH_TENANT_ID
    MS_GRAPH_CLIENT_ID
    MS_GRAPH_CLIENT_SECRET
    DEFAULT_FROM_EMAIL  (must be a valid mailbox in the tenant)
"""

import json
import logging

import msal
import requests as http_requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend

logger = logging.getLogger(__name__)

GRAPH_SEND_MAIL_URL = "https://graph.microsoft.com/v1.0/users/{sender}/sendMail"
GRAPH_SCOPE = ["https://graph.microsoft.com/.default"]


class MicrosoftGraphEmailBackend(BaseEmailBackend):
    """
    Django email backend that sends emails via Microsoft Graph API.

    Uses MSAL for OAuth2 client credentials authentication.
    The sending account (DEFAULT_FROM_EMAIL) must be a licensed mailbox
    in the Azure AD tenant, and the app registration must have
    Mail.Send application permission granted by an admin.
    """

    def __init__(self, fail_silently=False, **kwargs):
        super().__init__(fail_silently=fail_silently, **kwargs)
        self.tenant_id = getattr(settings, 'MS_GRAPH_TENANT_ID', '')
        self.client_id = getattr(settings, 'MS_GRAPH_CLIENT_ID', '')
        self.client_secret = getattr(settings, 'MS_GRAPH_CLIENT_SECRET', '')
        self._access_token = None

    def _get_access_token(self):
        """Acquire an access token via MSAL client credentials flow."""
        if self._access_token:
            return self._access_token

        authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        app = msal.ConfidentialClientApplication(
            self.client_id,
            authority=authority,
            client_credential=self.client_secret,
        )

        result = app.acquire_token_for_client(scopes=GRAPH_SCOPE)

        if "access_token" in result:
            self._access_token = result["access_token"]
            return self._access_token

        error_msg = result.get("error_description", result.get("error", "Unknown error"))
        logger.error("Failed to acquire MS Graph token: %s", error_msg)
        if not self.fail_silently:
            raise Exception(f"MS Graph token acquisition failed: {error_msg}")
        return None

    def _build_message_payload(self, email_message):
        """Convert a Django EmailMessage to a Graph API sendMail payload."""
        from_email = email_message.from_email or settings.DEFAULT_FROM_EMAIL

        to_recipients = [
            {"emailAddress": {"address": addr}}
            for addr in email_message.to
        ]

        cc_recipients = [
            {"emailAddress": {"address": addr}}
            for addr in (email_message.cc or [])
        ]

        bcc_recipients = [
            {"emailAddress": {"address": addr}}
            for addr in (email_message.bcc or [])
        ]

        # Build body - prefer HTML if available
        body_content = email_message.body
        content_type = "text"

        # Check for HTML alternative content
        if hasattr(email_message, 'alternatives'):
            for content, mimetype in email_message.alternatives:
                if mimetype == 'text/html':
                    body_content = content
                    content_type = "html"
                    break

        payload = {
            "message": {
                "subject": email_message.subject,
                "body": {
                    "contentType": content_type,
                    "content": body_content,
                },
                "from": {
                    "emailAddress": {"address": from_email}
                },
                "toRecipients": to_recipients,
            },
            "saveToSentItems": False,
        }

        if cc_recipients:
            payload["message"]["ccRecipients"] = cc_recipients
        if bcc_recipients:
            payload["message"]["bccRecipients"] = bcc_recipients

        return payload, from_email

    def send_messages(self, email_messages):
        """Send one or more EmailMessage objects, return the number sent."""
        if not email_messages:
            return 0

        token = self._get_access_token()
        if not token:
            return 0

        num_sent = 0
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        for message in email_messages:
            try:
                payload, from_email = self._build_message_payload(message)
                url = GRAPH_SEND_MAIL_URL.format(sender=from_email)

                response = http_requests.post(
                    url,
                    headers=headers,
                    data=json.dumps(payload),
                    timeout=30,
                )

                if response.status_code == 202:
                    num_sent += 1
                    logger.info(
                        "Email sent via Graph API to %s (subject: %s)",
                        ", ".join(message.to),
                        message.subject,
                    )
                else:
                    error_body = response.text[:500]
                    logger.error(
                        "Graph API send failed (HTTP %s) to %s: %s",
                        response.status_code,
                        ", ".join(message.to),
                        error_body,
                    )
                    if not self.fail_silently:
                        raise Exception(
                            f"Graph API error {response.status_code}: {error_body}"
                        )

            except Exception as e:
                logger.error("Error sending email via Graph API: %s", str(e))
                if not self.fail_silently:
                    raise

        return num_sent
