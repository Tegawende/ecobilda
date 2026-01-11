"""
Management command to create test projects with coordinates and images.
This will also update existing projects with realistic coordinates.
"""

from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.contrib.auth import get_user_model
from apps.projects.models import Project, ProjectImage, Availability, ProjectType
from apps.core.models import Address, Country
from apps.skills.models import Skill
from io import BytesIO
from PIL import Image as PILImage
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test projects with coordinates and images for development'

    def add_arguments(self, parser):
        parser.add_argument(
            '--update-existing',
            action='store_true',
            help='Update existing projects with coordinates',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating test projects...'))

        # France and Belgium coordinates for different cities
        france_belgium_cities = [
            {'city': 'Lyon', 'country': 'FR', 'lat': 45.764043, 'lon': 4.835659},
            {'city': 'Marseille', 'country': 'FR', 'lat': 43.296482, 'lon': 5.369780},
            {'city': 'Toulouse', 'country': 'FR', 'lat': 43.604652, 'lon': 1.444209},
            {'city': 'Bordeaux', 'country': 'FR', 'lat': 44.837789, 'lon': -0.579180},
            {'city': 'Lille', 'country': 'FR', 'lat': 50.629250, 'lon': 3.057256},
            {'city': 'Bruxelles', 'country': 'BE', 'lat': 50.850340, 'lon': 4.351710},
            {'city': 'Anvers', 'country': 'BE', 'lat': 51.219448, 'lon': 4.402464},
            {'city': 'Liège', 'country': 'BE', 'lat': 50.632760, 'lon': 5.566750},
        ]

        # Update existing projects with coordinates
        if options['update_existing']:
            self.stdout.write('Updating existing projects with coordinates...')
            existing_projects = Project.objects.all()
            for project in existing_projects:
                if project.address:
                    city_data = random.choice(france_belgium_cities)
                    project.address.latitude = city_data['lat']
                    project.address.longitude = city_data['lon']
                    project.address.formatted_address = f"{city_data['city']}, {city_data['country']}"
                    project.address.save()
                    self.stdout.write(
                        self.style.SUCCESS(f"  Updated {project.title} with coordinates for {city_data['city']}")
                    )

        # Get or create test users
        test_users = []
        for i in range(3):
            email = f'testuser{i+1}@ecobilda.com'
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': f'Test{i+1}',
                    'last_name': f'User{i+1}',
                    'date_of_birth': '1990-01-01',
                    'is_active': True,
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created user: {email}'))
            test_users.append(user)

        # Get available skills
        skills = list(Skill.objects.all()[:10])
        if not skills:
            self.stdout.write(self.style.WARNING('No skills found. Please run skill seeding first.'))
            return

        # Get or create countries
        france, _ = Country.objects.get_or_create(code='FR', defaults={'name': 'France'})
        belgium, _ = Country.objects.get_or_create(code='BE', defaults={'name': 'Belgium'})

        # Test project data
        test_projects = [
            {
                'title': 'Permaculture Farm in Lyon',
                'description': 'Join our sustainable permaculture farm in Lyon. We practice regenerative agriculture and offer hands-on learning experiences. You will work with vegetables, fruits, and learn about soil management.',
                'project_type': ProjectType.PERMACULTURE,
                'city_data': france_belgium_cities[0],
                'hours_per_day': 5,
                'days_per_week': 5,
                'max_helpers': 3,
                'accommodation_details': 'Private room in farmhouse with shared bathroom. Cozy and warm environment.',
                'food_details': 'Organic vegetarian meals, fresh from the farm. Three meals a day included.',
                'internet_provided': True,
                'family_friendly': True,
                'pets_allowed': False,
                'smoking_allowed': False,
            },
            {
                'title': 'Natural Building Project in Marseille',
                'description': 'Help us build a beautiful eco-house using natural materials like straw bale, cob, and timber. Perfect for those interested in sustainable construction techniques.',
                'project_type': ProjectType.NATURAL_BUILDING,
                'city_data': france_belgium_cities[1],
                'hours_per_day': 6,
                'days_per_week': 5,
                'max_helpers': 4,
                'accommodation_details': 'Camping on site or room in nearby cottage. Beautiful surroundings.',
                'food_details': 'Communal cooking with local organic ingredients. Vegetarian and vegan options.',
                'internet_provided': True,
                'family_friendly': False,
                'pets_allowed': True,
                'smoking_allowed': False,
            },
            {
                'title': 'Organic Garden in Toulouse',
                'description': 'Small organic garden project focused on growing vegetables and herbs. Learn about companion planting and natural pest control methods.',
                'project_type': ProjectType.PERMACULTURE,
                'city_data': france_belgium_cities[2],
                'hours_per_day': 4,
                'days_per_week': 4,
                'max_helpers': 2,
                'accommodation_details': 'Shared room in main house with private bathroom.',
                'food_details': 'Breakfast and dinner included. Fresh organic produce daily.',
                'internet_provided': True,
                'family_friendly': True,
                'pets_allowed': True,
                'smoking_allowed': False,
            },
            {
                'title': 'Eco-Village Construction in Brussels',
                'description': 'Be part of building a new eco-village from scratch. Work on various natural building techniques and community infrastructure.',
                'project_type': ProjectType.NATURAL_BUILDING,
                'city_data': france_belgium_cities[5],
                'hours_per_day': 7,
                'days_per_week': 6,
                'max_helpers': 6,
                'accommodation_details': 'Temporary housing in yurts and cabins on site.',
                'food_details': 'Community kitchen with rotating cooking duties. Local and seasonal food.',
                'internet_provided': False,
                'family_friendly': True,
                'pets_allowed': False,
                'smoking_allowed': False,
            },
            {
                'title': 'Forest Garden in Bordeaux',
                'description': 'Establishing a food forest with diverse perennial crops. Learn about agroforestry and forest gardening techniques.',
                'project_type': ProjectType.PERMACULTURE,
                'city_data': france_belgium_cities[3],
                'hours_per_day': 5,
                'days_per_week': 5,
                'max_helpers': 3,
                'accommodation_details': 'Wooden cabin in the forest with basic amenities.',
                'food_details': 'Simple, healthy meals with foraged ingredients when possible.',
                'internet_provided': False,
                'family_friendly': False,
                'pets_allowed': False,
                'smoking_allowed': True,
            },
        ]

        # Create projects
        created_projects = []
        for i, project_data in enumerate(test_projects):
            city_data = project_data.pop('city_data')

            # Create address with coordinates
            country = france if city_data['country'] == 'FR' else belgium
            address = Address.objects.create(
                city=city_data['city'],
                postal_code='00000',
                country=country,
                latitude=city_data['lat'],
                longitude=city_data['lon'],
                formatted_address=f"{city_data['city']}, {country.name}"
            )

            # Create project
            owner = test_users[i % len(test_users)]
            project = Project.objects.create(
                owner=owner,
                address=address,
                **project_data
            )

            # Add random skills
            project.skills.set(random.sample(skills, min(3, len(skills))))

            # Create availability (available for next 6 months)
            current_year = 2025
            availability = Availability.objects.create(
                project=project,
                year=current_year,
                january=True,
                february=True,
                march=True,
                april=True,
                may=True,
                june=True,
                july=True,
                august=True,
            )

            # Create test images
            for img_num in range(3):
                # Create a simple colored placeholder image
                img = PILImage.new('RGB', (800, 600), color=(
                    random.randint(100, 200),
                    random.randint(150, 220),
                    random.randint(100, 180)
                ))

                buffer = BytesIO()
                img.save(buffer, format='JPEG')
                buffer.seek(0)

                project_image = ProjectImage.objects.create(
                    project=project,
                    order=img_num
                )
                project_image.image.save(
                    f'project_{project.id}_img_{img_num}.jpg',
                    ContentFile(buffer.read()),
                    save=True
                )

            created_projects.append(project)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created project: {project.title} (owned by {owner.email}) with 3 images'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSuccessfully created {len(created_projects)} test projects with coordinates and images!'
            )
        )
        self.stdout.write('You can now test:')
        self.stdout.write('  - Favorites functionality')
        self.stdout.write('  - Project detail pages with images')
        self.stdout.write('  - Map display with markers')
