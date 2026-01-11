"""
Favorites views for Ecobilda API.
Handles favorite CRUD operations.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Favorite
from .serializers import FavoriteSerializer, FavoriteCreateSerializer
from apps.projects.models import Project


class FavoriteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing favorites.
    
    list: GET /api/favorites/ - Get all favorites for current user
    create: POST /api/favorites/ - Add project to favorites
    destroy: DELETE /api/favorites/{id}/ - Remove favorite
    """
    
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return FavoriteCreateSerializer
        return FavoriteSerializer
    
    def get_queryset(self):
        """Return favorites for current user."""
        return Favorite.objects.filter(
            user=self.request.user
        ).select_related('project', 'project__owner').order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        """
        List all favorites for current user.
        Returns array of project IDs for compatibility with frontend.
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Return just project IDs for compatibility
        project_ids = list(queryset.values_list('project_id', flat=True))
        return Response(project_ids)
    
    def create(self, request, *args, **kwargs):
        """
        Create a favorite.
        POST /api/favorites/ with {"project": <project_id>}
        """
        # Get project ID from request
        project_id = request.data.get('project')
        if not project_id:
            return Response(
                {'project': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get project
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response(
                {'project': ['Invalid project ID.']},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user is trying to favorite their own project
        if project.owner == request.user:
            return Response(
                {'detail': 'You cannot favorite your own project.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if favorite already exists
        favorite, created = Favorite.objects.get_or_create(
            user=request.user,
            project=project
        )
        
        if not created:
            return Response(
                {'detail': 'Project is already in favorites.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        response_serializer = FavoriteSerializer(favorite)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['delete'], url_path='by-project/(?P<project_id>[^/.]+)')
    def remove_by_project(self, request, project_id=None):
        """
        Remove favorite by project ID.
        DELETE /api/favorites/by-project/{project_id}/
        """
        try:
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response(
                {'detail': 'Project not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        favorite = Favorite.objects.filter(
            user=request.user,
            project=project
        ).first()
        
        if not favorite:
            return Response(
                {'detail': 'Favorite not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

