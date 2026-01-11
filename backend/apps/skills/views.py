"""
Skills views for Ecobilda API.
Read-only endpoints for skill reference data.
"""

from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Skill
from .serializers import SkillSerializer


class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only ViewSet for Skills.

    Skills are pre-loaded fixtures (16 skills with 4-language translations).
    Users can only read, not create/update/delete.

    GET /api/skills/ - List all skills
    GET /api/skills/{code}/ - Get specific skill

    Query parameters:
    - lang: Language code (en, fr, es, de) for translated display names
    - category: Filter by category (PERM, NATB)
    """
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [AllowAny]
    lookup_field = 'code'  # Use code instead of ID for lookup

    def get_queryset(self):
        """
        Filter skills by category if provided.
        """
        queryset = super().get_queryset()

        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category.upper())

        return queryset
