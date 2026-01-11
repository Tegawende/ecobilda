r"""
Review eligibility logic for Ecobilda.
Based on: Data/DAO/UserDAO.cs CheckIfFeedbackEnable method (lines 102-118)

CRITICAL BUSINESS RULE:
Users can only review each other if BOTH have sent at least 1 message
in the last 180 days (6 months).
"""

from datetime import timedelta
from django.utils import timezone
from django.db.models import Q
from apps.messaging.models import Conversation, Message


def check_review_eligibility(user1, user2):
    """
    Check if two users are eligible to review each other.

    Business Rule (preserved from ASP.NET):
    Both users must have sent at least 1 message in the last 180 days
    in their conversation.

    Reference: Data/DAO/UserDAO.cs lines 102-118

    Args:
        user1: User object (potential writer)
        user2: User object (potential receiver)

    Returns:
        tuple: (eligible: bool, reason: str|None, conversation_id: int|None)

    Examples:
        >>> eligible, reason, conv_id = check_review_eligibility(user_a, user_b)
        >>> if eligible:
        >>>     # Allow review creation
        >>> else:
        >>>     # Show error: reason
    """
    six_months_ago = timezone.now() - timedelta(days=180)

    # Find conversation between users (bidirectional lookup)
    conversation = Conversation.objects.filter(
        Q(user1=user1, user2=user2) | Q(user1=user2, user2=user1)
    ).first()

    if not conversation:
        return False, "No conversation found between users", None

    # Check if both users sent messages in last 180 days
    recent_senders = Message.objects.filter(
        conversation=conversation,
        created_at__gte=six_months_ago
    ).values_list('sender_id', flat=True).distinct()

    # Convert to set for easier checking
    recent_sender_ids = set(recent_senders)

    # Both users must have sent at least 1 message
    if user1.id in recent_sender_ids and user2.id in recent_sender_ids:
        return True, None, conversation.id

    # Determine which user hasn't sent messages
    if user1.id not in recent_sender_ids and user2.id not in recent_sender_ids:
        reason = "Neither user has sent messages in the last 6 months"
    elif user1.id not in recent_sender_ids:
        reason = "You haven't sent any messages in the last 6 months"
    else:
        reason = "The other user hasn't sent any messages in the last 6 months"

    return False, reason, conversation.id


def check_already_reviewed(writer, receiver):
    """
    Check if writer has already reviewed receiver.

    Args:
        writer: User object
        receiver: User object

    Returns:
        bool: True if already reviewed, False otherwise
    """
    from apps.reviews.models import Review

    return Review.objects.filter(
        writer=writer,
        receiver=receiver
    ).exists()


def get_user_average_rating(user):
    """
    Calculate user's average rating from all reviews received.

    Args:
        user: User object

    Returns:
        tuple: (average_rating: float, review_count: int)
    """
    from django.db.models import Avg
    from apps.reviews.models import Review

    reviews = Review.objects.filter(receiver=user)
    count = reviews.count()

    if count == 0:
        return 0.0, 0

    average = reviews.aggregate(Avg('rating'))['rating__avg'] or 0.0

    return round(average, 2), count


def update_user_rating(user):
    """
    Update user's cached rating fields (average_rating, review_count).
    Called automatically by signals after review create/delete.

    Args:
        user: User object

    Returns:
        None (updates user in place)
    """
    average, count = get_user_average_rating(user)
    user.average_rating = average
    user.review_count = count
    user.save(update_fields=['average_rating', 'review_count'])


def can_respond_to_review(user, review):
    """
    Check if user can add a response to a review.

    Rules:
    - User must be the receiver of the review
    - Review must not already have a response

    Args:
        user: User object
        review: Review object

    Returns:
        tuple: (can_respond: bool, reason: str|None)
    """
    if review.receiver.id != user.id:
        return False, "Only the receiver can respond to a review"

    if review.response:
        return False, "Review already has a response"

    return True, None


def get_recent_reviews(user, limit=5):
    """
    Get most recent reviews for a user (both written and received).

    Args:
        user: User object
        limit: int (default 5)

    Returns:
        dict: {
            'received': QuerySet of reviews received,
            'written': QuerySet of reviews written
        }
    """
    from apps.reviews.models import Review

    received = Review.objects.filter(
        receiver=user
    ).select_related(
        'writer',
        'writer__address',
        'writer__address__country'
    ).prefetch_related(
        'writer__skills',
        'writer__languages'
    ).order_by('-created_at')[:limit]

    written = Review.objects.filter(
        writer=user
    ).select_related(
        'receiver',
        'receiver__address',
        'receiver__address__country'
    ).prefetch_related(
        'receiver__skills',
        'receiver__languages'
    ).order_by('-created_at')[:limit]

    return {
        'received': received,
        'written': written
    }
