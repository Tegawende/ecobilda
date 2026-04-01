r"""
Reviews views for Ecobilda API.
Handles review CRUD operations and eligibility checks.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Avg

from .models import Review
from .serializers import (
    ReviewSerializer,
    ReviewCreateSerializer,
    ReviewResponseSerializer,
    ReviewListSerializer,
    ReviewEligibilitySerializer,
)
from .utils import check_review_eligibility

User = get_user_model()


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reviews.

    list: GET /api/reviews/written/ - Get reviews written by current user
    retrieve: GET /api/reviews/{id}/ - Get specific review
    create: POST /api/reviews/ - Create new review
    update: PATCH /api/reviews/{id}/ - Add response to review (receiver only)
    destroy: DELETE /api/reviews/{id}/ - Delete review (writer only, no response)

    Custom actions:
    - eligibility: Check if can review a user
    - user_reviews: Get reviews received by a specific user
    """

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ReviewCreateSerializer
        elif self.action == 'list':
            return ReviewListSerializer
        elif self.action == 'add_response':
            return ReviewResponseSerializer
        return ReviewSerializer

    def get_queryset(self):
        """
        Return reviews based on action.
        Optimized with select_related and prefetch_related.
        """
        queryset = Review.objects.select_related(
            'writer',
            'writer__address',
            'writer__address__country',
            'receiver',
            'receiver__address',
            'receiver__address__country',
        ).prefetch_related(
            'writer__skills',
            'writer__languages',
            'receiver__skills',
            'receiver__languages',
        )

        # Default: reviews written by current user
        if self.action == 'list':
            return queryset.filter(writer=self.request.user).order_by('-created_at')

        return queryset

    def list(self, request, *args, **kwargs):
        """
        List reviews written by current user.
        GET /api/reviews/written/
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific review.
        GET /api/reviews/{id}/
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Create a new review.
        POST /api/reviews/
        Body: {receiver_id: int, rating: int, feedback: string}

        Validates eligibility before creation.
        """
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        # Update receiver's average rating and count
        receiver = review.receiver
        reviews = Review.objects.filter(receiver=receiver)
        receiver.review_count = reviews.count()
        receiver.average_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        receiver.save(update_fields=['review_count', 'average_rating'])

        # Create in-app notification
        from apps.notifications.models import Notification, NotificationType
        Notification.objects.create(
            recipient=receiver,
            type=NotificationType.REVIEW,
            title=f'New review from {request.user.first_name} {request.user.last_name}',
            message=f'{review.rating}/5 - {review.feedback[:200]}' + ('...' if len(review.feedback) > 200 else ''),
            link_url=f'/profile',
        )

        # Send email notification (async via Celery)
        from apps.messaging.tasks import send_review_notification
        send_review_notification.delay(review.id)

        # Return full review with nested data
        return Response(
            ReviewSerializer(review, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """
        Not allowed - use add_response action instead.
        """
        return Response(
            {'detail': 'Use PATCH /api/reviews/{id}/add_response/ to add a response.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def partial_update(self, request, *args, **kwargs):
        """
        Not allowed - use add_response action instead.
        """
        return Response(
            {'detail': 'Use PATCH /api/reviews/{id}/add_response/ to add a response.'},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def destroy(self, request, *args, **kwargs):
        """
        Delete a review.
        DELETE /api/reviews/{id}/

        Only writer can delete, and only if no response yet.
        """
        review = self.get_object()

        # Only writer can delete
        if review.writer.id != request.user.id:
            return Response(
                {'detail': 'Only the review writer can delete this review.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Cannot delete if there's a response
        if review.response:
            return Response(
                {'detail': 'Cannot delete a review that has been responded to.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update receiver's stats before deletion
        receiver = review.receiver
        review.delete()

        # Recalculate receiver's rating
        reviews = Review.objects.filter(receiver=receiver)
        receiver.review_count = reviews.count()
        receiver.average_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
        receiver.save(update_fields=['review_count', 'average_rating'])

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['patch'], url_path='add-response')
    def add_response(self, request, pk=None):
        """
        Add a response to a review.
        PATCH /api/reviews/{id}/add-response/
        Body: {response: string}

        Only the receiver can add a response, and only once.
        """
        review = self.get_object()

        serializer = ReviewResponseSerializer(
            review,
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        # Create in-app notification for the review writer
        from apps.notifications.models import Notification, NotificationType
        Notification.objects.create(
            recipient=review.writer,
            type=NotificationType.REVIEW,
            title=f'{review.receiver.first_name} {review.receiver.last_name} responded to your review',
            message=review.response[:200] + ('...' if len(review.response) > 200 else ''),
            link_url=f'/users/{review.receiver.id}',
        )

        # Send email notification (async via Celery)
        from apps.messaging.tasks import send_review_response_notification
        send_review_response_notification.delay(review.id)

        return Response(
            ReviewSerializer(review, context={'request': request}).data
        )

    @action(detail=False, methods=['get'], url_path='eligibility/(?P<user_id>[0-9]+)')
    def eligibility(self, request, user_id=None):
        """
        Check if current user can review another user.
        GET /api/reviews/eligibility/{user_id}/

        Returns: {eligible: bool, reason: string, conversation_id: int}

        Based on: Data/DAO/UserDAO.cs lines 102-118
        """
        writer = request.user

        try:
            receiver = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Cannot review yourself
        if writer.id == receiver.id:
            return Response({
                'eligible': False,
                'reason': 'You cannot review yourself.'
            })

        # Check if already reviewed
        if Review.objects.filter(writer=writer, receiver=receiver).exists():
            return Response({
                'eligible': False,
                'reason': 'You have already reviewed this user.'
            })

        # Check eligibility (both users must have messaged in last 180 days)
        eligible, reason, conversation_id = check_review_eligibility(writer, receiver)

        return Response({
            'eligible': eligible,
            'reason': reason,
            'conversation_id': conversation_id,
        })

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[0-9]+)')
    def user_reviews(self, request, user_id=None):
        """
        Get reviews received by a specific user.
        GET /api/reviews/user/{user_id}/

        Returns reviews in reverse chronological order.
        Frontend: GET /users/{userId}/reviews/
        """
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        reviews = Review.objects.filter(receiver=user).select_related(
            'writer',
            'writer__address',
            'writer__address__country',
            'receiver',
            'receiver__address',
            'receiver__address__country',
        ).prefetch_related(
            'writer__skills',
            'writer__languages',
            'receiver__skills',
            'receiver__languages',
        ).order_by('-created_at')

        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)
