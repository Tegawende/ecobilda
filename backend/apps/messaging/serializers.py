"""
Messaging serializers for Ecobilda API.
Based on: Controllers/ChatController.cs (anti-spam logic lines 254-261)
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.db import IntegrityError
from apps.users.serializers import UserPublicSerializer
from .models import Conversation, Message

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer for messages.
    """

    sender = UserPublicSerializer(read_only=True)

    class Meta:
        model = Message
        fields = [
            'id',
            'conversation',
            'sender',
            'body',
            'created_at',
        ]
        read_only_fields = ['id', 'conversation', 'sender', 'created_at']


class MessageCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating messages.
    Sender is set from request.user in the view.
    """

    class Meta:
        model = Message
        fields = ['body']

    def validate_body(self, value):
        """Validate message body is not empty."""
        if not value.strip():
            raise serializers.ValidationError('Message cannot be empty.')
        if len(value) > 5000:
            raise serializers.ValidationError('Message too long (max 5000 characters).')
        return value

    def create(self, validated_data):
        """Create message with sender from request.user."""
        conversation = self.context['conversation']
        sender = self.context['request'].user

        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            **validated_data
        )

        # Update conversation's last message
        conversation.last_message_text = validated_data['body']
        conversation.last_message_at = message.created_at
        conversation.save()

        # Increment unread count for the other user
        if conversation.user1.id == sender.id:
            conversation.unread_count_user2 += 1
        else:
            conversation.unread_count_user1 += 1
        conversation.save()

        return message


class ConversationSerializer(serializers.ModelSerializer):
    """
    Serializer for conversations.
    Includes both participants and last message info.
    """

    user1 = UserPublicSerializer(read_only=True)
    user2 = UserPublicSerializer(read_only=True)

    class Meta:
        model = Conversation
        fields = [
            'id',
            'user1',
            'user2',
            'last_message_text',
            'last_message_at',
            'unread_count_user1',
            'unread_count_user2',
            'user1_muted',
            'user2_muted',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user1',
            'user2',
            'last_message_text',
            'last_message_at',
            'unread_count_user1',
            'unread_count_user2',
            'created_at',
            'updated_at',
        ]


class ConversationCreateSerializer(serializers.Serializer):
    """
    Serializer for creating or retrieving a conversation.
    """

    recipient_id = serializers.IntegerField(required=True)

    def validate_recipient_id(self, value):
        """Validate recipient exists and is not self."""
        user = self.context['request'].user

        # Cannot message yourself
        if user.id == value:
            raise serializers.ValidationError('You cannot message yourself.')

        # Check if recipient exists
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError('Recipient does not exist.')

        return value

    def save(self):
        """
        Get or create conversation between current user and recipient.
        Uses Q objects to check both directions and get_or_create to avoid race conditions.
        """
        user = self.context['request'].user
        recipient_id = self.validated_data['recipient_id']
        recipient = User.objects.get(id=recipient_id)

        # Try to find existing conversation (either direction)
        # Use Q objects to check both user1/user2 combinations in one query
        conversation = Conversation.objects.filter(
            Q(user1=user, user2=recipient) | Q(user1=recipient, user2=user)
        ).first()

        # If conversation doesn't exist, create it
        # Use get_or_create to handle race conditions
        if not conversation:
            # Ensure user1.id < user2.id to maintain consistency
            # This prevents duplicate conversations in different orders
            if user.id < recipient.id:
                user1, user2 = user, recipient
            else:
                user1, user2 = recipient, user

            try:
                conversation, created = Conversation.objects.get_or_create(
                    user1=user1,
                    user2=user2,
                    defaults={}
                )
            except IntegrityError:
                # If IntegrityError occurs (race condition), another request created it
                # Fetch the conversation that was just created
                conversation = Conversation.objects.filter(
                    Q(user1=user1, user2=user2) | Q(user1=user2, user2=user1)
                ).first()
                
                if not conversation:
                    raise serializers.ValidationError(
                        'Failed to create or retrieve conversation. Please try again.'
                    )

        return conversation


class ConversationListSerializer(serializers.ModelSerializer):
    """
    Compact serializer for listing conversations.
    """

    user1 = UserPublicSerializer(read_only=True)
    user2 = UserPublicSerializer(read_only=True)
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id',
            'user1',
            'user2',
            'last_message_preview',
            'last_message_at',
            'unread_count_user1',
            'unread_count_user2',
            'user1_muted',
            'user2_muted',
        ]

    def get_last_message_preview(self, obj):
        """Return truncated last message (max 100 chars)."""
        if obj.last_message_text:
            if len(obj.last_message_text) > 100:
                return obj.last_message_text[:97] + '...'
            return obj.last_message_text
        return None


class MarkAsReadSerializer(serializers.Serializer):
    """
    Serializer for marking conversation as read.
    """

    def save(self):
        """Mark conversation as read for current user."""
        conversation = self.instance
        user = self.context['request'].user

        # Reset unread count for current user
        if conversation.user1.id == user.id:
            conversation.unread_count_user1 = 0
        else:
            conversation.unread_count_user2 = 0

        conversation.save()
        return conversation


class ToggleMuteSerializer(serializers.Serializer):
    """
    Serializer for muting/unmuting a conversation.
    """

    muted = serializers.BooleanField(required=True)

    def save(self):
        """Toggle mute status for current user."""
        conversation = self.instance
        user = self.context['request'].user
        muted = self.validated_data['muted']

        # Set mute status for current user
        if conversation.user1.id == user.id:
            conversation.user1_muted = muted
        else:
            conversation.user2_muted = muted

        conversation.save()
        return conversation
