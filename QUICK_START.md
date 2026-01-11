# Ecobilda - Quick Start Guide

Guide rapide pour lancer l'environnement de développement local.

## Prérequis

1. **Docker Desktop** - Pour PostgreSQL et Redis
2. **Python 3.11** - Pour Django backend
3. **Node.js 18+** - Pour React frontend
4. **Git Bash ou PowerShell** - Terminal

## Étape 1: Démarrer les services Docker

Dans PowerShell ou un terminal avec Docker:

```bash
# Démarrer PostgreSQL et Redis
.\start-dev.ps1
```

Ou manuellement:

```bash
docker run -d --name ecobilda-postgres -e POSTGRES_DB=ecobilda -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15

docker run -d --name ecobilda-redis -p 6379:6379 redis:7-alpine
```

## Étape 2: Backend Django

Dans Git Bash (terminal 1):

```bash
cd backend

# Créer l'environnement virtuel avec Python 3.11
py -3.11 -m venv venv

# Activer
source venv/Scripts/activate

# Installer les dépendances
pip install -r requirements/development.txt

# Lancer Django
./run-django.sh
```

Le backend sera disponible sur: **http://localhost:8000**

## Étape 3: Celery Worker

Dans Git Bash (terminal 2):

```bash
cd backend

# Activer l'environnement virtuel
source venv/Scripts/activate

# Lancer Celery
./run-celery.sh
```

## Étape 4: Frontend React

Dans Git Bash (terminal 3):

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer Vite
./run-frontend.sh
```

Le frontend sera disponible sur: **http://localhost:5173**

## Vérification

- **Backend API**: http://localhost:8000/api/
- **Backend Admin**: http://localhost:8000/admin/
- **Frontend**: http://localhost:5173
- **Celery**: Vérifier les logs dans terminal 2

## Commandes utiles

### Arrêter les services Docker

```bash
docker stop ecobilda-postgres ecobilda-redis
docker rm ecobilda-postgres ecobilda-redis
```

### Créer un superuser Django

```bash
cd backend
source venv/Scripts/activate
python manage.py createsuperuser
```

### Reset base de données

```bash
cd backend
source venv/Scripts/activate
python manage.py flush
python manage.py migrate
```

## Problèmes courants

### "Docker is not running"
- Démarrer Docker Desktop
- Attendre que le whale icon soit vert

### "Port 5432 already in use"
```bash
docker stop ecobilda-postgres
docker rm ecobilda-postgres
```

### "ModuleNotFoundError: No module named 'xxx'"
```bash
cd backend
source venv/Scripts/activate
pip install -r requirements/development.txt
```

### Frontend - "Cannot find module"
```bash
cd frontend
rm -rf node_modules
npm install
```

## Notes importantes

### PostGIS temporairement désactivé

Pour simplifier le setup local sur Windows, PostGIS (GDAL) est désactivé dans `backend/config/settings/base.py`.

**À réactiver pour la production:**

1. Ligne 25: Décommenter `'django.contrib.gis',`
2. Ligne 97: Changer engine vers `'django.contrib.gis.db.backends.postgis'`
3. Installer GDAL sur le serveur

### Versions Python

Utiliser **Python 3.11** (pas 3.13) car Pillow n'est pas encore compatible.

```bash
# Vérifier les versions installées
py --list

# Créer venv avec version spécifique
py -3.11 -m venv venv
```

## Prochaines étapes

1. Créer un superuser: `python manage.py createsuperuser`
2. Tester l'authentification: http://localhost:8000/api/auth/login/
3. Tester le WebSocket chat (voir TESTING_REALTIME.md)
4. Tester les notifications email avec Celery

Pour plus de détails sur les tests, consulter: **TESTING_REALTIME.md**
