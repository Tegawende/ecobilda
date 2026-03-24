"""
User URLs for Ecobilda API.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ProfileViewSet

app_name = 'users'

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'profile', ProfileViewSet, basename='profile')

urlpatterns = [
    # Allow PATCH/PUT on /api/profile/ without pk (updates current user)
    path('profile/', ProfileViewSet.as_view({'get': 'list', 'patch': 'partial_update', 'put': 'update'}), name='profile-detail-no-pk'),
    path('', include(router.urls)),
]
