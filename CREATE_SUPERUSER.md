# Créer un Super User Django - Guide Rapide

## Méthode 1: Avec Docker (Recommandé)

Si ton backend tourne dans Docker:

```bash
# Se connecter au container backend
docker-compose exec backend bash

# Créer le superuser
python manage.py createsuperuser

# Suivre les instructions:
# - Username: admin (ou ce que tu veux)
# - Email: ton@email.com
# - Password: **********
# - Password (again): **********
```

## Méthode 2: Sans Docker

Si tu run le backend directement:

```bash
cd backend
python manage.py createsuperuser
```

## Informations à fournir

Le script te demandera:
1. **Username**: Par exemple `admin` ou ton prénom
2. **Email**: Ton adresse email
3. **Password**: Un mot de passe sécurisé (minimum 8 caractères)
4. **Password (again)**: Confirmation du mot de passe

## Utiliser le Superuser

Une fois créé, tu peux:

### 1. Accéder à l'admin Django
- URL: http://localhost:8000/admin
- Login avec username/password que tu viens de créer
- Tu auras accès à tous les modèles (Users, Projects, Skills, etc.)

### 2. Te connecter sur le frontend
- URL: http://localhost:5175/login
- Utilise le même email et password
- Tu seras connecté comme admin

## Exemple Complet

```bash
# 1. Lancer Docker
docker-compose up -d

# 2. Créer le superuser
docker-compose exec backend python manage.py createsuperuser

# Entrées suggérées:
# Username: admin
# Email: admin@ecobilda.com
# Password: Admin123!
# Password (again): Admin123!

# 3. Vérifier dans l'admin
# Ouvrir http://localhost:8000/admin
# Login: admin@ecobilda.com / Admin123!
```

## Troubleshooting

### Erreur "no such table: auth_user"
```bash
# Run les migrations d'abord
docker-compose exec backend python manage.py migrate
# Puis créer le superuser
docker-compose exec backend python manage.py createsuperuser
```

### Mot de passe trop simple refusé
Django refuse les mots de passe trop simples. Utilise au moins:
- 8 caractères
- Mélange de lettres et chiffres
- Pas juste "password" ou "12345678"

### Container backend pas démarré
```bash
# Vérifier que le backend tourne
docker-compose ps

# Si pas démarré, le lancer
docker-compose up -d backend
```

## Note Importante

Le superuser aura **tous les droits** sur l'application:
- Créer/modifier/supprimer des projets
- Voir tous les utilisateurs
- Accéder à l'admin Django
- Modifier toutes les données

Ne partage jamais les credentials du superuser!
