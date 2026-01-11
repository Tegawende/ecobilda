r"""
Notification models for Ecobilda.
Based on: Data/Entities/NotifEntity.cs (simplified)

Unified notification system for all notification types.
"""

from django.db import models


class NotificationType(models.TextChoices):
    """Notification types"""
    REVIEW = 'REVIEW', 'Feedback Available'
    MESSAGE = 'MESSAGE', 'New Message'
    ADMIN = 'ADMIN', 'Admin Announcement'
    PROJECT = 'PROJECT', 'Project Update'
    SYSTEM = 'SYSTEM', 'System Notification'


class Notification(models.Model):
    """
    Unified notification model.

    Simplified from original NotifEntity + AdminNotifEntity.
    All notifications use the same table.
    """

    recipient = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='notifications'
    )

    type = models.CharField(max_length=20, choices=NotificationType.choices)

    title = models.CharField(max_length=200)
    message = models.TextField()

    # Optional link to related object
    link_url = models.CharField(max_length=500, blank=True)

    # Read status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read', '-created_at']),
        ]

    def __str__(self):
        return f"{self.get_type_display()} → {self.recipient.full_name}"

    def mark_as_read(self):
        """Mark this notification as read"""
        from django.utils import timezone
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
