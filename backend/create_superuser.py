import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User

# Create superuser
email = 'aurelien_lef@hotmail.fr'
password = 'Ecobilda2024!'

if User.objects.filter(email=email).exists():
    print(f'User {email} already exists!')
else:
    user = User.objects.create_superuser(
        email=email,
        password=password,
        first_name='Aurélien',
        last_name='Lefebvre'
    )
    print(f'Superuser created successfully!')
    print(f'Email: {email}')
    print(f'Password: {password}')
    print(f'\nYou can login at:')
    print(f'- Admin: http://localhost:8000/admin')
    print(f'- Frontend: http://localhost:5175/login')
