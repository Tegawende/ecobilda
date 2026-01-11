#!/bin/bash
echo "========================================"
echo " Starting Celery Worker"
echo "========================================"
echo ""

# Activate virtual environment
source venv/Scripts/activate

echo ""
echo "========================================"
echo " Celery Worker Running"
echo " Broker: Redis (localhost:6379)"
echo " Tasks: Email notifications"
echo "========================================"
echo ""

# Start Celery worker with info logging
# --pool=solo is required on Windows
celery -A config worker -l info --pool=solo
