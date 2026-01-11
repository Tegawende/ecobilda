# Ecobilda Backend - Django REST API

Backend API pour **Ecobilda**, plateforme d'échange de compétences en éco-construction et permaculture.

Refonte moderne de l'ancien projet ASP.NET → Django + PostgreSQL.

---

## 🎯 Vue d'ensemble

**Stack technique** :
- **Django 5.0** + **Django REST Framework 3.14**
- **PostgreSQL 15** avec **PostGIS** (géolocalisation)
- **Redis 7** (cache, WebSockets, Celery)
- **Django Channels 4** (WebSocket temps réel)
- **Celery 5** (tâches asynchrones)
- **JWT** (authentification)
- **OAuth** (Google + Apple)

---

## 📁 Architecture du projet

```
backend/
├── config/                      # Configuration Django
│   ├── settings/
│   │   ├── base.py             # Settings communs
│   │   ├── development.py      # Settings développement
│   │   └── production.py       # Settings production
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py                 # Pour Django Channels
│
├── apps/                        # Applications Django
│   ├── core/                   # Modèles de référence
│   │   └── models.py           # Country, Language, Address
│   │
│   ├── users/                  # Gestion utilisateurs
│   │   └── models.py           # User (modèle unifié)
│   │
│   ├── skills/                 # Compétences (16 skills)
│   │   ├── models.py           # Skill
│   │   └── fixtures/           # 16 compétences pré-chargées
│   │
│   ├── projects/               # Projets/chantiers
│   │   └── models.py           # Project, Availability, ProjectImage
│   │
│   ├── messaging/              # Messagerie temps réel
│   │   └── models.py           # Conversation, Message
│   │
│   ├── reviews/                # Système de notation
│   │   ├── models.py           # Review
│   │   └── utils.py            # Logique éligibilité (6 mois)
│   │
│   ├── notifications/          # Notifications
│   │   └── models.py           # Notification
│   │
│   └── authentication/         # Auth JWT + OAuth
│
├── requirements/
│   ├── base.txt               # Requirements communs
│   ├── development.txt        # Dev tools (pytest, black, etc.)
│   └── production.txt         # Production (gunicorn, sentry)
│
├── .env.example               # Template variables d'environnement
└── manage.py
```

---

## 🗄️ Modèles de données

### 1. **User** (Modèle unifié)

**Simplification majeure** : Un seul type d'utilisateur (plus de séparation Host/Helper).

```python
class User(AbstractUser):
    email = EmailField(unique=True)  # Login via email
    first_name, last_name, date_of_birth
    bio, profile_picture
    address = OneToOneField(Address)
    languages = ManyToManyField(Language)
    skills = ManyToManyField(Skill)  # via related_name

    # Settings notifications
    email_notifications, newsletter, in_app_notifications
    notification_language  # EN, FR, ES, DE

    # Stats reviews (cachées)
    average_rating, review_count
```

**Avantages** :
- Un utilisateur peut **créer plusieurs projets** (comme Airbnb)
- Même utilisateur peut **participer à d'autres projets**
- Plus de flexibilité

---

### 2. **Project** (Chantiers/Projets)

Remplace l'ancien `HostData`. Un utilisateur peut avoir plusieurs projets actifs.

```python
class Project(models.Model):
    owner = ForeignKey(User)
    title, description
    project_type  # PERMACULTURE ou NATURAL_BUILDING
    address = ForeignKey(Address)

    # Détails travail
    hours_per_day (1-10)
    days_per_week (1-7)
    max_helpers

    # Hébergement
    accommodation_details, food_details

    # Commodités
    internet_provided, family_friendly, pets_allowed, smoking_allowed

    # Skills
    skills = ManyToManyField(Skill)

    # Status
    is_active
    flagged_count  # Modération communauté (< 3 = visible)
```

**Propriété importante** :
```python
@property
def is_visible(self):
    return self.is_active and self.flagged_count < 3
```

**Simplification MVP** : Publication automatique (pas de validation admin).

---

### 3. **Availability** (Disponibilités mensuelles)

Système de disponibilités **préservé tel quel** de l'ancien système (très efficace).

