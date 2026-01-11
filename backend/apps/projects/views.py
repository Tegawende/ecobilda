"""
Project views for Ecobilda API.
Based on: Controllers/HostController.cs
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly, BasePermission, SAFE_METHODS
from rest_framework.response import Response
from django.db.models import Q
from datetime import datetime
from .models import Project, Availability
from .serializers import (
    ProjectSerializer,
    ProjectListSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    AvailabilitySerializer
)


class IsOwnerOrReadOnly(BasePermission):
    """
    Custom permission to only allow owners of a project to edit it.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed for anyone
        if request.method in SAFE_METHODS:
            return True
        # Write permissions only for authenticated users
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for anyone
        if request.method in SAFE_METHODS:
            return True
        # Write permissions only for the owner
        return obj.owner == request.user


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Projects with advanced filtering.

    GET /api/projects/ - List projects with filters
    GET /api/projects/{id}/ - Get specific project
    POST /api/projects/ - Create project (authenticated)
    PUT /api/projects/{id}/ - Update project (owner only)
    PATCH /api/projects/{id}/ - Partial update (owner only)
    DELETE /api/projects/{id}/ - Delete project (owner only)

    Query parameters for filtering:
    - keyword: Search in title and description
    - skills: Comma-separated skill codes (e.g., "carpentry,cobbuilding")
    - countries: Comma-separated country codes (e.g., "FR,ES,DE")
    - project_type: PERM or NATB
    - internet: true/false
    - family_friendly: true/false
    - pets_allowed: true/false
    - smoking_allowed: true/false
    - available_from: Date (YYYY-MM-DD) for availability filtering
    - exclude_own: true/false - Exclude user's own projects from results

    Based on: Controllers/HostController.cs FilterHost (lines 102-265)
    """
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        """
        Filter projects with complex logic from original system.
        """
        queryset = Project.objects.filter(is_active=True, flagged_count__lt=3)

        # Keyword search (title + description)
        keyword = self.request.query_params.get('keyword')
        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) | Q(description__icontains=keyword)
            )

        # Filter by skills (many-to-many)
        skills = self.request.query_params.get('skills')
        if skills:
            skill_codes = skills.split(',')
            queryset = queryset.filter(skills__code__in=skill_codes).distinct()

        # Filter by countries
        countries = self.request.query_params.get('countries')
        if countries:
            country_codes = countries.split(',')
            queryset = queryset.filter(address__country__code__in=country_codes)

        # Filter by project type
        project_type = self.request.query_params.get('project_type')
        if project_type:
            queryset = queryset.filter(project_type=project_type.upper())

        # Filter by amenities (boolean flags)
        if self.request.query_params.get('internet') == 'true':
            queryset = queryset.filter(internet_provided=True)
        if self.request.query_params.get('family_friendly') == 'true':
            queryset = queryset.filter(family_friendly=True)
        if self.request.query_params.get('pets_allowed') == 'true':
            queryset = queryset.filter(pets_allowed=True)
        if self.request.query_params.get('smoking_allowed') == 'true':
            queryset = queryset.filter(smoking_allowed=True)

        # Filter by availability
        # CRITICAL: Complex logic from Controllers/HostController.cs lines 151-220
        available_from = self.request.query_params.get('available_from')
        if available_from:
            queryset = self._filter_by_availability(queryset, available_from)

        # Exclude user's own projects from results (for search/browse pages)
        if self.request.query_params.get('exclude_own') == 'true' and self.request.user.is_authenticated:
            queryset = queryset.exclude(owner=self.request.user)

        return queryset.select_related('owner', 'address', 'address__country').prefetch_related('skills', 'images')

    def _filter_by_availability(self, queryset, date_str):
        """
        Filter projects by availability.

        Logic: Project must have at least one overlapping month available.

        Based on: Controllers/HostController.cs lines 151-220
        """
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            year = date.year
            month = date.month

            # Map month number to field name
            month_fields = {
                1: 'january', 2: 'february', 3: 'march', 4: 'april',
                5: 'may', 6: 'june', 7: 'july', 8: 'august',
                9: 'september', 10: 'october', 11: 'november', 12: 'december'
            }
            month_field = month_fields[month]

            # Filter projects that have availability for this month/year
            project_ids = Availability.objects.filter(
                year=year,
                **{month_field: True}
            ).values_list('project_id', flat=True)

            queryset = queryset.filter(id__in=project_ids)
        except (ValueError, KeyError):
            # Invalid date format, ignore filter
            pass

        return queryset

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action == 'create':
            return ProjectCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ProjectUpdateSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        """Set owner to current user when creating project"""
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['get'])
    def availabilities(self, request, pk=None):
        """
        Get project availabilities.

        GET /api/projects/{id}/availabilities/
        """
        project = self.get_object()
        serializer = AvailabilitySerializer(project.availabilities.all(), many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def set_availabilities(self, request, pk=None):
        """
        Set project availabilities.

        POST /api/projects/{id}/set_availabilities/

        Body: [
            {"year": 2024, "january": true, "february": false, ...},
            {"year": 2025, "january": true, ...}
        ]
        """
        project = self.get_object()

        # Check if user is owner
        if project.owner != request.user:
            return Response(
                {'error': 'Only the project owner can update availabilities.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Delete existing availabilities
        project.availabilities.all().delete()

        # Create new availabilities
        availabilities_data = request.data
        if not isinstance(availabilities_data, list):
            return Response(
                {'error': 'Expected list of availability objects.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        for availability_data in availabilities_data:
            Availability.objects.create(project=project, **availability_data)

        # Return updated availabilities
        serializer = AvailabilitySerializer(project.availabilities.all(), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def map_data(self, request):
        """
        Get projects data optimized for map display.

        GET /api/projects/map_data/

        Returns: Minimal data for map markers (id, title, lat, lng, cover_image)

        Based on: Controllers/HostController.cs lines 233-244
        """
        queryset = self.get_queryset()

        # Apply same filters as list view
        queryset = self.filter_queryset(queryset)

        # Return minimal data for performance
        data = []
        for project in queryset:
            cover_image = project.images.filter(order=0).first()
            data.append({
                'id': project.id,
                'title': project.title,
                'description_preview': project.description[:400] if len(project.description) > 400 else project.description,
                'latitude': float(project.address.latitude),
                'longitude': float(project.address.longitude),
                'cover_image': request.build_absolute_uri(cover_image.image.url) if cover_image else None,
                'project_type': project.project_type,
            })

        return Response(data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def flag(self, request, pk=None):
        """
        Flag a project for community moderation.

        POST /api/projects/{id}/flag/

        After 3 flags, project becomes invisible (is_visible = False).
        """
        project = self.get_object()

        # Prevent owner from flagging own project
        if project.owner == request.user:
            return Response(
                {'error': 'You cannot flag your own project.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Increment flag count
        project.flagged_count += 1
        project.save()

        return Response({
            'message': 'Project flagged successfully.',
            'flagged_count': project.flagged_count,
            'is_visible': project.is_visible
        })
