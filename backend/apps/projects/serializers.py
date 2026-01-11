r"""
Project serializers for Ecobilda API.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from apps.core.models import Address, Country
from apps.skills.serializers import SkillSerializer, SkillSimpleSerializer
from apps.users.serializers import UserPublicSerializer, AddressSerializer
from .models import Project, Availability, ProjectImage

User = get_user_model()


class AvailabilitySerializer(serializers.ModelSerializer):
    """
    Serializer for monthly availability.
    Based on: Data/Entities/UserEntity.cs lines 127-149
    """

    available_months = serializers.SerializerMethodField()

    class Meta:
        model = Availability
        fields = [
            'year', 'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december',
            'available_months'
        ]

    def get_available_months(self, obj):
        """Return list of available month names"""
        return obj.get_available_months()


class ProjectImageSerializer(serializers.ModelSerializer):
    """
    Serializer for project images.
    """
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProjectImage
        fields = ['id', 'image', 'order', 'is_cover', 'uploaded_at']
        read_only_fields = ['id', 'is_cover', 'uploaded_at', 'image']

    def get_image(self, obj):
        """Return absolute URL for the image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProjectListSerializer(serializers.ModelSerializer):
    """
    Compact project serializer for list views.
    Optimized for performance with minimal nesting.
    """

    owner = UserPublicSerializer(read_only=True)
    city = serializers.CharField(source='address.city', read_only=True)
    country = serializers.CharField(source='address.country.name', read_only=True)
    country_code = serializers.CharField(source='address.country.code', read_only=True)
    skills = SkillSimpleSerializer(many=True, read_only=True)
    cover_image = serializers.SerializerMethodField()
    location_display = serializers.ReadOnlyField()
    # Add address object with coordinates for map markers
    address = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'project_type',
            'owner', 'city', 'country', 'country_code', 'address',
            'hours_per_day', 'days_per_week', 'max_helpers',
            'internet_provided', 'family_friendly', 'pets_allowed', 'smoking_allowed',
            'skills', 'cover_image', 'location_display',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_address(self, obj):
        """Return address with coordinates for map markers"""
        if obj.address:
            return {
                'city': obj.address.city,
                'country': {
                    'name': obj.address.country.name,
                    'code': obj.address.country.code,
                },
                'latitude': float(obj.address.latitude) if obj.address.latitude else None,
                'longitude': float(obj.address.longitude) if obj.address.longitude else None,
                'formatted_address': obj.address.formatted_address,
            }
        return None

    def get_cover_image(self, obj):
        """Return cover image URL (first image with order=0)"""
        cover = obj.images.filter(order=0).first()
        if cover:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(cover.image.url)
            return cover.image.url
        return None


