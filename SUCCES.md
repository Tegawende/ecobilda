# ✅ Ecobilda Backend - SUCCÈS!

## 🎉 Tout fonctionne avec Docker!

### Services actifs:

✅ **PostgreSQL**: Port 5432 (base de données `ecobilda` créée)
✅ **Redis**: Port 6379
✅ **Django Backend**: http://localhost:8000/api/
✅ **Celery Worker**: Connecté et prêt

---

## URLs disponibles:

- **API Root**: http://localhost:8000/api/
- **Admin Django**: http://localhost:8000/admin/ (après création superuser)
- **API Docs (Swagger)**: http://localhost:8000/api/schema/swagger-ui/
- **API Schema**: http://localhost:8000/api/schema/

---

## Créer un superuser

```bash
docker exec -it ecobilda-backend python manage.py createsuperuser
```

Ensuite connecte-toi sur: http://localhost:8000/admin/

---

## Commandes utiles

### Voir les logs
```bash
# Tous les services
docker-compose logs -f

# Juste Django
docker-compose logs -f backend

# Juste Celery
docker-compose logs -f celery
```

### Redémarrer un service
```bash
docker-compose restart backend
docker-compose restart celery
```

### Arrêter tout
```bash
docker-compose down
```

### Démarrer tout
```bash
docker-compose up -d
```

### Exécuter des commandes Django
```bash
# Shell Django
docker exec -it ecobilda-backend python manage.py shell

# Créer migrations
docker exec ecobilda-backend python manage.py makemigrations

# Appliquer migrations
docker exec ecobilda-backend python manage.py migrate
```

---

## Frontend

Le frontend tourne **en dehors de Docker** (plus facile pour le dev):

```bash
cd frontend
npm run dev
```

Puis: http://localhost:5173

---

## Tester l'API

### 1. Créer un compte
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### 2. Se connecter
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

Tu recevras un token JWT!

### 3. Utiliser le token
```bash
curl http://localhost:8000/api/profile/ \
  -H "Authorization: Bearer TON_TOKEN_ICI"
```

---

## Structure Docker

```
ecobilda/
├── docker-compose.yml       # Orchestration de tous les services
├── backend/
│   ├── Dockerfile          # Image Django + Celery
│   ├── .dockerignore       # Fichiers à ignorer
│   └── ...
└── frontend/
    └── ...                 # Tourne en local (npm run dev)
```

---

## Résumé des ports

| Service    | Port  | URL                      |
|------------|-------|--------------------------|
| Django     | 8000  | http://localhost:8000    |
| PostgreSQL | 5432  | localhost:5432           |
| Redis      | 6379  | localhost:6379           |
| Frontend   | 5173  | http://localhost:5173    |

---

## Prochaines étapes

1. ✅ Créer un superuser
2. ✅ Tester l'admin Django
3. ✅ Lancer le frontend (`cd frontend && npm run dev`)
4. ✅ Tester l'authentification
5. ✅ Tester la création de projets
6. ✅ Tester le WebSocket chat (voir TESTING_REALTIME.md)

---

## Notes importantes

### Modifications du code

- **Backend**: Les changements sont **automatiques** grâce aux volumes Docker!
- **Frontend**: Vite HMR recharge automatiquement

### Base de données

- Les données sont **persistées** dans un volume Docker
- Pour reset: `docker-compose down -v` (ATTENTION: supprime toutes les données!)

### Problèmes?

1. Voir les logs: `docker-compose logs -f`
2. Redémarrer: `docker-compose restart`
3. Rebuild: `docker-compose down && docker-compose up --build -d`

---

**Félicitations! Ton environnement de développement Ecobilda est 100% opérationnel! 🚀**
