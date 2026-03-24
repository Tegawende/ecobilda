"""
Administration API views for Ecobilda admin panel.
All views require is_staff=True.
"""

from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import Address, Country
from apps.favorites.models import Favorite
from apps.messaging.models import Conversation, Message
from apps.projects.models import Project, ProjectImage
from apps.reviews.models import Review
from apps.skills.models import Skill
from apps.users.models import User

from .permissions import IsAdminUser


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        thirty_days_ago = now - timedelta(days=30)

        # Users
        users_qs = User.objects.all()
        users_total = users_qs.count()
        users_new = users_qs.filter(date_joined__gte=first_of_month).count()
        users_with_projects = User.objects.filter(projects__isnull=False).distinct().count()

        # Projects
        projects_qs = Project.objects.all()
        projects_total = projects_qs.count()
        projects_active = projects_qs.filter(status='ACTIVE').count()
        projects_pending = projects_qs.filter(status='PENDING').count()
        projects_rejected = projects_qs.filter(status='REJECTED').count()
        projects_new = projects_qs.filter(created_at__gte=first_of_month).count()

        # Reviews
        reviews_qs = Review.objects.all()
        reviews_total = reviews_qs.count()
        reviews_avg = reviews_qs.aggregate(avg=Avg('rating'))['avg'] or 0
        reviews_new = reviews_qs.filter(created_at__gte=first_of_month).count()

        # Messages & Favorites
        messages_total = Message.objects.count()
        favorites_total = Favorite.objects.count()

        # Top countries (by project count)
        top_countries = list(
            Project.objects.filter(address__isnull=False)
            .values('address__country__name', 'address__country__code')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        # Popular skills (by project count)
        popular_skills = list(
            Skill.objects.annotate(project_count=Count('projects'))
            .values('code', 'display_name_en', 'display_name_fr', 'project_count')
            .order_by('-project_count')[:10]
        )

        # Activity: users and projects per day for last 30 days
        users_by_day = list(
            User.objects.filter(date_joined__gte=thirty_days_ago)
            .annotate(date=TruncDate('date_joined'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        projects_by_day = list(
            Project.objects.filter(created_at__gte=thirty_days_ago)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        # Format dates as strings
        for entry in users_by_day:
            entry['date'] = entry['date'].isoformat()
        for entry in projects_by_day:
            entry['date'] = entry['date'].isoformat()

        return Response({
            'users': {
                'total': users_total,
                'new_this_month': users_new,
                'with_projects': users_with_projects,
            },
            'projects': {
                'total': projects_total,
                'active': projects_active,
                'pending': projects_pending,
                'rejected': projects_rejected,
                'new_this_month': projects_new,
            },
            'participations': {
                'total': 0,
                'pending': 0,
                'accepted': 0,
                'refused': 0,
                'new_this_month': 0,
                'conversion_rate': 0,
            },
            'reviews': {
                'total': reviews_total,
                'average_rating': round(float(reviews_avg), 2),
                'new_this_month': reviews_new,
            },
            'reports': {
                'total': 0,
                'pending': 0,
                'resolved': 0,
                'dismissed': 0,
            },
            'messages': {
                'total': messages_total,
            },
            'favorites': {
                'total': favorites_total,
            },
            'top_countries': top_countries,
            'popular_skills': popular_skills,
            'activity': {
                'users_by_day': users_by_day,
                'projects_by_day': projects_by_day,
            },
        })


# ---------------------------------------------------------------------------
# Helper serialization functions
# ---------------------------------------------------------------------------

def _serialize_user_short(user):
    """Minimal user representation for nested inclusion."""
    return {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
    }


def _serialize_address(address):
    if address is None:
        return None
    return {
        'id': address.id,
        'city': address.city,
        'street': address.street,
        'street_number': address.street_number,
        'postal_code': address.postal_code,
        'country': {
            'code': address.country.code,
            'name': address.country.name,
        } if address.country else None,
        'latitude': str(address.latitude),
        'longitude': str(address.longitude),
        'formatted_address': address.formatted_address,
    }


def _serialize_project_list(project):
    """Serialise a project for list views (pending / validated)."""
    return {
        'id': project.id,
        'title': project.title,
        'description': project.description,
        'project_type': project.project_type,
        'status': project.status,
        'rejection_reason': project.rejection_reason,
        'owner': _serialize_user_short(project.owner),
        'address': _serialize_address(project.address),
        'created_at': project.created_at.isoformat(),
        'updated_at': project.updated_at.isoformat(),
        'validated_at': project.validated_at.isoformat() if project.validated_at else None,
        'validated_by': _serialize_user_short(project.validated_by) if project.validated_by else None,
        'images': [
            {
                'id': img.id,
                'image': img.image.url if img.image else None,
                'order': img.order,
            }
            for img in project.images.all()
        ],
        'skills': [
            {
                'code': s.code,
                'display_name_en': s.display_name_en,
                'display_name_fr': s.display_name_fr,
                'category': s.category,
            }
            for s in project.skills.all()
        ],
    }


def _serialize_project_detail(project):
    """Full serialization for project detail view."""
    data = _serialize_project_list(project)
    data.update({
        'hours_per_day': project.hours_per_day,
        'days_per_week': project.days_per_week,
        'max_helpers': project.max_helpers,
        'accommodation_details': project.accommodation_details,
        'food_details': project.food_details,
        'internet_provided': project.internet_provided,
        'family_friendly': project.family_friendly,
        'pets_allowed': project.pets_allowed,
        'smoking_allowed': project.smoking_allowed,
        'is_active': project.is_active,
        'flagged_count': project.flagged_count,
    })
    return data


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

class PendingProjectsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        projects = (
            Project.objects.filter(status='PENDING')
            .select_related('owner', 'address', 'address__country', 'validated_by')
            .prefetch_related('images', 'skills')
            .order_by('-created_at')
        )
        return Response([_serialize_project_list(p) for p in projects])


class ValidatedProjectsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        projects = (
            Project.objects.filter(status='ACTIVE')
            .select_related('owner', 'address', 'address__country', 'validated_by')
            .prefetch_related('images', 'skills')
            .order_by('-created_at')
        )
        return Response([_serialize_project_list(p) for p in projects])


class ProjectDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            project = (
                Project.objects
                .select_related('owner', 'address', 'address__country', 'validated_by')
                .prefetch_related('images', 'skills')
                .get(pk=pk)
            )
        except Project.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(_serialize_project_detail(project))


class ValidateProjectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        project.status = 'ACTIVE'
        project.validated_at = timezone.now()
        project.validated_by = request.user
        project.rejection_reason = ''
        project.save(update_fields=['status', 'validated_at', 'validated_by', 'rejection_reason'])
        return Response({'detail': 'Project validated.'})


class RejectProjectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '')
        if not reason:
            return Response(
                {'detail': 'A rejection reason is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project.status = 'REJECTED'
        project.rejection_reason = reason
        project.save(update_fields=['status', 'rejection_reason'])
        return Response({'detail': 'Project rejected.'})


class InvalidateProjectView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
        except Project.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        project.status = 'PENDING'
        project.validated_at = None
        project.validated_by = None
        project.save(update_fields=['status', 'validated_at', 'validated_by'])
        return Response({'detail': 'Project set back to pending.'})


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def _serialize_user_full(user):
    """Full user representation for the admin user list."""
    return {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_active': user.is_active,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'email_verified': user.email_verified,
        'date_joined': user.date_joined.isoformat(),
        'last_login': user.last_login.isoformat() if user.last_login else None,
        'average_rating': float(user.average_rating),
        'review_count': user.review_count,
        'projects_count': getattr(user, 'projects_count', 0),
    }


class AdminUserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            user = (
                User.objects
                .select_related('address', 'address__country')
                .prefetch_related('languages')
                .get(pk=pk)
            )
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Get skills via reverse M2M relation (Skill.users -> user.skills)
        skills = user.skills.all()

        # Get projects
        projects = Project.objects.filter(owner=user).order_by('-created_at')

        # Get reviews received
        reviews_received = (
            Review.objects
            .filter(receiver=user)
            .select_related('writer')
            .order_by('-created_at')
        )

        # Favorites count
        favorites_count = Favorite.objects.filter(user=user).count()

        data = {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
            'gender': user.gender,
            'bio': user.bio,
            'profile_picture': user.profile_picture.url if user.profile_picture else None,
            'profile_picture_url': user.profile_picture_url,
            'email_verified': user.email_verified,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_active': user.is_active,
            'email_notifications': user.email_notifications,
            'newsletter': user.newsletter,
            'in_app_notifications': user.in_app_notifications,
            'notification_language': user.notification_language,
            'average_rating': float(user.average_rating),
            'review_count': user.review_count,
            'date_joined': user.date_joined.isoformat(),
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'created_at': user.created_at.isoformat(),
            'updated_at': user.updated_at.isoformat(),
            'address': _serialize_address(user.address) if user.address else None,
            'languages': [
                {'code': lang.code, 'name': lang.name}
                for lang in user.languages.all()
            ],
            'skills': [
                {
                    'code': s.code,
                    'display_name_en': s.display_name_en,
                    'display_name_fr': s.display_name_fr,
                    'category': s.category,
                }
                for s in skills
            ],
            'projects_count': projects.count(),
            'projects': [
                {
                    'id': p.id,
                    'title': p.title,
                    'status': p.status,
                    'project_type': p.project_type,
                    'created_at': p.created_at.isoformat(),
                }
                for p in projects
            ],
            'reviews_received': [
                {
                    'id': r.id,
                    'writer': f"{r.writer.first_name} {r.writer.last_name}",
                    'rating': float(r.rating),
                    'feedback': r.feedback,
                    'created_at': r.created_at.isoformat(),
                }
                for r in reviews_received
            ],
            'favorites_count': favorites_count,
        }

        return Response(data)


class UserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        search = request.query_params.get('search', '').strip()

        qs = User.objects.annotate(projects_count=Count('projects'))

        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
            )

        qs = qs.order_by('-date_joined')
        total = qs.count()

        start = (page - 1) * page_size
        end = start + page_size
        users = qs[start:end]

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': [_serialize_user_full(u) for u in users],
        })


class BlockUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'detail': 'User blocked.'})


class UnblockUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({'detail': 'User unblocked.'})


class VerifyEmailView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.email_verified = True
        user.save(update_fields=['email_verified'])
        return Response({'detail': 'Email verified.'})


class UnverifyEmailView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.email_verified = False
        user.save(update_fields=['email_verified'])
        return Response({'detail': 'Email unverified.'})


class DeleteUserView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_staff or user.is_superuser:
            return Response(
                {'detail': 'Cannot delete staff or superuser accounts.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Reports (stubs)
# ---------------------------------------------------------------------------

class ReportListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({'count': 0, 'results': []})


class PendingReportsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({'count': 0, 'results': []})


class ResolveReportView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
