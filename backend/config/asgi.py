"""
ASGI config for Ecobilda project.

Exposes ASGI application with WebSocket support via Django Channels.
Handles both HTTP and WebSocket protocols.
"""

import os
from django.core.asgi import get_asgi_application

# Set Django settings module before importing channels
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

# Initialize Django ASGI application early to ensure AppRegistry is populated
# before importing channels routing
django_asgi_app = get_asgi_application()

# Now import channels routing (requires Django to be fully initialized)
from channels.routing import ProtocolTypeRouter, URLRouter
from apps.messaging.routing import websocket_urlpatterns
from apps.messaging.middleware import JWTAuthMiddlewareStack

application = ProtocolTypeRouter({
    # HTTP requests handled by Django
    "http": django_asgi_app,

    # WebSocket requests handled by Channels with JWT authentication
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
