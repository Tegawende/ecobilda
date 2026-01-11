"""
User models for Ecobilda.
Based on: ASP.NET Data/Entities/UserEntity.cs

MAJOR SIMPLIFICATION: Unified user type (no Host/Helper separation).
All users can both create projects AND participate in others' projects.
"""

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.core.models import Address, Language


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        # Set default values for required fields
        extra_fields.setdefault('first_name', 'Admin')
        extra_fields.setdefault('last_name', 'User')
        extra_fields.setdefault('date_of_birth', '1990-01-01')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.

    Simplified from original ASP.NET version:
    - No UserType enum (Host/Helper) - all users are unified
    - No separate HostData/HelperData models
    - Removed: TravelBuddies, HeardAboutEcobilda, LoginCounter, AdminMasked
    """

    # Override username field (we use email as unique identifier)
    username = None
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Email is already required as USERNAME_FIELD

    # Use custom manager
    objects = UserManager()

    # Basic Profile Info
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    date_of_birth = models.DateField()

    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('N', 'Prefer not to say'),
    ]
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)

    bio = models.TextField(blank=True, help_text="User description/motto")
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)

    # Address (OneToOne relationship)
    address = models.OneToOneField(
        Address,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user'
    )

    # Languages spoken (Many-to-Many)
    languages = models.ManyToManyField(
        Language,
        blank=True,
        related_name='speakers',
        help_text="Languages this user speaks"
    )

    # Skills (Many-to-Many, defined in skills app)
    # skills = ManyToManyField to Skill model (will be added via related_name)

    # Notification Settings
    email_notifications = models.BooleanField(
        default=True,
        help_text="Receive email notifications for new messages"
    )
    newsletter = models.BooleanField(default=True)
    in_app_notifications = models.BooleanField(default=True)
    notification_language = models.CharField(
        max_length=2,
        choices=[('en', 'English'), ('fr', 'Français'), ('es', 'Español'), ('de', 'Deutsch')],
        default='en',
        help_text="Language for email notifications"
    )

    # Profile Visibility
    is_profile_visible = models.BooleanField(
        default=True,
        help_text="User can hide their profile from search"
    )

    # Review/Rating Stats (cached from reviews)
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    review_count = models.IntegerField(default=0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['is_profile_visible', '-created_at']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def has_complete_profile(self):
        """Check if user has filled essential profile information."""
        return bool(
            self.first_name and
            self.last_name and
            self.bio and
            self.address and
            self.languages.exists()
        )

    def update_rating_stats(self):
        """
        Update cached rating statistics from reviews.
        Called via signal when a new review is created.

        Based on: ASP.NET Data/DAO/UserDAO.cs lines 184-215
        """
        from apps.reviews.models import Review
        from django.db.models import Avg, Count

        stats = self.reviews_received.aggregate(
            avg=Avg('rating'),
            count=Count('id')
        )

        self.average_rating = stats['avg'] or 0.00
        self.review_count = stats['count'] or 0
        self.save(update_fields=['average_rating', 'review_count'])
