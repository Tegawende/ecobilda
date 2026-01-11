"""
User serializers for Ecobilda API.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.core.models import Address, Country, Language

User = get_user_model()


class CountrySerializer(serializers.ModelSerializer):
    """Serializer for Country model."""

    class Meta:
        model = Country
        fields = ['code', 'name']


class LanguageSerializer(serializers.ModelSerializer):
    """Serializer for Language model."""

    class Meta:
        model = Language
        fields = ['code', 'name']


class AddressSerializer(serializers.ModelSerializer):
    """Serializer for Address model."""

    country = CountrySerializer(read_only=True)
    country_code = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Address
        fields = [
            'id', 'city', 'street', 'street_number', 'postal_code',
            'country', 'country_code', 'latitude', 'longitude',
            'formatted_address'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        country_code = validated_data.pop('country_code', None)
        if country_code:
            country = Country.objects.get(code=country_code)
            validated_data['country'] = country
        return super().create(validated_data)

    def update(self, instance, validated_data):
        country_code = validated_data.pop('country_code', None)
        if country_code:
            instance.country = Country.objects.get(code=country_code)
        return super().update(instance, validated_data)


class UserSerializer(serializers.ModelSerializer):
    """
    Main User serializer.
    Used for user profile display and updates.
    """

    address = AddressSerializer(required=False, allow_null=True)
    languages = LanguageSerializer(many=True, read_only=True)
    language_codes = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    skills = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'date_of_birth', 'gender', 'bio', 'profile_picture',
            'address', 'languages', 'language_codes', 'skills',
            'email_notifications', 'newsletter', 'in_app_notifications',
            'notification_language', 'average_rating', 'review_count',
            'date_joined', 'last_login'
        ]
        read_only_fields = [
            'id', 'email', 'average_rating', 'review_count',
            'date_joined', 'last_login'
        ]

    def get_full_name(self, obj):
        """Return user's full name."""
        return f"{obj.first_name} {obj.last_name}"

    def get_skills(self, obj):
        """Return user's skills with display names."""
        from apps.skills.serializers import SkillSerializer
        return SkillSerializer(obj.skills.all(), many=True).data

    def update(self, instance, validated_data):
        # Handle address update
        address_data = validated_data.pop('address', None)
        if address_data:
            if instance.address:
                # Update existing address
                address_serializer = AddressSerializer(
                    instance.address,
                    data=address_data,
                    partial=True
                )
                address_serializer.is_valid(raise_exception=True)
                address_serializer.save()
            else:
                # Create new address
                address_serializer = AddressSerializer(data=address_data)
                address_serializer.is_valid(raise_exception=True)
                instance.address = address_serializer.save()

        # Handle languages update
        language_codes = validated_data.pop('language_codes', None)
        if language_codes is not None:
            languages = Language.objects.filter(code__in=language_codes)
            instance.languages.set(languages)

        # Update other fields
        return super().update(instance, validated_data)


class UserPublicSerializer(serializers.ModelSerializer):
    """
    Public user serializer.
    Used when displaying user info to other users (limited fields).
    """

    address_city = serializers.CharField(source='address.city', read_only=True)
    address_country = serializers.CharField(source='address.country.name', read_only=True)
    skills = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'full_name',
            'profile_picture', 'bio', 'address_city', 'address_country',
            'average_rating', 'review_count', 'skills'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_skills(self, obj):
        """Return user's skills codes only for public view."""
        return list(obj.skills.values_list('code', flat=True))


class UserCreateSerializer(serializers.ModelSerializer):
    """
    User creation serializer.
    Used for registration (email/password).
    """

    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = [
            'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'date_of_birth'
        ]

    def validate_email(self, value):
        """Check if email already exists."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_date_of_birth(self, value):
        """Check if user is at least 18 years old."""
        from datetime import date
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise serializers.ValidationError("You must be at least 18 years old.")
        return value

    def validate(self, attrs):
        """Validate password match."""
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        return attrs

    def create(self, validated_data):
        """Create user with hashed password."""
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            date_of_birth=validated_data['date_of_birth']
        )
        return user
