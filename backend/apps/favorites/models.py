"""
Favorites models for Ecobilda.
Users can favorite projects.
"""

from django.db import models
from django.core.exceptions import ValidationError


class Favorite(models.Model):
    """
    Favorite model - links a user to a project they favorited.
    """
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='favorites',
        help_text="User who favorited this project"
    )
    
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='favorited_by',
        help_text="Project that was favorited"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'project']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['project']),
        ]
    
    def __str__(self):
        return f"{self.user.email} favorited {self.project.title}"
    
    def clean(self):
        """Prevent users from favoriting their own projects."""
        if self.user == self.project.owner:
            raise ValidationError("You cannot favorite your own project.")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


