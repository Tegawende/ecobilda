r"""
Project models for Ecobilda.
Based on: Data/Entities/UserEntity.cs (HostData) and UserEntity.cs (Availability)

MAJOR SIMPLIFICATION: Projects are separate from Users.
A user can create multiple projects (like Airbnb listings).
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import Address
from apps.skills.models import Skill


class ProjectType(models.TextChoices):
    """
    Project types from original system.
    Based on: Data/Entities/Enums.cs lines 6-10
    """
    PERMACULTURE = 'PERM', 'Permaculture'
    NATURAL_BUILDING = 'NATB', 'Natural Building'


class Project(models.Model):
    """
    Project model (replaces HostData from original system).

    A user can create multiple projects.
    Each project is an opportunity for volunteers to participate.

    Based on: Data/Entities/UserEntity.cs HostData (lines 92-125)
    """

    # Owner (the user who created the project)
    owner = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='projects',
        help_text="User who created this project"
    )

    # Basic Info
    title = models.CharField(max_length=200)
    description = models.TextField()
    project_type = models.CharField(max_length=4, choices=ProjectType.choices)

    # Location
    address = models.ForeignKey(
        Address,
        on_delete=models.PROTECT,
        related_name='projects',
        help_text="Project location"
    )

    # Work Details
    hours_per_day = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Hours of work per day (1-10)"
    )
    days_per_week = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(7)],
        help_text="Days of work per week (1-7)"
    )
    max_helpers = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Maximum number of volunteers needed"
    )

    # Accommodation & Food
    accommodation_details = models.TextField(
        help_text="Description of accommodation provided"
    )
    food_details = models.TextField(
        help_text="Description of food arrangements"
    )

    # Amenities (boolean flags)
    internet_provided = models.BooleanField(default=False)
    family_friendly = models.BooleanField(default=False)
    pets_allowed = models.BooleanField(default=False)
    smoking_allowed = models.BooleanField(default=False)

    # Skills required/offered (Many-to-Many)
    skills = models.ManyToManyField(
        Skill,
        blank=True,
        related_name='projects',
        help_text="Skills involved in this project"
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Project is active and accepting volunteers"
    )

    # Community Moderation (MVP: auto-publication, flagging system)
    flagged_count = models.IntegerField(
        default=0,
        help_text="Number of times this project has been flagged"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['is_active', '-created_at']),
            models.Index(fields=['project_type', 'is_active']),
            models.Index(fields=['owner', 'is_active']),
        ]

    def __str__(self):
        return f"{self.title} ({self.owner.full_name})"

    @property
    def is_visible(self):
        """
        Project is visible if:
        - It's active
        - It hasn't been flagged too many times (< 3)

        Based on plan: Simplified from IsValidate admin approval
        """
        return self.is_active and self.flagged_count < 3

    @property
    def location_display(self):
        """Human-readable location"""
        return f"{self.address.city}, {self.address.country.name}"


class Availability(models.Model):
    """
    Monthly availability for a project.

    Based on: Data/Entities/UserEntity.cs lines 127-149

    Structure: One row per year, with boolean for each month.
    This makes filtering very efficient in SQL.
    """

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='availabilities'
    )
    year = models.IntegerField()

    # Boolean for each month (True = available that month)
    january = models.BooleanField(default=False)
    february = models.BooleanField(default=False)
    march = models.BooleanField(default=False)
    april = models.BooleanField(default=False)
    may = models.BooleanField(default=False)
    june = models.BooleanField(default=False)
    july = models.BooleanField(default=False)
    august = models.BooleanField(default=False)
    september = models.BooleanField(default=False)
    october = models.BooleanField(default=False)
    november = models.BooleanField(default=False)
    december = models.BooleanField(default=False)

    class Meta:
        unique_together = ['project', 'year']
        ordering = ['year']
        verbose_name_plural = 'Availabilities'

    def __str__(self):
        return f"{self.project.title} - {self.year}"

    def get_available_months(self):
        """Return list of available month names"""
        months = []
        month_names = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ]
        for month in month_names:
            if getattr(self, month):
                months.append(month.capitalize())
        return months


class ProjectImage(models.Model):
    """
    Images for a project.

    Based on: Data/Entities/PictureEntity.cs

    MODERNIZATION: Will use S3 direct upload with presigned URLs.
    """

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(
        upload_to='projects/%Y/%m/',
        help_text="Project image"
    )
    order = models.IntegerField(
        default=0,
        help_text="Display order (0 = cover image)"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'uploaded_at']
        indexes = [
            models.Index(fields=['project', 'order']),
        ]

    def __str__(self):
        return f"{self.project.title} - Image {self.order}"

    @property
    def is_cover(self):
        """First image (order=0) is the cover image"""
        return self.order == 0
