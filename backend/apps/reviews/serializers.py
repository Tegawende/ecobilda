r"""
Reviews serializers for Ecobilda API.
Based on: Data/DAO/UserDAO.cs (lines 102-118, 184-215) and Controllers/ChatController.cs
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.users.serializers import UserPublicSerializer
from .models import Review

User = get_user_model()


class ReviewSerializer(serializers.ModelSerializer):
    """
    Full review serializer with writer and receiver details.
    """

    writer = UserPublicSerializer(read_only=True)
    receiver = UserPublicSerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'writer',
            'receiver',
            'rating',
            'feedback',
            'response',
            'response_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'writer', 'receiver', 'response_date', 'created_at', 'updated_at']


class ReviewListSerializer(serializers.ModelSerializer):
    """
    Compact review serializer for list views.
    """

    writer_name = serializers.SerializerMethodField()
    writer_picture = serializers.CharField(source='writer.profile_picture', read_only=True)
    receiver_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id',
            'writer_name',
            'writer_picture',
            'receiver_name',
            'rating',
            'feedback',
            'response',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_writer_name(self, obj):
        """Return writer's full name."""
        return f"{obj.writer.first_name} {obj.writer.last_name}"

    def get_receiver_name(self, obj):
        """Return receiver's full name."""
        return f"{obj.receiver.first_name} {obj.receiver.last_name}"


class ReviewCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating reviews.
    Writer is set from request.user in the view.
    """

    receiver_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Review
        fields = ['receiver_id', 'rating', 'feedback']

    def validate_rating(self, value):
        """Validate rating is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value

    def validate_feedback(self, value):
        """Validate feedback length (20-1000 characters)."""
        if len(value) < 20:
            raise serializers.ValidationError('Feedback must be at least 20 characters.')
        if len(value) > 1000:
            raise serializers.ValidationError('Feedback must be less than 1000 characters.')
        return value

    def validate(self, attrs):
        """
        Validate eligibility to review.
        Based on: Data/DAO/UserDAO.cs lines 102-118
        """
        writer = self.context['request'].user
        receiver_id = attrs['receiver_id']

        # Cannot review yourself
        if writer.id == receiver_id:
            raise serializers.ValidationError({
                'receiver_id': 'You cannot review yourself.'
            })

        # Check if receiver exists
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({
                'receiver_id': 'User does not exist.'
            })

        # Check if already reviewed
        if Review.objects.filter(writer=writer, receiver=receiver).exists():
            raise serializers.ValidationError({
                'receiver_id': 'You have already reviewed this user.'
            })

        # Check eligibility (both users must have messaged in last 180 days)
        from apps.reviews.utils import check_review_eligibility
        eligible, reason, conversation_id = check_review_eligibility(writer, receiver)

        if not eligible:
            raise serializers.ValidationError({
                'receiver_id': reason
            })

        attrs['receiver'] = receiver
        return attrs

    def create(self, validated_data):
        """Create review with writer from request.user."""
        receiver = validated_data.pop('receiver')
        validated_data.pop('receiver_id')  # Remove write-only field

        writer = self.context['request'].user
        review = Review.objects.create(
            writer=writer,
            receiver=receiver,
            **validated_data
        )
        return review


class ReviewResponseSerializer(serializers.Serializer):
    """
    Serializer for adding response to a review.
    Only the receiver can add a response.
    """

    response = serializers.CharField(max_length=1000, required=True)

    def validate_response(self, value):
        """Validate response is not empty."""
        if not value.strip():
            raise serializers.ValidationError('Response cannot be empty.')
        if len(value) > 1000:
            raise serializers.ValidationError('Response must be less than 1000 characters.')
        return value

    def validate(self, attrs):
        """Validate that current user is the receiver."""
        review = self.instance
        user = self.context['request'].user

        # Only receiver can respond
        if review.receiver.id != user.id:
            raise serializers.ValidationError('You can only respond to reviews you received.')

        # Cannot respond twice
        if review.response:
            raise serializers.ValidationError('You have already responded to this review.')

        return attrs

    def update(self, instance, validated_data):
        """Add response to review."""
        from django.utils import timezone

        instance.response = validated_data['response']
        instance.response_date = timezone.now()
        instance.save()
        return instance


class ReviewEligibilitySerializer(serializers.Serializer):
    """
    Serializer for checking review eligibility.
    Returns whether user can review another user and why/why not.
    """

    eligible = serializers.BooleanField(read_only=True)
    reason = serializers.CharField(read_only=True, required=False)
    conversation_id = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        fields = ['eligible', 'reason', 'conversation_id']
