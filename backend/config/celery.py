"""
Celery configuration for Ecobilda.

This module configures Celery for async task processing.
Used for email notifications with anti-spam logic.
"""

import os
from celery import Celery

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

# Create Celery app
app = Celery('ecobilda')

# Load config from Django settings (namespace='CELERY')
# All celery-related settings must use CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
# Looks for tasks.py in each app
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to test Celery is working."""
    print(f'Request: {self.request!r}')