```python
class Availability(models.Model):
    project = ForeignKey(Project)
    year = IntegerField()

    # Booléen pour chaque mois
    january, february, march, april, may, june,
    july, august, september, october, november, december

    unique_together = ['project', 'year']
```

**Avantages** :
- Filtrage SQL très rapide
- UI simple (calendrier)
- Support 3 ans d'avance

---

### 4. **Skill** (16 compétences)

**Préservé à 100%** de l'ancien système.

```python
class Skill(models.Model):
    code = CharField(primary_key=True)  # ex: 'carpentry'
    category  # PERMACULTURE ou NATURAL_BUILDING

    # Traductions
    display_name_en, display_name_fr, display_name_es, display_name_de

    users = ManyToManyField(User, related_name='skills')
```

**16 compétences pré-chargées** (fixtures JSON) :

**Permaculture** (8) :
- Garden maintenance, Grafting, Pruning, Harvesting
- Composting, Weeding, Propagating, Seeds harvesting

**Natural Building** (8) :
- Carpentry, Masonry, Strawbale building, Cob building
- Earthen plaster, Lime plaster, Hempcrete, Tadelakt plaster

---

### 5. **Conversation & Message** (Messagerie)

Messagerie 1-to-1 avec **logique anti-spam critique** préservée.

```python
class Conversation(models.Model):
    user1, user2
    last_message_text, last_message_at
    unread_count_user1, unread_count_user2

    # ANTI-SPAM EMAIL (24h rule)
    last_email_sent_to_user1
    last_email_sent_to_user2

    user1_muted, user2_muted

class Message(models.Model):
    conversation, sender
    body
    created_at
```

**Méthode critique** (de `ChatController.cs` lignes 254-261) :
```python
def should_send_email_to(self, user):
    """Max 1 email / 24h par conversation"""
    if not user.email_notifications:
        return False

    if conversation_muted:
        return False

    hours_since_last = (now - last_email).total_hours
    return hours_since_last >= 24
```

---

### 6. **Review** (Notation bidirectionnelle)

```python
class Review(models.Model):
    writer, receiver = ForeignKey(User)
    rating  # 1.0 - 5.0
    feedback  # Texte
    response, response_date  # Réponse possible

    unique_together = ['writer', 'receiver']
```

**Logique éligibilité** (`reviews/utils.py`) :
```python
def check_review_eligibility(conversation):
    """
    Les DEUX users doivent avoir envoyé ≥ 1 message
    dans les 180 derniers jours (6 mois)
    """
    six_months_ago = now() - timedelta(days=180)
    recent_senders = conversation.messages.filter(
        created_at__gte=six_months_ago
    ).values_list('sender_id', flat=True).distinct()

    return len(recent_senders) == 2
```

**Calcul rating moyen** (dans `User.update_rating_stats()`) :
```python
stats = user.reviews_received.aggregate(
    avg=Avg('rating'),
    count=Count('id')
)
user.average_rating = stats['avg'] or 0.00
user.review_count = stats['count']
```

---

### 7. **Address** (Géolocalisation)

```python
class Address(models.Model):
    city, street, street_number, postal_code
    country = ForeignKey(Country)

    # Géolocalisation (PostGIS)
    latitude, longitude  # DecimalField
    formatted_address

    # Index géographique pour carte
    indexes = [Index(fields=['latitude', 'longitude'])]
```

Utilisé par :
- `User.address` (OneToOne)
- `Project.address` (ForeignKey)

---

## 🌍 Système multilingue (i18n)

**4 langues supportées** : EN, FR, ES, DE

### Backend (Django)
- **django-modeltranslation** : Contenus traduits en DB
- **Django i18n** natif : Messages système
- API retourne traductions selon header `Accept-Language`

### Exemples traductions
```python
# Skill.display_name_fr, display_name_es, etc.
# User.notification_language  # Langue emails

LANGUAGES = [
    ('en', 'English'),
    ('fr', 'Français'),
    ('es', 'Español'),
    ('de', 'Deutsch'),
]
```

---

## 🔐 Authentification

### JWT + OAuth

**Configuration** (`settings/base.py`) :
- **Simple JWT** : Access token (60min), Refresh token (24h)
- **Django Allauth** : Google + Apple OAuth

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=1440),
    'ROTATE_REFRESH_TOKENS': True,
}

