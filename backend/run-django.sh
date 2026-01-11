#!/bin/bash
echo "========================================"
echo " Starting Django Development Server"
echo "========================================"
echo ""

# Activate virtual environment
source venv/Scripts/activate

# Run migrations (in case there are new ones)
echo "Running migrations..."
python manage.py migrate

echo ""
echo "========================================"
echo " Django running on http://localhost:8000"
echo " Admin: http://localhost:8000/admin/"
echo " API Docs: http://localhost:8000/api/"
echo "========================================"
echo ""

# Start Django with ASGI support (for WebSockets)
python manage.py runserver
