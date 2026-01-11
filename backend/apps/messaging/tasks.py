"""
Celery tasks for messaging app.
Handles asynchronous email notifications with anti-spam logic.

Reference: Controllers/ChatController.cs lines 254-261 (ASP.NET)
"""

from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from celery import shared_task

from .models import Message, Conversation
from apps.users.models import User


@shared_task
def send_message_notification(message_id):
    """
    Send email notification for a new message.

    Business Rule (preserved from ASP.NET):
    - Max 1 email per 24 hours per conversation
    - Only if receiver has message_notifications_enabled = True
    - Track last email sent timestamp per user per conversation

    Reference: Controllers/ChatController.cs lines 254-261

    Args:
        message_id: ID of the Message that was sent

    Returns:
        dict: {
            'sent': bool,
            'reason': str (if not sent)
        }
    """
    try:
        # Get message and conversation
        message = Message.objects.select_related(
            'conversation',
            'sender',
            'conversation__user1',
            'conversation__user2'
        ).get(id=message_id)

        conversation = message.conversation
        sender = message.sender

        # Determine receiver (the other user in conversation)
        if conversation.user1.id == sender.id:
            receiver = conversation.user2
            last_notif_field = 'last_email_notif_user2'
            last_notif_value = conversation.last_email_notif_user2
        else:
            receiver = conversation.user1
            last_notif_field = 'last_email_notif_user1'
            last_notif_value = conversation.last_email_notif_user1

        # Check if receiver wants email notifications
        if not receiver.email_notifications:
            return {
                'sent': False,
                'reason': 'Receiver has disabled email notifications'
            }

        # Check 24-hour cooldown (anti-spam)
        if last_notif_value:
            hours_since_last = (timezone.now() - last_notif_value).total_seconds() / 3600

            if hours_since_last < 24:
                return {
                    'sent': False,
                    'reason': f'Last email sent {hours_since_last:.1f} hours ago (< 24h cooldown)'
                }

        # Prepare email context
        context = {
            'receiver_name': receiver.first_name,
            'sender_name': sender.get_full_name(),
            'sender_first_name': sender.first_name,
            'message_preview': message.body[:200],
            'message_full': message.body,
            'conversation_url': f"{settings.FRONTEND_URL}/messages/{conversation.id}",
            'unsubscribe_url': f"{settings.FRONTEND_URL}/profile/settings",
        }

        # Render HTML email
        html_message = render_to_string(
            'messaging/emails/new_message.html',
            context
        )

        # Render plain text fallback
        plain_message = render_to_string(
            'messaging/emails/new_message.txt',
            context
        )

        # Send email
        send_mail(
            subject=f"New message from {sender.first_name} on Ecobilda",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[receiver.email],
            html_message=html_message,
            fail_silently=False,
        )

        # Update last email notification timestamp
        setattr(conversation, last_notif_field, timezone.now())
        conversation.save(update_fields=[last_notif_field])

        return {
            'sent': True,
            'reason': None
        }

    except Message.DoesNotExist:
        return {
            'sent': False,
            'reason': f'Message {message_id} not found'
        }
    except Exception as e:
        # Log error but don't crash
        print(f"Error sending email notification: {str(e)}")
        return {
            'sent': False,
            'reason': str(e)
        }


@shared_task
def send_review_notification(review_id):
    """
    Send email notification when user receives a new review.

    Args:
        review_id: ID of the Review

    Returns:
        dict: {'sent': bool, 'reason': str}
    """
    try:
        from apps.reviews.models import Review

        review = Review.objects.select_related(
            'writer',
            'receiver'
        ).get(id=review_id)

        receiver = review.receiver
        writer = review.writer

        # Check if receiver wants notifications
        if not receiver.email_notifications:
            return {
                'sent': False,
                'reason': 'Receiver has disabled email notifications'
            }

        # Prepare context
        context = {
            'receiver_name': receiver.first_name,
            'writer_name': writer.get_full_name(),
            'rating': review.rating,
            'feedback': review.feedback,
            'profile_url': f"{settings.FRONTEND_URL}/profile",
        }

        # Render email
        html_message = render_to_string(
            'reviews/emails/new_review.html',
            context
        )

        plain_message = render_to_string(
            'reviews/emails/new_review.txt',
            context
        )

        # Send
        send_mail(
            subject=f"{writer.first_name} left you a review on Ecobilda",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[receiver.email],
            html_message=html_message,
            fail_silently=False,
        )

        return {
            'sent': True,
            'reason': None
        }

    except Exception as e:
        print(f"Error sending review notification: {str(e)}")
        return {
            'sent': False,
            'reason': str(e)
        }


@shared_task
def send_review_response_notification(review_id):
    """
    Send email notification when someone responds to your review.

    Args:
        review_id: ID of the Review

    Returns:
        dict: {'sent': bool, 'reason': str}
    """
    try:
        from apps.reviews.models import Review

        review = Review.objects.select_related(
            'writer',
            'receiver'
        ).get(id=review_id)

        # Notify the writer (who left the original review)
        writer = review.writer
        receiver = review.receiver

        # Check if writer wants notifications
        if not writer.email_notifications:
            return {
                'sent': False,
                'reason': 'Writer has disabled email notifications'
            }

        # Prepare context
        context = {
            'writer_name': writer.first_name,
            'receiver_name': receiver.get_full_name(),
            'original_feedback': review.feedback,
            'response': review.response,
            'profile_url': f"{settings.FRONTEND_URL}/users/{receiver.id}",
        }

        # Render email
        html_message = render_to_string(
            'reviews/emails/review_response.html',
            context
        )

        plain_message = render_to_string(
            'reviews/emails/review_response.txt',
            context
        )

        # Send
        send_mail(
            subject=f"{receiver.first_name} responded to your review on Ecobilda",
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[writer.email],
            html_message=html_message,
            fail_silently=False,
        )

        return {
            'sent': True,
            'reason': None
        }

    except Exception as e:
        print(f"Error sending review response notification: {str(e)}")
        return {
            'sent': False,
            'reason': str(e)
        }
