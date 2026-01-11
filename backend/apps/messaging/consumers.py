"""
WebSocket consumers for real-time messaging.
Handles chat connections, message delivery, and typing indicators.

Reference: Original ASP.NET used SignalR (Utilities/ChatHub.cs)
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone

from .models import Conversation, Message
from .serializers import MessageSerializer
from apps.users.models import User
from apps.notifications.models import Notification, NotificationType


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat.

    URL: ws://localhost:8000/ws/chat/
    Auth: JWT token in query params (?token=xxx)

    Events sent by client:
    - send_message: Send a message to a conversation
    - typing: User is typing
    - stop_typing: User stopped typing

    Events sent to client:
    - new_message: New message in a conversation
    - typing: Other user is typing
    - stop_typing: Other user stopped typing
    - error: Error message
    """

    async def connect(self):
        """
        Called when WebSocket connection is established.
        Join user's personal group for receiving messages.
        """
        # Get user from scope (set by AuthMiddlewareStack)
        self.user = self.scope['user']

        # Reject anonymous users
        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        # Create user's personal group name
        self.user_group = f'user_{self.user.id}'

        # Join user's personal group
        await self.channel_layer.group_add(
            self.user_group,
            self.channel_name
        )

        # Accept WebSocket connection
        await self.accept()

        # Send connection success message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'user_id': self.user.id,
            'message': 'Connected to Ecobilda chat'
        }))

    async def disconnect(self, close_code):
        """
        Called when WebSocket connection is closed.
        Leave user's personal group.
        """
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name
            )

    async def receive(self, text_data):
        """
        Called when client sends a message.
        Route to appropriate handler based on message type.
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'send_message':
                await self.handle_send_message(data)
            elif message_type == 'typing':
                await self.handle_typing(data)
            elif message_type == 'stop_typing':
                await self.handle_stop_typing(data)
            else:
                await self.send_error(f'Unknown message type: {message_type}')

        except json.JSONDecodeError:
            await self.send_error('Invalid JSON')
        except Exception as e:
            await self.send_error(f'Error: {str(e)}')

    async def handle_send_message(self, data):
        """
        Handle 'send_message' event from client.

        Expected data:
        {
            'type': 'send_message',
            'conversation_id': 123,
            'body': 'Hello!'
        }
        """
        conversation_id = data.get('conversation_id')
        body = data.get('body', '').strip()

        if not conversation_id or not body:
            await self.send_error('conversation_id and body are required')
            return

        # Validate and create message
        message = await self.create_message(conversation_id, body)

        if not message:
            await self.send_error('Failed to send message. Check conversation access.')
            return

        # Serialize message
        message_data = await self.serialize_message(message)

        # Get conversation to find the other user
        conversation = await self.get_conversation(conversation_id)
        other_user = await self.get_other_user(conversation)

        # Send message to both users
        # Send to sender (confirmation)
        await self.send(text_data=json.dumps({
            'type': 'message_sent',
            'message': message_data
        }))

        # Send to receiver (notification)
        if other_user:
            await self.channel_layer.group_send(
                f'user_{other_user.id}',
                {
                    'type': 'new_message',
                    'message': message_data
                }
            )

            # Create MESSAGE notification for the recipient
            notification_data = await self.create_message_notification(
                conversation=conversation,
                message=message,
                recipient=other_user
            )

            # Send notification via WebSocket
            if notification_data:
                await self.channel_layer.group_send(
                    f'notifications_user_{other_user.id}',
                    {
                        'type': 'new_notification',
                        'notification': notification_data
                    }
                )

    async def handle_typing(self, data):
        """
        Handle 'typing' event from client.

        Expected data:
        {
            'type': 'typing',
            'conversation_id': 123
        }
        """
        conversation_id = data.get('conversation_id')

        if not conversation_id:
            return

        # Get conversation and other user
        conversation = await self.get_conversation(conversation_id)
        if not conversation:
            return

        other_user = await self.get_other_user(conversation)

        if other_user:
            # Notify other user that this user is typing
            await self.channel_layer.group_send(
                f'user_{other_user.id}',
                {
                    'type': 'user_typing',
                    'conversation_id': conversation_id,
                    'user_id': self.user.id,
                    'user_name': self.user.get_full_name()
                }
            )

    async def handle_stop_typing(self, data):
        """
        Handle 'stop_typing' event from client.

        Expected data:
        {
            'type': 'stop_typing',
            'conversation_id': 123
        }
        """
        conversation_id = data.get('conversation_id')

        if not conversation_id:
            return

        # Get conversation and other user
        conversation = await self.get_conversation(conversation_id)
        if not conversation:
            return

        other_user = await self.get_other_user(conversation)

        if other_user:
            # Notify other user that this user stopped typing
            await self.channel_layer.group_send(
                f'user_{other_user.id}',
                {
                    'type': 'user_stop_typing',
                    'conversation_id': conversation_id,
                    'user_id': self.user.id
                }
            )

    # ========== Channel Layer Event Handlers ==========

    async def new_message(self, event):
        """
        Receive 'new_message' event from channel layer.
        Send to WebSocket client.
        """
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    async def user_typing(self, event):
        """
        Receive 'user_typing' event from channel layer.
        Send to WebSocket client.
        """
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'conversation_id': event['conversation_id'],
            'user_id': event['user_id'],
            'user_name': event.get('user_name', '')
        }))

    async def user_stop_typing(self, event):
        """
        Receive 'user_stop_typing' event from channel layer.
        Send to WebSocket client.
        """
        await self.send(text_data=json.dumps({
            'type': 'stop_typing',
            'conversation_id': event['conversation_id'],
            'user_id': event['user_id']
        }))

    # ========== Helper Methods (Database Access) ==========

    @database_sync_to_async
    def create_message(self, conversation_id, body):
        """
        Create a message in the database.
        Verify user is participant in conversation.
        """
        try:
            conversation = Conversation.objects.get(id=conversation_id)

            # Verify user is participant
            if conversation.user1.id != self.user.id and conversation.user2.id != self.user.id:
                return None

            # Create message
            message = Message.objects.create(
                conversation=conversation,
                sender=self.user,
                body=body
            )

            # Update conversation metadata
            conversation.last_message_text = body[:500]
            conversation.last_message_at = timezone.now()

            # Increment unread count for other user
            if conversation.user1.id == self.user.id:
                conversation.unread_count_user2 += 1
            else:
                conversation.unread_count_user1 += 1

            conversation.save()

            return message

        except Conversation.DoesNotExist:
            return None
        except Exception as e:
            print(f"Error creating message: {str(e)}")
            return None

    @database_sync_to_async
    def get_conversation(self, conversation_id):
        """Get conversation from database."""
        try:
            return Conversation.objects.select_related(
                'user1', 'user2'
            ).get(id=conversation_id)
        except Conversation.DoesNotExist:
            return None

    @database_sync_to_async
    def get_other_user(self, conversation):
        """Get the other user in a conversation."""
        if not conversation:
            return None

        if conversation.user1.id == self.user.id:
            return conversation.user2
        else:
            return conversation.user1

    @database_sync_to_async
    def serialize_message(self, message):
        """Serialize message to JSON."""
        # Refresh message to get related objects
        message = Message.objects.select_related(
            'sender',
            'sender__address',
            'sender__address__country',
            'conversation'
        ).prefetch_related(
            'sender__skills',
            'sender__languages'
        ).get(id=message.id)

        serializer = MessageSerializer(message)
        return serializer.data

    @database_sync_to_async
    def create_message_notification(self, conversation, message, recipient):
        """
        Create a MESSAGE notification for a new message.
        Returns notification data for WebSocket broadcast.
        """
        try:
            sender_name = self.user.get_full_name() or self.user.email
            message_preview = message.body[:100]

            notification = Notification.objects.create(
                recipient=recipient,
                type=NotificationType.MESSAGE,
                title=f'New message from {sender_name}',
                message=message_preview,
                link_url=f'/messages/{conversation.id}'
            )

            return {
                'id': notification.id,
                'type': 'MESSAGE',
                'title': notification.title,
                'message': notification.message,
                'link_url': notification.link_url,
                'created_at': notification.created_at.isoformat(),
                'is_read': False
            }

        except Exception as e:
            print(f"Error creating message notification: {str(e)}")
            return None

    async def send_error(self, error_message):
        """Send error message to client."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': error_message
        }))


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications.

    URL: ws://localhost:8000/ws/notifications/
    Auth: JWT token in query params (?token=xxx)

    Events sent to client:
    - new_notification: New notification received
    - notification_marked_read: Notification marked as read

    Events received from client:
    - mark_notification_read: Mark a notification as read
    """

    async def connect(self):
        """
        Called when WebSocket connection is established.
        Join user's personal notification group.
        """
        # Get user from scope (set by AuthMiddlewareStack)
        self.user = self.scope['user']

        # Reject anonymous users
        if self.user.is_anonymous:
            await self.close(code=4001)
            return

        # Create user's personal notification group name
        self.notification_group = f'notifications_user_{self.user.id}'

        # Join user's notification group
        await self.channel_layer.group_add(
            self.notification_group,
            self.channel_name
        )

        # Accept WebSocket connection
        await self.accept()

        # Send connection success message
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'user_id': self.user.id,
            'message': 'Connected to Ecobilda notifications'
        }))

        # Send initial unread count
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': unread_count
        }))

    async def disconnect(self, close_code):
        """
        Called when WebSocket connection is closed.
        Leave user's notification group.
        """
        if hasattr(self, 'notification_group'):
            await self.channel_layer.group_discard(
                self.notification_group,
                self.channel_name
            )

    async def receive(self, text_data):
        """
        Called when client sends a message.
        Route to appropriate handler based on message type.
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'mark_notification_read':
                await self.handle_mark_notification_read(data)
            else:
                await self.send_error(f'Unknown message type: {message_type}')

        except json.JSONDecodeError:
            await self.send_error('Invalid JSON')
        except Exception as e:
            await self.send_error(f'Error: {str(e)}')

    async def handle_mark_notification_read(self, data):
        """
        Handle 'mark_notification_read' event from client.

        Expected data:
        {
            'type': 'mark_notification_read',
            'notification_id': 123
        }
        """
        notification_id = data.get('notification_id')

        if not notification_id:
            await self.send_error('notification_id is required')
            return

        # Mark notification as read
        success = await self.mark_notification_read(notification_id)

        if success:
            await self.send(text_data=json.dumps({
                'type': 'notification_marked_read',
                'notification_id': notification_id
            }))

            # Send updated unread count
            unread_count = await self.get_unread_count()
            await self.send(text_data=json.dumps({
                'type': 'unread_count',
                'count': unread_count
            }))
        else:
            await self.send_error('Failed to mark notification as read')

    # ========== Channel Layer Event Handlers ==========

    async def new_notification(self, event):
        """
        Receive 'new_notification' event from channel layer.
        Send to WebSocket client.
        """
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'notification': event['notification']
        }))

        # Send updated unread count
        unread_count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'unread_count',
            'count': unread_count
        }))

    # ========== Helper Methods (Database Access) ==========

    @database_sync_to_async
    def get_unread_count(self):
        """Get count of unread notifications for current user."""
        return Notification.objects.filter(
            recipient=self.user,
            is_read=False,
            type=NotificationType.MESSAGE
        ).count()

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        """Mark a notification as read."""
        try:
            notification = Notification.objects.get(
                id=notification_id,
                recipient=self.user
            )
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save()
            return True
        except Notification.DoesNotExist:
            return False
        except Exception as e:
            print(f"Error marking notification as read: {str(e)}")
            return False

    async def send_error(self, error_message):
        """Send error message to client."""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': error_message
        }))
