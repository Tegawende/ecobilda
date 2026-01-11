"""
Favorites serializers for Ecobilda API.
"""

from rest_framework import serializers
from .models import Favorite
from apps.projects.models import Project


class FavoriteSerializer(serializers.ModelSerializer):
    """
    Serializer for Favorite model.
    """
    project_id = serializers.IntegerField(source='project.id', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = Favorite
        fields = ['id', 'project_id', 'project_title', 'created_at']
        read_only_fields = ['id', 'created_at']


class FavoriteCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a favorite.
    """
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(),
        help_text="Project ID to favorite"
    )
    
    class Meta:
        model = Favorite
        fields = ['project']
    
    def validate_project(self, value):
        """Prevent users from favoriting their own projects."""
        if not hasattr(self.context, 'request') or not hasattr(self.context['request'], 'user'):
            return value
        user = self.context['request'].user
        if value.owner == user:
            raise serializers.ValidationError("You cannot favorite your own project.")
        return value
    
    def create(self, validated_data):
        """Create favorite for current user."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

