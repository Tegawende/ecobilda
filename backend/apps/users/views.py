"""
User views for Ecobilda API.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserPublicSerializer

User = get_user_model()


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for public user profiles.

    GET /api/users/ - List users (public info only)
    GET /api/users/{id}/ - Get specific user (public info only)
    GET /api/users/{id}/reviews/ - Get user's reviews
    """
    queryset = User.objects.filter(is_active=True)
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        """Use public serializer for list/retrieve"""
        return UserPublicSerializer

    def get_queryset(self):
        """
        Filter users by various criteria.
        """
        queryset = super().get_queryset()

        # Filter by skills
        skills = self.request.query_params.get('skills')
        if skills:
            skill_codes = skills.split(',')
            queryset = queryset.filter(skills__code__in=skill_codes).distinct()

        return queryset

    @action(detail=True, methods=['get'], url_path='reviews')
    def reviews(self, request, pk=None):
        """
        Get reviews for a user.
        Returns empty list for now - to be implemented with reviews app.
        """
        return Response({
            'count': 0,
            'next': None,
            'previous': None,
            'results': []
        })


class ProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for authenticated user's own profile.

    GET /api/profile/ - Get own profile
    PUT /api/profile/ - Update own profile
    PATCH /api/profile/ - Partial update own profile
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Only return current user's profile"""
        return User.objects.filter(id=self.request.user.id)

    def get_object(self):
        """Always return current user"""
        return self.request.user

    def list(self, request, *args, **kwargs):
        """Return single profile instead of list"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def upload_picture(self, request):
        """
        Upload profile picture.

        POST /api/profile/upload_picture/

        TODO: Implement S3 direct upload with presigned URLs in Phase 5
        """
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        user.profile_picture = request.FILES['file']
        user.save()

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get user statistics.

        GET /api/profile/stats/

        Returns: projects count, reviews count, rating, etc.
        """
        user = request.user
        return Response({
            'projects_count': user.projects.filter(is_active=True).count(),
            'review_count': user.review_count,
            'average_rating': float(user.average_rating),
            'date_joined': user.date_joined,
            'last_login': user.last_login,
        })
