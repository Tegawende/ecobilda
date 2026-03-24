from django.urls import path

from . import views

app_name = 'administration'

urlpatterns = [
    # Dashboard
    path('stats/dashboard/', views.DashboardStatsView.as_view(), name='dashboard-stats'),

    # Projects
    path('projects/pending/', views.PendingProjectsView.as_view(), name='projects-pending'),
    path('projects/validated/', views.ValidatedProjectsView.as_view(), name='projects-validated'),
    path('projects/<int:pk>/', views.ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<int:pk>/validate/', views.ValidateProjectView.as_view(), name='project-validate'),
    path('projects/<int:pk>/reject/', views.RejectProjectView.as_view(), name='project-reject'),
    path('projects/<int:pk>/invalidate/', views.InvalidateProjectView.as_view(), name='project-invalidate'),

    # Users
    path('users/', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/detail/', views.AdminUserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/block/', views.BlockUserView.as_view(), name='user-block'),
    path('users/<int:pk>/unblock/', views.UnblockUserView.as_view(), name='user-unblock'),
    path('users/<int:pk>/verify-email/', views.VerifyEmailView.as_view(), name='user-verify-email'),
    path('users/<int:pk>/unverify-email/', views.UnverifyEmailView.as_view(), name='user-unverify-email'),
    path('users/<int:pk>/', views.DeleteUserView.as_view(), name='user-delete'),

    # Reports (stubs)
    path('reports/', views.ReportListView.as_view(), name='report-list'),
    path('reports/pending/', views.PendingReportsView.as_view(), name='reports-pending'),
    path('reports/<int:pk>/resolve/', views.ResolveReportView.as_view(), name='report-resolve'),
]
