"""
Management command to update project coordinates if missing.
Uses geocoding to get coordinates from address if needed.
"""

from django.core.management.base import BaseCommand
from apps.projects.models import Project
from apps.core.models import Address
import requests


class Command(BaseCommand):
    help = 'Update project coordinates if missing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--geocode',
            action='store_true',
            help='Use geocoding API to get coordinates for addresses without them',
        )
        parser.add_argument(
            '--project-id',
            type=int,
            help='Update coordinates for a specific project ID',
        )

    def geocode_address(self, address: Address):
        """Geocode an address using Nominatim (OpenStreetMap)"""
        if not address.formatted_address:
            return None, None

        try:
            url = 'https://nominatim.openstreetmap.org/search'
            params = {
                'q': address.formatted_address,
                'format': 'json',
                'limit': 1,
            }
            headers = {
                'User-Agent': 'Ecobilda/1.0',
            }

            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()

            if data and len(data) > 0:
                lat = float(data[0]['lat'])
                lon = float(data[0]['lon'])
                return lat, lon
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'  Geocoding failed for {address.formatted_address}: {e}')
            )

        return None, None

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Checking project coordinates...'))

        # Get projects to check
        if options['project_id']:
            projects = Project.objects.filter(id=options['project_id'])
        else:
            projects = Project.objects.all()

        total_projects = projects.count()
        self.stdout.write(f'Checking {total_projects} project(s)...')

        missing_coords = 0
        updated = 0
        errors = 0

        for project in projects:
            try:
                address = project.address
                if not address:
                    self.stdout.write(
                        self.style.WARNING(f'Project {project.id} has no address')
                    )
                    errors += 1
                    continue

                has_coords = address.latitude is not None and address.longitude is not None

                if not has_coords:
                    missing_coords += 1
                    self.stdout.write(
                        self.style.WARNING(
                            f'Project {project.id} ({project.title}) missing coordinates'
                        )
                    )

                    if options['geocode']:
                        self.stdout.write(f'  Geocoding address: {address.formatted_address}')
                        lat, lon = self.geocode_address(address)

                        if lat and lon:
                            address.latitude = lat
                            address.longitude = lon
                            address.save(update_fields=['latitude', 'longitude'])
                            updated += 1
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'  ✓ Updated coordinates: {lat}, {lon}'
                                )
                            )
                        else:
                            self.stdout.write(
                                self.style.ERROR('  ✗ Geocoding failed')
                            )
                            errors += 1
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                '  Use --geocode to automatically geocode addresses'
                            )
                        )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Project {project.id} has coordinates: {address.latitude}, {address.longitude}'
                        )
                    )

            except Exception as e:
                errors += 1
                self.stdout.write(
                    self.style.ERROR(f'✗ Error processing project {project.id}: {e}')
                )

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS(f'Summary:'))
        self.stdout.write(self.style.SUCCESS(f'  Total projects checked: {total_projects}'))
        self.stdout.write(self.style.SUCCESS(f'  With coordinates: {total_projects - missing_coords}'))
        self.stdout.write(self.style.WARNING(f'  Missing coordinates: {missing_coords}'))
        if options['geocode']:
            self.stdout.write(self.style.SUCCESS(f'  Updated: {updated}'))
            self.stdout.write(self.style.ERROR(f'  Errors: {errors}'))
        self.stdout.write(self.style.SUCCESS('=' * 50))

        if missing_coords > 0 and not options['geocode']:
            self.stdout.write('')
            self.stdout.write(
                self.style.WARNING(
                    'Run with --geocode to automatically geocode addresses without coordinates'
                )
            )


