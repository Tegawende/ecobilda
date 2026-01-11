"""
Notification serializers for Ecobilda API.
"""

from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for notifications.
    """

    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'title',
            'message',
            'link_url',
            'is_read',
            'read_at',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'read_at']


class NotificationListSerializer(serializers.ModelSerializer):
    """
    Compact serializer for listing notifications.
    """

    class Meta:
        model = Notification
        fields = [
            'id',
            'type',
            'title',
            'message',
            'link_url',
            'is_read',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