class ProjectSerializer(serializers.ModelSerializer):
    """
    Full project serializer for detail views and creation.
    Includes all nested relationships.
    """

    owner = UserPublicSerializer(read_only=True)
    address = AddressSerializer()
    skills = SkillSerializer(many=True, read_only=True)
    skill_codes = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="List of skill codes to associate with this project"
    )
    availabilities = AvailabilitySerializer(many=True, read_only=True)
    availabilities_data = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False,
        help_text="List of availability objects with year and month booleans"
    )
    images = ProjectImageSerializer(many=True, read_only=True)
    location_display = serializers.ReadOnlyField()
    is_visible = serializers.ReadOnlyField()

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'project_type',
            'owner', 'address', 'skills', 'skill_codes',
            'hours_per_day', 'days_per_week', 'max_helpers',
            'accommodation_details', 'food_details',
            'internet_provided', 'family_friendly', 'pets_allowed', 'smoking_allowed',
            'availabilities', 'availabilities_data',
            'images', 'location_display', 'is_visible',
            'is_active', 'flagged_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'owner', 'flagged_count', 'created_at', 'updated_at']

    def create(self, validated_data):
        """
        Create project with nested address, skills, and availabilities.
        Owner is set from request.user in the view.
        """
        # Extract nested data
        address_data = validated_data.pop('address')
        skill_codes = validated_data.pop('skill_codes', [])
        availabilities_data = validated_data.pop('availabilities_data', [])

        # Create address
        country_code = address_data.pop('country_code', None)
        if country_code:
            address_data['country'] = Country.objects.get(code=country_code)
        address = Address.objects.create(**address_data)

        # Create project
        project = Project.objects.create(address=address, **validated_data)

        # Add skills
        if skill_codes:
            from apps.skills.models import Skill
            skills = Skill.objects.filter(code__in=skill_codes)
            project.skills.set(skills)

        # Create availabilities
        for availability_data in availabilities_data:
            Availability.objects.create(project=project, **availability_data)

        return project

    def update(self, instance, validated_data):
        """
        Update project with nested relationships.
        """
        # Handle address update
        address_data = validated_data.pop('address', None)
        if address_data:
            country_code = address_data.pop('country_code', None)
            if country_code:
                address_data['country'] = Country.objects.get(code=country_code)

            # Update existing address
            for attr, value in address_data.items():
                setattr(instance.address, attr, value)
            instance.address.save()

        # Handle skills update
        skill_codes = validated_data.pop('skill_codes', None)
        if skill_codes is not None:
            from apps.skills.models import Skill
            skills = Skill.objects.filter(code__in=skill_codes)
            instance.skills.set(skills)

        # Handle availabilities update
        availabilities_data = validated_data.pop('availabilities_data', None)
        if availabilities_data is not None:
            # Delete existing availabilities
            instance.availabilities.all().delete()
            # Create new ones
            for availability_data in availabilities_data:
                Availability.objects.create(project=instance, **availability_data)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance

    def validate_hours_per_day(self, value):
        """Validate hours per day is between 1 and 10"""
        if value < 1 or value > 10:
            raise serializers.ValidationError("Hours per day must be between 1 and 10")
        return value

    def validate_days_per_week(self, value):
        """Validate days per week is between 1 and 7"""
        if value < 1 or value > 7:
            raise serializers.ValidationError("Days per week must be between 1 and 7")
        return value

    def validate_max_helpers(self, value):
        """Validate max helpers is at least 1"""
        if value < 1:
            raise serializers.ValidationError("Max helpers must be at least 1")
        return value


class ProjectCreateSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for project creation.
    Used in create forms where we want minimal fields.
    """

    address = AddressSerializer()
    skill_codes = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Project
        fields = [
            'title', 'description', 'project_type',
            'address', 'skill_codes',
            'hours_per_day', 'days_per_week', 'max_helpers',
            'accommodation_details', 'food_details',
            'internet_provided', 'family_friendly', 'pets_allowed', 'smoking_allowed',
        ]

    def create(self, validated_data):
        """Create project with owner from request context"""
        address_data = validated_data.pop('address')
        skill_codes = validated_data.pop('skill_codes', [])

        # Create address
        country_code = address_data.pop('country_code', None)
        if country_code:
            address_data['country'] = Country.objects.get(code=country_code)
        address = Address.objects.create(**address_data)

        # Get owner from context (set in view)
        owner = self.context['request'].user
        project = Project.objects.create(owner=owner, address=address, **validated_data)

        # Add skills
        if skill_codes:
            from apps.skills.models import Skill
            skills = Skill.objects.filter(code__in=skill_codes)
            project.skills.set(skills)

        return project


class ProjectUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating existing projects.
    Allows partial updates.
    """

    address = AddressSerializer(required=False)
    skill_codes = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = Project
        fields = [
            'title', 'description', 'project_type',
            'address', 'skill_codes',
            'hours_per_day', 'days_per_week', 'max_helpers',
            'accommodation_details', 'food_details',
            'internet_provided', 'family_friendly', 'pets_allowed', 'smoking_allowed',
            'is_active'
        ]

    def update(self, instance, validated_data):
        """Update project with nested relationships"""
        # Handle address update
        address_data = validated_data.pop('address', None)
        if address_data:
            country_code = address_data.pop('country_code', None)
            if country_code:
                address_data['country'] = Country.objects.get(code=country_code)

            for attr, value in address_data.items():
                setattr(instance.address, attr, value)
            instance.address.save()

        # Handle skills update
        skill_codes = validated_data.pop('skill_codes', None)
        if skill_codes is not None:
            from apps.skills.models import Skill
            skills = Skill.objects.filter(code__in=skill_codes)
            instance.skills.set(skills)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance
