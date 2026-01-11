FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements/base.txt requirements/development.txt ./requirements/
RUN pip install --no-cache-dir -r requirements/development.txt

# Copy project
COPY . .

# Create migrations and migrate on startup
CMD python manage.py migrate && python manage.py runserver 0.0.0.0:8000
