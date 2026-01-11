# 🚀 Ecobilda - Guide de démarrage rapide

**Date**: 25 Décembre 2024
**Status**: MVP Backend 98% ✅ | Frontend 100% ✅

---

## ✅ Ce qui est déjà fait

### Backend Django (98%) ✅
- ✅ Tous les modèles de données (User, Project, Skills, Messaging, Reviews)
- ✅ Configuration complète (JWT, OAuth, WebSocket, Celery)
- ✅ API REST complète (DRF ViewSets + Serializers)
- ✅ **Messaging temps réel (WebSocket)** 🆕
- ✅ **Email notifications asynchrones (Celery)** 🆕
- ✅ 16 compétences pré-chargées avec traductions 4 langues
- ✅ Logique métier critique (anti-spam email, éligibilité reviews)
- ✅ Géolocalisation PostGIS
- ✅ Upload images S3-ready

### Frontend React (100%) ✅
- ✅ Structure complète (Vite + React + TypeScript)
- ✅ i18n avec 4 langues (EN, FR, ES, DE)
- ✅ Services API (auth, projects, messaging, reviews)
- ✅ Types TypeScript complets
- ✅ **UI fonctionnelle** : HomePage, LoginPage, ProjectsList, Chat, etc.
- ✅ Tailwind CSS + composants réutilisables
- ✅ Mapbox integration

---

## ⚡ Lancer l'application en 3 étapes

### Étape 1: Démarrer PostgreSQL + Redis (Docker)

```powershell
# Depuis la racine du projet
.\start-dev.ps1
```

Ce script démarre automatiquement:
- PostgreSQL (port 5432)
- Redis (port 6379)

---

### Étape 2: Ouvrir 3 terminaux pour le backend

**Terminal 1 - Django (API + WebSocket):**
```bash
cd backend
.\run-django.bat
```

**Terminal 2 - Celery (Email Notifications):**
```bash
cd backend
.\run-celery.bat
```

**Terminal 3 - Frontend React:**
```bash
cd frontend
.\run-frontend.bat
```

---

### Étape 3: Accéder à l'application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Admin**: http://localhost:8000/admin/

✅ L'application est maintenant opérationnelle avec:
- API REST
- WebSocket temps réel
- Email notifications asynchrones

---

## 🧪 Tester les fonctionnalités temps réel

### Test WebSocket (Chat temps réel)

Ouvrir la console du navigateur (F12) sur http://localhost:5173:

```javascript
// 1. Récupérer votre token JWT (après login)
const token = localStorage.getItem('access_token');

// 2. Se connecter au WebSocket
const ws = new WebSocket(`ws://localhost:8000/ws/chat/?token=${token}`);

ws.onopen = () => console.log('✅ WebSocket connecté');
ws.onmessage = (e) => console.log('📨 Message reçu:', JSON.parse(e.data));

// 3. Envoyer un message
ws.send(JSON.stringify({
    type: 'send_message',
    conversation_id: 1,
    body: 'Hello from WebSocket!'
}));
```

### Test Email Notifications (Celery)

1. Envoyer un message via l'interface chat ou l'API
2. Vérifier le **terminal Django** → Email affiché dans la console
3. Vérifier le **terminal Celery** → Tâche exécutée avec succès
4. Anti-spam: Envoyer 5 messages → seulement 1 email (cooldown 24h)

**Voir le guide complet**: [TESTING_REALTIME.md](TESTING_REALTIME.md)

---

## 📋 Setup initial (première fois uniquement)

Si c'est votre première fois, exécutez ces commandes une seule fois:

### Backend

```bash
cd backend

# 1. Créer environnement virtuel
python -m venv venv
.\venv\Scripts\activate

# 2. Installer dépendances
pip install -r requirements/development.txt

# 3. Configurer .env
copy .env.example .env
# Éditer .env si besoin (les valeurs par défaut fonctionnent pour le développement local)

# 4. Créer base de données (Docker doit être lancé via start-dev.ps1)
python manage.py migrate
python manage.py createsuperuser
python manage.py loaddata apps/skills/fixtures/initial_skills.json
```

### Frontend

```bash
cd frontend

# Installer dépendances
npm install
```

Après cette installation initiale, utilisez simplement les scripts `run-*.bat` pour démarrer l'application.

---

## 🔧 Troubleshooting

### Docker n'est pas lancé

```powershell
# Vérifier si Docker Desktop est ouvert
# Si non, le lancer puis réessayer:
.\start-dev.ps1
```

### Port déjà utilisé (Django sur 8000)

```bash
# Trouver le processus utilisant le port
netstat -ano | findstr :8000

# Tuer le processus (remplacer PID par le numéro trouvé)
taskkill /PID <PID> /F
```

### Celery ne démarre pas sur Windows

Le flag `--pool=solo` est requis sur Windows:
```bash
celery -A config worker -l info --pool=solo
```

Les scripts `.bat` incluent déjà ce flag.

### WebSocket connection refused

1. Vérifier que Django tourne (`python manage.py runserver`)
2. Vérifier que Redis tourne (`redis-cli ping` → doit retourner `PONG`)
3. Vérifier que le token JWT est valide (pas expiré)

### Migrations en erreur

```bash
cd backend
python manage.py migrate --run-syncdb
```

---

## 📚 Documentation

### Guides de démarrage
- **[QUICKSTART.md](QUICKSTART.md)** (ce fichier) - Démarrage rapide en 3 étapes
- **[TESTING_REALTIME.md](TESTING_REALTIME.md)** - Guide complet de test WebSocket + Celery

### Documentation d'implémentation
- **[SESSION_25_DEC_2024_PART11.md](SESSION_25_DEC_2024_PART11.md)** - Email notifications (Celery)
- **[SESSION_25_DEC_2024_PART12.md](SESSION_25_DEC_2024_PART12.md)** - WebSocket (Django Channels)
- **[RECAP_FINAL.md](RECAP_FINAL.md)** - État d'avancement global du MVP

### Architecture
- [backend/README.md](backend/README.md) - Documentation backend
- [frontend/README.md](frontend/README.md) - Documentation frontend

---

## 🎯 État du projet

### ✅ MVP Backend (98%)
- User authentication (JWT + OAuth ready)
- Projects CRUD avec filtrage avancé
- Messaging API REST
- **WebSocket chat temps réel** ✅
- **Email notifications asynchrones (Celery)** ✅
- Reviews & ratings avec éligibilité
- Géolocalisation PostGIS
- Upload S3-ready

### ✅ MVP Frontend (100%)
- Authentification flow
- Project listings & filters
- Chat interface
- User profiles
- Reviews display
- Mapbox maps
- i18n (4 langues)
- Responsive design

### 🔜 Prochaines étapes
- Tests automatisés (pytest + Playwright)
- Déploiement production
- OAuth Google + Apple (intégration finale)

---

## 💡 Scripts utiles

### Voir les logs en temps réel

```bash
# Logs PostgreSQL
docker logs -f ecobilda-postgres

# Logs Redis
docker logs -f ecobilda-redis
```

### Monitorer Celery avec Flower (optionnel)

```bash
cd backend
.\venv\Scripts\activate
pip install flower
celery -A config flower
# Ouvrir http://localhost:5555
```

### Tester Redis manuellement

```bash
redis-cli
> PING
PONG
> KEYS *
> MONITOR  # Voir toutes les commandes en temps réel
```

---

**🚀 Bon développement !**
