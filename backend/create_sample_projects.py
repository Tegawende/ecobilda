"""
Create sample projects for testing Ecobilda platform.
"""
import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.projects.models import Project, Availability
from apps.skills.models import Skill
from apps.core.models import Address, Country

# Get or create the admin user
user_email = 'aurelien_lef@hotmail.fr'
try:
    user = User.objects.get(email=user_email)
    print(f'Using existing user: {user.email}')
except User.DoesNotExist:
    print(f'User {user_email} not found!')
    exit(1)

# Sample projects data
projects_data = [
    {
        'title': 'Organic Farm Restoration in Provence',
        'project_type': 'PERM',
        'description': '''Join us in restoring a 5-hectare organic farm in the beautiful Provence region.

We're creating a permaculture paradise with food forests, market gardens, and regenerative agriculture practices. This project focuses on soil restoration, water management, and creating biodiversity corridors.

What you'll learn:
- Permaculture design principles
- Composting and soil building
- Water harvesting techniques
- Food forest establishment
- Companion planting

Accommodation includes a shared dormitory in a renovated barn with a fully equipped kitchen. We eat organic, locally-sourced meals together.''',
        'hours_per_day': 6,
        'days_per_week': 5,
        'max_helpers': 6,
        'accommodation_details': 'Shared dormitory in renovated barn with kitchen, bathroom, and common areas. Bedding provided.',
        'food_details': 'Organic vegetarian meals prepared together. Ingredients from farm and local markets.',
        'city': 'Avignon',
        'postal_code': '84000',
        'country_code': 'FR',
        'latitude': 43.9493,
        'longitude': 4.8055,
        'internet_provided': True,
        'family_friendly': True,
        'pets_allowed': False,
        'smoking_allowed': False,
        'skills': ['COMP', 'WATE', 'PEST', 'HARV'],
        'available_months': [4, 5, 6, 7, 8]  # April to August
    },
    {
        'title': 'Strawbale House Construction in Scotland',
        'project_type': 'NATB',
        'description': '''Help build an eco-friendly strawbale house in the Scottish Highlands!

We're constructing a beautiful two-story home using natural building techniques. This hands-on project will teach you the complete process from foundation to roof.

Skills you'll gain:
- Strawbale wall construction
- Natural plaster mixing and application
- Timber frame carpentry
- Roof installation
- Foundation work

The project runs through summer, and you'll camp on-site with access to outdoor showers and composting toilets. Meals are provided, with ingredients from our kitchen garden.

Perfect for those wanting to learn natural building in a stunning location!''',
        'hours_per_day': 7,
        'days_per_week': 6,
        'max_helpers': 8,
        'accommodation_details': 'Camping on-site. Bring your own tent. Outdoor shower and composting toilets available.',
        'food_details': 'Three meals daily. Mix of vegetarian and meat dishes. Ingredients from kitchen garden and local farms.',
        'city': 'Inverness',
        'postal_code': 'IV1',
        'country_code': 'GB',
        'latitude': 57.4778,
        'longitude': -4.2247,
        'internet_provided': False,
        'family_friendly': False,
        'pets_allowed': False,
        'smoking_allowed': True,
        'skills': ['STRA', 'PLAS', 'TIMB', 'FOUN'],
        'available_months': [6, 7, 8]  # June to August
    },
    {
        'title': 'Earthship Build in New Mexico',
        'project_type': 'NATB',
        'description': '''Join our earthship community build in the desert of New Mexico!

We're constructing a fully off-grid earthship using recycled tires, bottles, and cans. This radical sustainable home will feature:
- Passive solar heating and cooling
- Rainwater harvesting
- Greywater treatment
- Indoor food production
- Thermal mass walls

This is an intensive building project where you'll learn cutting-edge sustainable architecture techniques. Previous building experience helpful but not required.

We provide camping space, outdoor kitchen, and communal meals. Bring your own tent and sleeping gear.''',
        'hours_per_day': 8,
        'days_per_week': 6,
        'max_helpers': 10,
        'accommodation_details': 'Tent camping on desert land. Outdoor kitchen and bathroom facilities. Bring warm sleeping bag for cold nights.',
        'food_details': 'Communal meals cooked in outdoor kitchen. Mostly vegetarian with occasional meat. Everyone helps with cooking.',
        'city': 'Taos',
        'postal_code': '87571',
        'country_code': 'US',
        'latitude': 36.4072,
        'longitude': -105.5731,
        'internet_provided': True,
        'family_friendly': False,
        'pets_allowed': True,
        'smoking_allowed': False,
        'skills': ['EART', 'TIMB', 'PLAS', 'FOUN'],
        'available_months': [4, 5, 6, 7, 8, 9]  # April to September
    },
    {
        'title': 'Permaculture Garden Design in Portugal',
        'project_type': 'PERM',
        'description': '''Create a demonstration permaculture garden at our eco-retreat center!

We're transforming 2 hectares of land into a showcase permaculture site with zones for education, food production, and natural habitat. This project combines design, implementation, and teaching.

Project highlights:
- Design food forests and guild plantings
- Install swales and water retention systems
- Build raised beds and hugelkultur mounds
- Create composting systems
- Establish herb spirals and mandala gardens

Accommodation in shared rooms with ocean views. We cook together using organic produce from local markets and our existing gardens. Portuguese language lessons available!

Great for permaculture design course graduates wanting practical experience.''',
        'hours_per_day': 5,
        'days_per_week': 5,
        'max_helpers': 5,
        'accommodation_details': 'Shared rooms (2-3 people) in eco-retreat center. Ocean views, hot showers, shared kitchen and lounge.',
        'food_details': 'Organic vegetarian meals cooked together. Fresh produce from local markets and our gardens. Optional Portuguese cooking classes.',
        'city': 'Lagos',
        'postal_code': '8600',
        'country_code': 'PT',
        'latitude': 37.1028,
        'longitude': -8.6742,
        'internet_provided': True,
        'family_friendly': True,
        'pets_allowed': True,
        'smoking_allowed': False,
        'skills': ['PEST', 'WATE', 'COMP', 'HARV'],
        'available_months': [3, 4, 5, 9, 10]  # March to May, Sept to Oct
    },
    {
        'title': 'Cob Building Workshop in Wales',
        'project_type': 'NATB',
        'description': '''Learn the ancient art of cob building in beautiful Wales!

We're adding a cob studio to our eco-village using traditional Welsh techniques. Cob (clay, sand, and straw) creates beautiful, sculptural buildings that last for centuries.

You'll learn:
- Clay soil testing and mixing
- Cob wall building techniques
- Natural window and door installation
- Earthen floor construction
- Lime plaster finishing

This is a playful, creative building method that anyone can learn. Come get your hands dirty and create something beautiful!

Stay in our guest yurts with wood-burning stoves. Vegetarian meals provided. Weekly trips to local beaches and hiking trails.''',
        'hours_per_day': 6,
        'days_per_week': 5,
        'max_helpers': 6,
        'accommodation_details': 'Comfortable yurts with wood-burning stoves and mattresses. Shared bathroom facilities with hot showers.',
        'food_details': 'Three vegetarian meals daily. Emphasis on local, seasonal, organic ingredients. Weekly community dinners.',
        'city': 'Aberystwyth',
        'postal_code': 'SY23',
        'country_code': 'GB',
        'latitude': 52.4140,
        'longitude': -4.0828,
        'internet_provided': True,
        'family_friendly': True,
        'pets_allowed': False,
        'smoking_allowed': False,
        'skills': ['COBN', 'PLAS', 'FOUN', 'TIMB'],
        'available_months': [5, 6, 7, 8]  # May to August
    },
]

