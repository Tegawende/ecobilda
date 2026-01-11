"""
Main URL configuration for Ecobilda API.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API endpoints (order matters - more specific first)
    path('api/auth/', include('apps.authentication.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/', include('apps.messaging.urls')),  # Conversations and messages
    path('api/', include('apps.notifications.urls')),  # Notifications
    path('api/', include('apps.favorites.urls')),  # Favorites
    path('api/skills/', include('apps.skills.urls')),
    path('api/', include('apps.users.urls')),  # Keep last - has generic /users/ and /profile/
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
