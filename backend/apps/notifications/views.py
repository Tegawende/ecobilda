"""
Notification views for Ecobilda API.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone

from .models import Notification
from .serializers import NotificationSerializer, NotificationListSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing notifications.

    list: GET /api/notifications/ - Get all notifications for current user
    retrieve: GET /api/notifications/{id}/ - Get specific notification
    mark_as_read: POST /api/notifications/{id}/mark-as-read/ - Mark notification as read
    mark_all_read: POST /api/notifications/mark-all-read/ - Mark all notifications as read
    unread_count: GET /api/notifications/unread-count/ - Get count of unread notifications
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return NotificationListSerializer
        return NotificationSerializer

    def get_queryset(self):
        """Return notifications for current user."""
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        """
        List all notifications for current user.
        GET /api/notifications/

        Optional query params:
        - unread_only: Only return unread notifications
        - type: Filter by notification type
        """
        queryset = self.filter_queryset(self.get_queryset())

        # Filter by unread status
        unread_only = request.query_params.get('unread_only', 'false').lower() == 'true'
        if unread_only:
            queryset = queryset.filter(is_read=False)

        # Filter by type
        notification_type = request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(type=notification_type)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        """
        Mark a notification as read.
        POST /api/notifications/{id}/mark-as-read/
        """
        notification = self.get_object()

        # Verify user owns this notification
        if notification.recipient.id != request.user.id:
            return Response(
                {'detail': 'You do not have permission to mark this notification as read.'},
                status=status.HTTP_403_FORBIDDEN
            )

        notification.mark_as_read()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """
        Mark all notifications as read for current user.
        POST /api/notifications/mark-all-read/
        """
        updated = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(
            is_read=True,
            read_at=timezone.now()
        )

        return Response({
            'detail': f'Marked {updated} notification(s) as read.',
            'updated_count': updated
        })

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """
        Get count of unread notifications for current user.
        GET /api/notifications/unread-count/
        """
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()

        return Response({'count': count})