print('\nCreating sample projects...\n')

created_count = 0
current_year = date.today().year

for project_data in projects_data:
    # Extract data that needs special handling
    skill_codes = project_data.pop('skills')
    available_months = project_data.pop('available_months')
    city = project_data.pop('city')
    postal_code = project_data.pop('postal_code')
    country_code = project_data.pop('country_code')
    latitude = project_data.pop('latitude')
    longitude = project_data.pop('longitude')

    # Get or create country
    country, _ = Country.objects.get_or_create(
        code=country_code,
        defaults={'name': country_code}  # You may want to add proper names
    )

    # Create address
    address = Address.objects.create(
        street='',  # Not needed for MVP
        city=city,
        postal_code=postal_code,
        country=country,
        latitude=latitude,
        longitude=longitude
    )

    # Create project
    project = Project.objects.create(
        owner=user,
        address=address,
        **project_data
    )

    # Add skills
    for skill_code in skill_codes:
        try:
            skill = Skill.objects.get(code=skill_code)
            project.skills.add(skill)
        except Skill.DoesNotExist:
            print(f'Warning: Skill {skill_code} not found, skipping')

    # Create availability for current year
    availability = Availability.objects.create(
        project=project,
        year=current_year
    )

    # Set available months
    month_names = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ]
    for month_num in available_months:
        month_name = month_names[month_num - 1]
        setattr(availability, month_name, True)
    availability.save()

    created_count += 1
    print(f'✓ Created: {project.title}')
    print(f'  Type: {project.get_project_type_display()}')
    print(f'  Location: {city}, {country_code}')
    print(f'  Work: {project.hours_per_day}h/day, {project.days_per_week} days/week')
    print(f'  Skills: {", ".join(skill_codes)}')
    print(f'  Available: {", ".join([month_names[m-1].capitalize() for m in available_months])}')
    print()

print(f'\n✓ Successfully created {created_count} sample projects!\n')
