r"""
Review models for Ecobilda.
Based on: Data/Entities/FeedbackEntity.cs

Bidirectional review system with response capability.
Preserves critical business logic from original system.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    """
    Bidirectional review/feedback between users.

    Based on: Data/Entities/FeedbackEntity.cs

    Key business rules (from UserDAO.cs lines 102-118):
    - Users can only review each other if BOTH have sent messages in the last 6 months
    - One review per user pair
    """

    # Who wrote the review
    writer = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='reviews_given'
    )

    # Who received the review
    receiver = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='reviews_received'
    )

    # Rating (1-5 stars, stored as decimal for precision)
    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        help_text="Rating from 1.0 to 5.0"
    )

    # Written feedback
    feedback = models.TextField(help_text="Written review text")

    # Response capability (receiver can respond to review)
    response = models.TextField(blank=True, help_text="Receiver's response to the review")
    response_date = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # One review per user pair (writer -> receiver)
        unique_together = ['writer', 'receiver']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['receiver', '-created_at']),
            models.Index(fields=['writer', '-created_at']),
        ]

    def __str__(self):
        return f"{self.writer.full_name} → {self.receiver.full_name} ({self.rating}⭐)"

    def save(self, *args, **kwargs):
        """Override save to update receiver's cached rating stats"""
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new:
            # Update cached stats on receiver's profile
            self.receiver.update_rating_stats()
