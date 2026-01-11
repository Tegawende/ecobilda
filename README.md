# Ecobilda - Plateforme d'échange de compétences en éco-construction

**Ecobilda** est une plateforme moderne d'échange de compétences pour l'éco-construction et la permaculture, similaire à Workaway/WWOOF mais spécialisée.

Refonte complète de l'ancienne application ASP.NET vers **Django + React**.

---

## 🎯 Vision du projet

Connecter les passionnés d'éco-construction et de permaculture :
- **Propriétaires de projets** : Offrent hébergement et repas en échange de travail
- **Volontaires** : Apprennent de nouvelles compétences en participant à des projets concrets

**Catégories** :
- 🌿 **Permaculture** (8 compétences)
- 🏗️ **Éco-construction** (8 compétences)

---

## 🏗️ Architecture technique

### Backend - Django REST API
- **Framework** : Django 5.0 + Django REST Framework 3.14
- **Base de données** : PostgreSQL 15 + PostGIS (géolocalisation)
- **Cache & Real-time** : Redis 7
- **WebSocket** : Django Channels 4
- **Tâches asynchrones** : Celery 5
- **Auth** : JWT + OAuth (Google & Apple)
- **Stockage** : AWS S3 / DigitalOcean Spaces

### Frontend - React + TypeScript
- **Framework** : React 18 + TypeScript 5
- **Build** : Vite 7
- **State** : TanStack Query (React Query)
- **Routing** : React Router 6
- **Forms** : React Hook Form + Zod
- **UI** : Tailwind CSS + Headless UI
- **i18n** : i18next (EN, FR, ES, DE)
- **Maps** : Mapbox GL JS

---

## 📁 Structure du projet

```
Ecobilda/
├── backend/                    # API Django REST
│   ├── config/                # Settings Django
│   │   └── settings/
│   │       ├── base.py
│   │       ├── development.py
│   │       └── production.py
│   │
│   ├── apps/
│   │   ├── core/             # Modèles référence (Country, Language, Address)
│   │   ├── users/            # Utilisateurs (modèle unifié)
│   │   ├── skills/           # 16 compétences (fixtures)
│   │   ├── projects/         # Projets & disponibilités
│   │   ├── messaging/        # Messagerie temps réel
│   │   ├── reviews/          # Système de notation
│   │   ├── notifications/    # Notifications
│   │   └── authentication/   # JWT + OAuth
│   │
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   └── production.txt
│   │
│   └── README.md             # Documentation backend
│
├── frontend/                  # Application React
│   ├── src/
│   │   ├── components/       # Composants réutilisables
│   │   ├── pages/           # Pages (routes)
│   │   ├── services/        # API services (axios)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # Types TypeScript
│   │   ├── locales/         # Traductions (4 langues)
│   │   ├── utils/           # Utilitaires
│   │   ├── i18n.ts         # Config i18next
│   │   └── App.tsx         # Composant racine
│   │
│   ├── .env.example
│   ├── tailwind.config.js
│   └── README.md            # Documentation frontend
│
└── README.md                # Ce fichier
```

---

## 🚀 Démarrage rapide

### Backend

```bash
cd backend

# Créer environnement virtuel
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Installer dépendances
pip install -r requirements/development.txt

# Configuration
cp .env.example .env
# Éditer .env avec vos credentials

# Créer base de données
createdb ecobilda
psql ecobilda -c "CREATE EXTENSION postgis;"

# Migrations
python manage.py migrate

# Charger les 16 compétences
python manage.py loaddata apps/skills/fixtures/initial_skills.json

# Lancer serveur
python manage.py runserver
# API: http://localhost:8000
```

### Frontend

```bash
cd frontend

# Installer dépendances
npm install

# Configuration
cp .env.example .env
# Éditer .env (VITE_API_BASE_URL, VITE_MAPBOX_ACCESS_TOKEN, etc.)

# Lancer serveur de développement
npm run dev
# App: http://localhost:5173
```

---

## ✨ Fonctionnalités principales

### ✅ Implémenté (Modèles & Structure)

**Backend** :
- ✅ Modèle User unifié (plus de séparation Host/Helper)
- ✅ 16 compétences avec traductions (EN, FR, ES, DE)
- ✅ Projets avec disponibilités mensuelles
- ✅ Messagerie avec anti-spam email (règle 24h)
- ✅ Système de reviews avec éligibilité (6 mois)
- ✅ Notifications unifiées
- ✅ Géolocalisation avec PostGIS
- ✅ Configuration JWT + OAuth

**Frontend** :
- ✅ Structure React + TypeScript + Vite
- ✅ i18n avec 4 langues (traductions complètes)
- ✅ Services API (auth, projects)
- ✅ Types TypeScript complets
- ✅ Configuration Tailwind CSS
- ✅ Routing React Router
- ✅ State management avec React Query

### 🚧 À implémenter (UI & Logique)

**Phase 1 - Authentification** :
- [ ] Pages Login/Register
- [ ] Intégration Google OAuth
- [ ] Intégration Apple OAuth
- [ ] Routes protégées

**Phase 2 - Projets** :
- [ ] Liste projets avec filtres
- [ ] Page détail projet
- [ ] Formulaire création projet (multi-étapes)
- [ ] Carte Mapbox interactive
- [ ] Upload images (S3 presigned URLs)

**Phase 3 - Messagerie** :
- [ ] Page inbox (conversations)
- [ ] Chat temps réel (WebSocket)
- [ ] Indicateurs de frappe
- [ ] Badges messages non lus

