"""
WebSocket URL routing for messaging app.
Maps WebSocket URLs to consumers.
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # WebSocket endpoint for chat
    # Usage: ws://localhost:8000/ws/chat/
    re_path(r'ws/chat/$', consumers.ChatConsumer.as_asgi()),

    # WebSocket endpoint for notifications
    # Usage: ws://localhost:8000/ws/notifications/
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]
