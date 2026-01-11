"""
WebSocket authentication middleware.
Authenticates WebSocket connections using JWT tokens.
"""

from urllib.parse import parse_qs
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from apps.users.models import User


@database_sync_to_async
def get_user_from_token(token_string):
    """
    Get user from JWT access token.

    Args:
        token_string: JWT access token string

    Returns:
        User object or AnonymousUser if invalid
    """
    try:
        # Validate and decode token
        access_token = AccessToken(token_string)

        # Get user ID from token
        user_id = access_token['user_id']

        # Get user from database
        user = User.objects.get(id=user_id)

        return user

    except (TokenError, InvalidToken, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using JWT.

    Expects token in query string: ?token=xxx
    Sets scope['user'] to authenticated User or AnonymousUser.
    """

    async def __call__(self, scope, receive, send):
        """
        Middleware entry point.
        """
        # Parse query string for token
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        # Authenticate user from token
        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()

        # Call next middleware/consumer
        return await super().__call__(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    """
    Handy helper function to wrap AuthMiddlewareStack with JWT middleware.

    Usage in asgi.py:
        from apps.messaging.middleware import JWTAuthMiddlewareStack

        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddlewareStack(
                URLRouter(websocket_urlpatterns)
            ),
        })
    """
    return JWTAuthMiddleware(inner)
