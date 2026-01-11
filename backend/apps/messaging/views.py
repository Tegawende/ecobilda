"""
Messaging views for Ecobilda API.
Handles conversations and messages.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Max
from django.utils import timezone
from datetime import timedelta

from .models import Conversation, Message
from .serializers import (
    ConversationSerializer,
    ConversationCreateSerializer,
    ConversationListSerializer,
    MessageSerializer,
    MessageCreateSerializer,
    MarkAsReadSerializer,
    ToggleMuteSerializer,
)


class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing conversations.

    list: GET /api/conversations/ - Get all conversations for current user
    retrieve: GET /api/conversations/{id}/ - Get specific conversation
    create: POST /api/conversations/ - Create or get conversation with recipient
    destroy: DELETE /api/conversations/{id}/ - Delete conversation

    Custom actions:
    - mark_as_read: Mark conversation as read
    - toggle_mute: Mute/unmute conversation
    - messages: Get messages in conversation
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ConversationCreateSerializer
        elif self.action == 'list':
            return ConversationListSerializer
        elif self.action == 'mark_as_read':
            return MarkAsReadSerializer
        elif self.action == 'toggle_mute':
            return ToggleMuteSerializer
        return ConversationSerializer

    def get_queryset(self):
        """
        Return conversations where current user is participant.
        Optimized with select_related and ordered by last message.
        """
        user = self.request.user
        return Conversation.objects.filter(
            Q(user1=user) | Q(user2=user)
        ).select_related(
            'user1',
            'user1__address',
            'user1__address__country',
            'user2',
            'user2__address',
            'user2__address__country',
        ).prefetch_related(
            'user1__skills',
            'user1__languages',
            'user2__skills',
            'user2__languages',
        ).order_by('-last_message_at')

    def list(self, request, *args, **kwargs):
        """
        List all conversations for current user.
        GET /api/conversations/

        Ordered by most recent message first.
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific conversation.
        GET /api/conversations/{id}/

        Verifies that current user is a participant.
        """
        conversation = self.get_object()

        # Verify user is participant
        if conversation.user1.id != request.user.id and conversation.user2.id != request.user.id:
            return Response(
                {'detail': 'You are not a participant in this conversation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(conversation)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Create or get existing conversation with recipient.
        POST /api/conversations/
        Body: {recipient_id: int}

        Returns existing conversation if found, creates new one otherwise.
        """
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save()

        return Response(
            ConversationSerializer(conversation, context={'request': request}).data,
            status=status.HTTP_200_OK  # 200 even for new conversation (get or create pattern)
        )

    def update(self, request, *args, **kwargs):
        """Not allowed - use specific actions instead."""
        return Response(
            {'detail': 'Use specific actions: mark-as-read, toggle-mute'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def partial_update(self, request, *args, **kwargs):
        """Not allowed - use specific actions instead."""
        return Response(
            {'detail': 'Use specific actions: mark-as-read, toggle-mute'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def destroy(self, request, *args, **kwargs):
        """
        Delete a conversation.
        DELETE /api/conversations/{id}/

        Only participants can delete.
        """
        conversation = self.get_object()

        # Verify user is participant
        if conversation.user1.id != request.user.id and conversation.user2.id != request.user.id:
            return Response(
                {'detail': 'You are not a participant in this conversation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        conversation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        """
        Mark conversation as read for current user.
        POST /api/conversations/{id}/mark-as-read/

        Resets unread count to 0.
        """
        conversation = self.get_object()

        # Verify user is participant
        if conversation.user1.id != request.user.id and conversation.user2.id != request.user.id:
            return Response(
                {'detail': 'You are not a participant in this conversation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = MarkAsReadSerializer(conversation, context={'request': request})
        conversation = serializer.save()

        return Response(
            ConversationSerializer(conversation, context={'request': request}).data
        )

    @action(detail=True, methods=['post'], url_path='toggle-mute')
    def toggle_mute(self, request, pk=None):
        """
        Mute or unmute a conversation.
        POST /api/conversations/{id}/toggle-mute/
        Body: {muted: bool}
        """
        conversation = self.get_object()

        # Verify user is participant
        if conversation.user1.id != request.user.id and conversation.user2.id != request.user.id:
            return Response(
                {'detail': 'You are not a participant in this conversation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ToggleMuteSerializer(
            conversation,
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save()

        return Response(
            ConversationSerializer(conversation, context={'request': request}).data
        )

    @action(detail=True, methods=['get'], url_path='messages')
    def messages(self, request, pk=None):
        """
        Get all messages in a conversation.
        GET /api/conversations/{id}/messages/

        Returns messages in chronological order.
        Automatically marks conversation as read.
        """
        conversation = self.get_object()

        # Verify user is participant
        if conversation.user1.id != request.user.id and conversation.user2.id != request.user.id:
            return Response(
                {'detail': 'You are not a participant in this conversation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get messages
        messages = Message.objects.filter(
            conversation=conversation
        ).select_related(
            'sender',
            'sender__address',
            'sender__address__country',
        ).prefetch_related(
            'sender__skills',
            'sender__languages',
        ).order_by('created_at')

        # Mark as read
        if conversation.user1.id == request.user.id:
            conversation.unread_count_user1 = 0
        else:
            conversation.unread_count_user2 = 0
        conversation.save(update_fields=['unread_count_user1' if conversation.user1.id == request.user.id else 'unread_count_user2'])

        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='send-message')
    def send_message(self, request, pk=None):
        """
        Send a message in a conversation.
        POST /api/conversations/{id}/send-message/
        Body: {body: string}

        Creates message and updates conversation metadata.
        Based on: Controllers/ChatController.cs anti-spam logic
        """
        conversation = self.get_object()

        # Verify user is participant
        if conversation.user1.id != request.user.id and conversation.user2.id != request.user.id:
            return Response(
                {'detail': 'You are not a participant in this conversation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = MessageCreateSerializer(
            data=request.data,
            context={'request': request, 'conversation': conversation}
        )
        serializer.is_valid(raise_exception=True)
        message = serializer.save()

        # Create in-app notification for receiver
        receiver = conversation.get_other_user(request.user)
        from apps.notifications.models import Notification, NotificationType
        Notification.objects.create(
            recipient=receiver,
            type=NotificationType.MESSAGE,
            title=f'New message from {request.user.first_name} {request.user.last_name}',
            message=message.body[:200] + ('...' if len(message.body) > 200 else ''),
            link_url=f'/messages/{conversation.id}',
        )

        # Trigger async email notification
        # Anti-spam logic (24h cooldown) handled in Celery task
        # Based on: Controllers/ChatController.cs lines 254-261
        from .tasks import send_message_notification
        send_message_notification.delay(message.id)

        return Response(
            MessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class MessageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for reading messages.
    Messages are created via ConversationViewSet.send_message action.

    list: Not exposed (use ConversationViewSet.messages)
    retrieve: GET /api/messages/{id}/ - Get specific message
    """

    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Return messages from conversations where user is participant.
        """
        user = self.request.user
        return Message.objects.filter(
            Q(conversation__user1=user) | Q(conversation__user2=user)
        ).select_related(
            'sender',
            'sender__address',
            'sender__address__country',
            'conversation',
        ).prefetch_related(
            'sender__skills',
            'sender__languages',
        ).order_by('-created_at')

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific message.
        GET /api/messages/{id}/

        Verifies that current user is participant in the conversation.
        """
        message = self.get_object()
        conversation = message.conversation

        # Verify user is participant
        if conversation.user1.id != request.user.id and conversation.user2.id != request.user.id:
            return Response(
                {'detail': 'You are not a participant in this conversation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(message)
        return Response(serializer.data)