**Phase 4 - Reviews** :
- [ ] Formulaire d'avis
- [ ] Affichage sur profils
- [ ] Vérification éligibilité UI

**Phase 5 - Polish** :
- [ ] Design responsive mobile
- [ ] États de chargement
- [ ] Gestion erreurs
- [ ] SEO & Accessibilité

---

## 🔑 Fonctionnalités clés préservées de l'ancien système

### 1. **Anti-spam email** (CRITIQUE)
**Logique** : Maximum 1 email par conversation toutes les 24 heures
**Fichier** : [backend/apps/messaging/models.py:84-119](backend/apps/messaging/models.py)
```python
def should_send_email_to(self, user):
    # Vérifie si > 24h depuis dernier email
    hours_since = (now - last_email).total_seconds() / 3600
    return hours_since >= 24
```

### 2. **Éligibilité reviews** (CRITIQUE)
**Logique** : Les DEUX utilisateurs doivent avoir envoyé ≥ 1 message dans les 180 derniers jours
**Fichier** : [backend/apps/reviews/utils.py:14-39](backend/apps/reviews/utils.py)
```python
def check_review_eligibility(conversation):
    six_months_ago = now() - timedelta(days=180)
    recent_senders = conversation.messages.filter(
        created_at__gte=six_months_ago
    ).values_list('sender_id', flat=True).distinct()
    return len(list(recent_senders)) == 2
```

### 3. **Disponibilités mensuelles**
**Structure** : 1 ligne par année avec 12 booléens (très efficace pour requêtes SQL)
**Fichier** : [backend/apps/projects/models.py](backend/apps/projects/models.py)

### 4. **16 compétences exactes**
**Données** : Fixtures JSON avec traductions 4 langues
**Fichier** : [backend/apps/skills/fixtures/initial_skills.json](backend/apps/skills/fixtures/initial_skills.json)

---

## 🌍 Support multilingue

**4 langues supportées** :
- 🇬🇧 English (défaut)
- 🇫🇷 Français
- 🇪🇸 Español
- 🇩🇪 Deutsch

**Backend** :
- django-modeltranslation pour contenu
- Django i18n pour messages système

**Frontend** :
- i18next avec fichiers JSON par langue
- Détection automatique langue navigateur
- Persistance dans localStorage

---

## 🎨 Design & UX

**Palette de couleurs** :
- Primaire : Vert (éco-construction)
- Tons naturels & terreux
- Interface épurée et moderne

**Principes** :
- Mobile-first (responsive)
- Accessibilité WCAG AA
- Performance optimale (lazy loading, code splitting)

---

## 🔐 Sécurité

**Backend** :
- HTTPS obligatoire en production
- JWT avec refresh tokens
- Rate limiting sur API
- CORS configuré
- SQL injection protection (ORM Django)
- XSS protection (React auto-escape)

**Frontend** :
- Validation formulaires (Zod)
- Sanitization inputs
- Secure token storage

---

## 📊 Différences avec l'ancien système ASP.NET

### ✅ Simplifications
1. **Utilisateur unifié** : Un seul type (pas Host/Helper séparés) → Flexibilité Airbnb
2. **Auto-publication** : Pas de validation admin pour MVP → Moins de friction
3. **Upload S3 direct** : Presigned URLs → 10x plus rapide
4. **Notifications unifiées** : Un seul modèle → Code plus simple

### ✅ Préservations (100%)
1. **16 compétences** : Taxonomie exacte préservée
2. **Disponibilités mensuelles** : Structure booléenne efficace
3. **Anti-spam email** : Règle 24h préservée
4. **Éligibilité reviews** : Logique 6 mois préservée
5. **Calcul rating** : Agrégation moyenne

### ✅ Modernisations
1. **JWT** : Au lieu de cookies → Stateless, scalable
2. **OAuth social** : Google + Apple → Meilleure conversion
3. **Django Channels** : Au lieu de SignalR → Standard WebSocket
4. **API RESTful** : Au lieu de MVC → Mobile-ready
5. **PostgreSQL + PostGIS** : Au lieu de SQL Server → Open-source, géo optimisé

---

## 📚 Documentation

**Backend** :
- [Django 5.0](https://docs.djangoproject.com/en/5.0/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django Channels](https://channels.readthedocs.io/)

**Frontend** :
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)

**Référence** :
- Plan de migration détaillé : `C:\Users\aurel\.claude\plans\wobbly-crunching-naur.md`

---

## 🚀 Roadmap MVP (12 semaines)

| Semaines | Phase | Objectif |
|----------|-------|----------|
| 1-4 | **Core Platform** | Auth, profils, projets (backend + frontend) |
| 5-6 | **Recherche & Filtrage** | Filtres avancés, carte Mapbox |
| 7-8 | **Communication** | Messagerie temps réel (WebSocket + email) |
| 9-10 | **Confiance** | Système de reviews bidirectionnel |
| 11-12 | **Production Ready** | OAuth, responsive, tests, déploiement |

---

## 🤝 Contribution

### Backend (Django)
```bash
# Code quality
black .
isort .
flake8

# Tests
pytest
```

### Frontend (React)
```bash
# Linting
npm run lint

# Build
npm run build
```

---

## 📧 Contact & Support

Pour toute question sur l'implémentation :
- Consulter le plan de migration complet
- Lire les README backend et frontend
- Vérifier les commentaires dans le code (logique métier critique)

---

## 📄 Licence

*À définir*

---

**Status actuel** : ✅ Structure complète backend + frontend créée, prête pour le développement des features UI.
