"""
Management command to add images to existing projects using mock URLs.
Downloads images from Unsplash URLs and stores them in ProjectImage model.
"""

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from apps.projects.models import Project, ProjectImage
import urllib.request
import urllib.error
from io import BytesIO


class Command(BaseCommand):
    help = 'Add images to existing projects using mock URLs from ProjectCard'

    # Mock images from ProjectCard.tsx
    PERM_IMAGES = [
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ]

    NATB_IMAGES = [
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            help='Skip projects that already have images',
        )
        parser.add_argument(
            '--project-id',
            type=int,
            help='Add images only to a specific project ID',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Adding images to projects...'))

        # Get projects to process
        if options['project_id']:
            projects = Project.objects.filter(id=options['project_id'])
        else:
            projects = Project.objects.all()

        if options['skip_existing']:
            projects = projects.filter(images__isnull=True).distinct()

        total_projects = projects.count()
        self.stdout.write(f'Processing {total_projects} project(s)...')

        success_count = 0
        error_count = 0

        for project in projects:
            try:
                # Skip if project already has images and we're skipping existing
                if options['skip_existing'] and project.images.exists():
                    self.stdout.write(
                        self.style.WARNING(f'Skipping project {project.id} - already has images')
                    )
                    continue

                # Determine which images to use based on project type
                image_urls = (
                    self.PERM_IMAGES if project.project_type == 'PERM' else self.NATB_IMAGES
                )

                # Use project ID to select consistent images (same logic as frontend)
                num_images = 3 + (project.id % 3)
                selected_images = image_urls[:num_images]

                # Delete existing images if any
                if not options['skip_existing']:
                    project.images.all().delete()

                # Download and save images
                for idx, image_url in enumerate(selected_images):
                    try:
                        # Download image
                        with urllib.request.urlopen(image_url, timeout=10) as response:
                            image_data = response.read()

                        # Create ProjectImage instance
                        project_image = ProjectImage.objects.create(
                            project=project,
                            order=idx,  # 0 = cover image
                        )

                        # Save image file
                        filename = f'project_{project.id}_img_{idx}.jpg'
                        project_image.image.save(
                            filename,
                            ContentFile(image_data),
                            save=True
                        )

                        self.stdout.write(
                            f'  ✓ Added image {idx + 1}/{len(selected_images)} to project {project.id}'
                        )

                    except urllib.error.URLError as e:
                        self.stdout.write(
                            self.style.ERROR(
                                f'  ✗ Failed to download image {idx + 1} for project {project.id}: {e}'
                            )
                        )
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(
                                f'  ✗ Error adding image {idx + 1} for project {project.id}: {e}'
                            )
                        )

                success_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Successfully added {len(selected_images)} images to project {project.id}: {project.title}'
                    )
                )

            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(
                        f'✗ Failed to process project {project.id}: {e}'
                    )
                )

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS(f'Summary:'))
        self.stdout.write(self.style.SUCCESS(f'  Total projects processed: {total_projects}'))
        self.stdout.write(self.style.SUCCESS(f'  Success: {success_count}'))
        self.stdout.write(self.style.ERROR(f'  Errors: {error_count}'))
        self.stdout.write(self.style.SUCCESS('=' * 50))


