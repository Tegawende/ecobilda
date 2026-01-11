r"""
Messaging models for Ecobilda.
Based on: Data/Entities/ConversationEntity.cs and MessageEntity.cs

Real-time messaging with email notification anti-spam logic.
Preserves critical notification tracking from original system.
"""

from django.db import models
from django.utils import timezone


class Conversation(models.Model):
    """
    1-to-1 conversation between two users.

    Based on: Data/Entities/ConversationEntity.cs

    CRITICAL: Email notification anti-spam tracking
    (from ChatController.cs lines 254-261)
    """

    # Participants
    user1 = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='conversations_as_user1'
    )
    user2 = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='conversations_as_user2'
    )

    # Last message info (for inbox preview)
    last_message_text = models.TextField(blank=True)
    last_message_at = models.DateTimeField(null=True, blank=True)

    # Unread message tracking
    unread_count_user1 = models.IntegerField(default=0)
    unread_count_user2 = models.IntegerField(default=0)

    # Email notification anti-spam tracking
    # CRITICAL LOGIC: Max 1 email per conversation per 24 hours
    last_email_sent_to_user1 = models.DateTimeField(null=True, blank=True)
    last_email_sent_to_user2 = models.DateTimeField(null=True, blank=True)

    # Mute conversation (opt-out from notifications)
    user1_muted = models.BooleanField(default=False)
    user2_muted = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensure unique conversation per user pair
        unique_together = ['user1', 'user2']
        ordering = ['-last_message_at']
        indexes = [
            models.Index(fields=['user1', '-last_message_at']),
            models.Index(fields=['user2', '-last_message_at']),
        ]

    def __str__(self):
        return f"{self.user1.full_name} ↔ {self.user2.full_name}"

    def get_other_user(self, user):
        """Get the other participant in the conversation"""
        return self.user2 if user == self.user1 else self.user1

    def get_unread_count(self, user):
        """Get unread message count for a specific user"""
        return self.unread_count_user1 if user == self.user1 else self.unread_count_user2

    def mark_as_read(self, user):
        """Mark all messages as read for a specific user"""
        if user == self.user1:
            self.unread_count_user1 = 0
        else:
            self.unread_count_user2 = 0
        self.save(update_fields=[f'unread_count_user{1 if user == self.user1 else 2}'])

    def should_send_email_to(self, user):
        """
        Check if we should send email notification to a user.

        CRITICAL ANTI-SPAM LOGIC (from ChatController.cs lines 254-261):
        - User must have email notifications enabled
        - User hasn't muted this conversation
        - Last email was sent > 24 hours ago (or never)

        Args:
            user: User to check

        Returns:
            bool: True if email should be sent
        """
        from datetime import timedelta

        # Check if user has email notifications enabled
        if not user.email_notifications:
            return False

        # Check if conversation is muted
        if user == self.user1 and self.user1_muted:
            return False
        if user == self.user2 and self.user2_muted:
            return False

        # Check last email timestamp (24-hour rule)
        last_email = self.last_email_sent_to_user1 if user == self.user1 else self.last_email_sent_to_user2

        if last_email is None:
            return True  # Never sent email to this user

        hours_since_last_email = (timezone.now() - last_email).total_seconds() / 3600

        return hours_since_last_email >= 24

    def update_last_email_sent(self, user):
        """Update timestamp when email is sent to user"""
        if user == self.user1:
            self.last_email_sent_to_user1 = timezone.now()
        else:
            self.last_email_sent_to_user2 = timezone.now()
        self.save(update_fields=[f'last_email_sent_to_user{1 if user == self.user1 else 2}'])


class Message(models.Model):
    """
    Individual message in a conversation.

    Based on: Data/Entities/MessageEntity.cs
    """

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='messages_sent'
    )
    body = models.TextField()

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['sender', '-created_at']),
        ]

    def __str__(self):
        preview = self.body[:50] + '...' if len(self.body) > 50 else self.body
        return f"{self.sender.full_name}: {preview}"

    def save(self, *args, **kwargs):
        """Override save to update conversation metadata"""
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            # Update conversation's last message info
            self.conversation.last_message_text = self.body[:200]
            self.conversation.last_message_at = self.created_at

            # Increment unread count for receiver
            receiver = self.conversation.get_other_user(self.sender)
            if receiver == self.conversation.user1:
                self.conversation.unread_count_user1 += 1
            else:
                self.conversation.unread_count_user2 += 1

            self.conversation.save()