SOCIALACCOUNT_PROVIDERS = {
    'google': {...},
    'apple': {...},
}
```

### Méthodes de connexion
1. **Email + Password** (classique)
2. **Google OAuth**
3. **Apple OAuth**

**Règles mot de passe** :
- Minimum 8 caractères
- **PAS** d'exigence chiffre/majuscule (comme ancien système)

---

## 🚀 Installation & Lancement

### 1. Prérequis
- Python 3.11+
- PostgreSQL 15+ avec PostGIS
- Redis 7+

### 2. Installation

```bash
# Créer environnement virtuel
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Installer dépendances
pip install -r requirements/development.txt
```

### 3. Configuration

```bash
# Copier .env.example vers .env
cp .env.example .env

# Éditer .env avec vos credentials
# DB_NAME, DB_USER, DB_PASSWORD, etc.
```

### 4. Base de données

```bash
# Créer base PostgreSQL (avec PostGIS)
createdb ecobilda
psql ecobilda -c "CREATE EXTENSION postgis;"

# Migrations Django
python manage.py makemigrations
python manage.py migrate

# Charger les 16 compétences
python manage.py loaddata apps/skills/fixtures/initial_skills.json
```

### 5. Lancement

```bash
# Serveur développement
python manage.py runserver

# API disponible sur http://localhost:8000
```

---

## 📊 Commandes utiles

```bash
# Créer superutilisateur
python manage.py createsuperuser

# Admin Django
# http://localhost:8000/admin

# Shell Django (avec django-extensions)
python manage.py shell_plus

# Tests
pytest

# Code quality
black .
isort .
flake8
```

---

## 🔧 Logique métier critique préservée

### 1. Filtrage disponibilités
**Référence** : `HostController.cs` lignes 151-220

Logique OR complexe pour plages de dates multiples (à implémenter dans filters.py).

### 2. Anti-spam email
**Référence** : `ChatController.cs` lignes 254-261

✅ **Implémenté** dans `Conversation.should_send_email_to()`

### 3. Éligibilité review
**Référence** : `UserDAO.cs` lignes 102-118

✅ **Implémenté** dans `apps/reviews/utils.py`

### 4. Calcul rating moyen
**Référence** : `UserDAO.cs` lignes 184-215

✅ **Implémenté** dans `User.update_rating_stats()`

---

## 📝 TODO Next

### Phase 1 (Backend)
- [ ] Créer serializers DRF pour tous les modèles
- [ ] Créer ViewSets et URLs
- [ ] Implémenter filtres complexes (django-filter)
- [ ] Créer Django Channels consumers (WebSocket)
- [ ] Créer Celery tasks (email notifications)
- [ ] Tests unitaires (pytest)

### Phase 2 (Frontend)
- [ ] Setup React + Vite + TypeScript
- [ ] Setup i18next (4 langues)
- [ ] Composants authentification
- [ ] Pages projets
- [ ] Chat temps réel
- [ ] Carte Mapbox

---

## 🎯 Différences avec l'ancien système ASP.NET

### ✅ Simplifications
1. **Un seul type utilisateur** (plus de Host/Helper séparés)
2. **Auto-publication projets** (pas de validation admin pour MVP)
3. **Upload S3 direct** (presigned URLs)
4. **Notifications unifiées** (un seul modèle)

### ✅ Préservations
1. **16 compétences** exactes
2. **Disponibilités mensuelles** (structure booléenne efficace)
3. **Anti-spam email** (règle 24h)
4. **Éligibilité reviews** (6 mois)
5. **Calcul rating moyen**

### ✅ Modernisations
1. **JWT** au lieu de cookies
2. **OAuth social** (Google + Apple)
3. **Django Channels** au lieu de SignalR
4. **API RESTful** (au lieu de MVC)
5. **PostgreSQL + PostGIS** au lieu de SQL Server

---

## 📚 Documentation

- [Django 5.0 Documentation](https://docs.djangoproject.com/en/5.0/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django Channels](https://channels.readthedocs.io/)
- [Simple JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [Plan de migration complet](../C:\Users\aurel\.claude\plans\wobbly-crunching-naur.md)

---

## 📧 Support

Pour toute question sur l'implémentation, consulter le plan de migration détaillé.
