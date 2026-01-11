# Démarrage avec Docker - Super Simple! 🐳

## Prérequis
- Docker Desktop installé ✅ (tu l'as déjà!)

## Démarrer TOUT en une commande

```bash
docker-compose up --build
```

C'est tout! Cette commande va:
1. ✅ Créer PostgreSQL avec la base `ecobilda`
2. ✅ Créer Redis
3. ✅ Builder l'image Django
4. ✅ Lancer les migrations automatiquement
5. ✅ Démarrer Django sur http://localhost:8000
6. ✅ Démarrer Celery worker

## Vérifier que ça tourne

Ouvre un navigateur: http://localhost:8000/api/

Tu devrais voir la page de l'API!

## Créer un superuser

Dans un nouveau terminal (pendant que docker-compose tourne):

```bash
docker exec -it ecobilda-backend python manage.py createsuperuser
```

## Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Juste Django
docker-compose logs -f backend

# Juste Celery
docker-compose logs -f celery

# Juste PostgreSQL
docker-compose logs -f db
```

## Arrêter tout

```bash
# Ctrl+C dans le terminal où docker-compose tourne
# Puis:
docker-compose down
```

## Tout supprimer et recommencer

```bash
docker-compose down -v  # -v supprime aussi les volumes (base de données)
docker-compose up --build
```

## Frontend (reste en dehors de Docker)

Le frontend tourne encore localement:

```bash
cd frontend
npm run dev
```

Puis: http://localhost:5173

## Structure complète

Avec Docker Compose, tu as:

- **PostgreSQL**: `localhost:5432` (accessible depuis Windows aussi!)
- **Redis**: `localhost:6379` (accessible depuis Windows aussi!)
- **Django**: `localhost:8000`
- **Celery**: Tourne en arrière-plan
- **Frontend**: `localhost:5173` (npm run dev)

## Commandes utiles

```bash
# Rebuilder juste le backend
docker-compose build backend

# Redémarrer juste un service
docker-compose restart backend

# Voir ce qui tourne
docker-compose ps

# Exécuter une commande dans le backend
docker exec -it ecobilda-backend python manage.py shell

# Voir la base de données
docker exec -it ecobilda-db psql -U postgres -d ecobilda
```

## Problèmes courants

### "Port 5432 is already in use"
```bash
# Arrête ton PostgreSQL local
# Ou change le port dans docker-compose.yml:
ports:
  - "5433:5432"  # Utilise 5433 au lieu de 5432
```

### "Cannot connect to Redis"
```bash
# Arrête ton Redis local ou change le port
docker stop ecobilda-redis  # Si tu avais lancé Redis manuellement avant
```

### Rebuild complet
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

---

## 🎯 Workflow de développement

### Démarrage quotidien

```bash
# Terminal 1 - Backend (Docker)
docker-compose up

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Modifications du code

- **Backend Python**: Les changements sont **automatiques** (volumes montés!)
- **Frontend React**: Les changements sont **automatiques** (Vite HMR!)
- **Migrations**: `docker exec -it ecobilda-backend python manage.py migrate`

---

**C'est beaucoup plus simple avec Docker! Tout est isolé et ça marche pareil sur tous les OS.** 🚀
