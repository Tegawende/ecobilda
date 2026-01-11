# 🚀 Ecobilda API Endpoints

Documentation complète de tous les endpoints API disponibles.

**Base URL**: `http://localhost:8000/api/`

---

## 📋 Table des matières

1. [Authentication](#authentication)
2. [Users & Profile](#users--profile)
3. [Skills](#skills)
4. [Projects](#projects)

---

## 🔐 Authentication

### Register
Créer un nouveau compte utilisateur.

```http
POST /api/auth/register/
```

**Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "password_confirm": "securepassword",
  "first_name": "John",
  "last_name": "Doe",
  "date_of_birth": "1990-01-15"
}
```

**Response** (201):
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    ...
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  },
  "message": "Registration successful. Welcome to Ecobilda!"
}
```

---

### Login
Se connecter avec email/mot de passe.

```http
POST /api/auth/login/
```

**Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response** (200):
```json
{
  "user": { ... },
  "tokens": {
    "refresh": "...",
    "access": "..."
  },
  "message": "Login successful."
}
```

---

### JWT Token (Alternative)
Obtenir tokens JWT via l'endpoint standard.

```http
POST /api/auth/token/
```

**Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

---

### Refresh Token
Renouveler l'access token.

```http
POST /api/auth/token/refresh/
```

**Body**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response** (200):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### Logout
Se déconnecter (blacklist refresh token).

```http
POST /api/auth/logout/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

**Body**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### Current User
Obtenir les informations de l'utilisateur connecté.

```http
GET /api/auth/me/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

---

### Password Reset Request
Demander un lien de réinitialisation de mot de passe.

```http
POST /api/auth/password-reset/
```

**Body**:
```json
{
  "email": "user@example.com"
}
```

---

### Password Reset Confirm
Confirmer la réinitialisation avec le token.

```http
POST /api/auth/password-reset/confirm/
```

**Body**:
```json
{
  "token": "uid-token",
  "password": "newpassword",
  "password_confirm": "newpassword"
}
```

---

### Change Password
Changer son mot de passe (utilisateur connecté).

```http
POST /api/auth/change-password/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

**Body**:
```json
{
  "old_password": "currentpassword",
  "new_password": "newpassword",
  "new_password_confirm": "newpassword"
}
```

---

## 👤 Users & Profile

### List Public Users
Obtenir la liste des utilisateurs (infos publiques uniquement).

```http
GET /api/users/
```

**Query Parameters**:
- `skills`: Filtrer par compétences (ex: `?skills=carpentry,cobbuilding`)

---

### Get Public User
Obtenir les infos publiques d'un utilisateur.

```http
GET /api/users/{id}/
```

---

### Get Own Profile
Obtenir son propre profil complet.

```http
GET /api/profile/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

---

### Update Profile
Mettre à jour son profil.

```http
PUT /api/profile/
PATCH /api/profile/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

**Body** (example):
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Passionate about permaculture",
  "gender": "M",
  "address": {
    "city": "Paris",
    "postal_code": "75001",
    "country_code": "FR",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "formatted_address": "Paris, France"
  },
  "language_codes": ["en", "fr"],
  "email_notifications": true
}
```

---

### Upload Profile Picture
Télécharger une photo de profil.

```http
POST /api/profile/upload_picture/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

**Body** (multipart/form-data):
```
file: [image file]
```

---

### Get Profile Stats
Obtenir ses statistiques.

```http
GET /api/profile/stats/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response** (200):
```json
{
  "projects_count": 3,
  "review_count": 12,
  "average_rating": 4.5,
  "date_joined": "2024-01-15T10:30:00Z",
  "last_login": "2024-12-25T14:20:00Z"
}
```

---

## 🎨 Skills

### List Skills
Obtenir toutes les compétences (16 skills pré-chargées).

```http
GET /api/skills/
```

**Query Parameters**:
- `lang`: Langue des noms (en, fr, es, de) - ex: `?lang=fr`
- `category`: Filtrer par catégorie (PERM, NATB) - ex: `?category=PERM`

**Response** (200):
```json
[
  {
    "code": "carpentry",
    "category": "NATB",
    "display_name": "Carpentry",
    "icon": "🔨"
  },
  {
    "code": "garden_maintenance",
    "category": "PERM",
    "display_name": "Garden maintenance",
    "icon": "🌿"
  },
  ...
]
```

---

### Get Skill
Obtenir une compétence spécifique.

```http
GET /api/skills/{code}/
```

**Example**:
```http
GET /api/skills/carpentry/?lang=fr
```

**Response** (200):
```json
{
  "code": "carpentry",
  "category": "NATB",
  "display_name": "Charpenterie",
  "icon": "🔨"
}
```

---

## 🏗️ Projects

### List Projects
Obtenir la liste des projets avec filtres avancés.

```http
GET /api/projects/
```

**Query Parameters**:
- `keyword`: Recherche dans titre et description
- `skills`: Compétences (comma-separated) - ex: `carpentry,cobbuilding`
- `countries`: Pays (comma-separated) - ex: `FR,ES,DE`
- `project_type`: Type de projet (PERM ou NATB)
- `internet`: true/false
- `family_friendly`: true/false
- `pets_allowed`: true/false
- `smoking_allowed`: true/false
- `available_from`: Date de disponibilité (YYYY-MM-DD)

**Example**:
```http
GET /api/projects/?skills=carpentry&countries=FR&available_from=2024-06-01&internet=true
```

**Response** (200):
```json
{
  "count": 15,
  "next": "http://localhost:8000/api/projects/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Eco-Construction Project in Provence",
      "description": "Build a strawbale house...",
      "project_type": "NATB",
      "owner": {
        "id": 5,
        "first_name": "Marie",
        "last_name": "Dupont",
        "profile_picture": "...",
        "average_rating": 4.8
      },
      "city": "Avignon",
      "country": "France",
      "country_code": "FR",
      "hours_per_day": 6,
      "days_per_week": 5,
      "max_helpers": 3,
      "internet_provided": true,
      "family_friendly": true,
      "pets_allowed": false,
      "smoking_allowed": false,
      "skills": [
        {"code": "carpentry", "icon": "🔨"},
        {"code": "strawbale_building", "icon": "🌾"}
      ],
      "cover_image": "http://localhost:8000/media/projects/...",
      "location_display": "Avignon, France",
      "created_at": "2024-01-15T10:30:00Z"
    },
    ...
  ]
}
```

---

### Get Project
Obtenir un projet spécifique (détails complets).

```http
GET /api/projects/{id}/
```

**Response** (200):
```json
{
  "id": 1,
  "title": "Eco-Construction Project in Provence",
  "description": "Full description...",
  "project_type": "NATB",
  "owner": { ... },
  "address": {
    "city": "Avignon",
    "postal_code": "84000",
    "country": { "code": "FR", "name": "France" },
    "latitude": 43.9493,
    "longitude": 4.8055,
    "formatted_address": "Avignon, France"
  },
  "skills": [
    {
      "code": "carpentry",
      "category": "NATB",
      "display_name": "Carpentry",
      "icon": "🔨"
    }
  ],
  "hours_per_day": 6,
  "days_per_week": 5,
  "max_helpers": 3,
  "accommodation_details": "Shared room in main house...",
  "food_details": "3 vegetarian meals per day...",
  "internet_provided": true,
  "family_friendly": true,
  "pets_allowed": false,
  "smoking_allowed": false,
  "availabilities": [
    {
      "year": 2024,
      "january": false,
      "february": false,
      "march": true,
      "april": true,
      "may": true,
      "june": true,
      "july": true,
      "august": true,
      "september": true,
      "october": false,
      "november": false,
      "december": false,
      "available_months": ["March", "April", "May", "June", "July", "August", "September"]
    }
  ],
  "images": [
    {
      "id": 1,
      "image": "http://localhost:8000/media/projects/...",
      "order": 0,
      "is_cover": true
    },
    ...
  ],
  "location_display": "Avignon, France",
  "is_visible": true,
  "is_active": true,
  "flagged_count": 0,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-12-20T15:00:00Z"
}
```

---

### Create Project
Créer un nouveau projet.

```http
POST /api/projects/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

**Body**:
```json
{
  "title": "Permaculture Farm in Brittany",
  "description": "Help us establish a food forest...",
  "project_type": "PERM",
  "address": {
    "city": "Rennes",
    "postal_code": "35000",
    "country_code": "FR",
    "latitude": 48.1173,
    "longitude": -1.6778,
    "formatted_address": "Rennes, France"
  },
  "skill_codes": ["garden_maintenance", "composting", "pruning"],
  "hours_per_day": 5,
  "days_per_week": 6,
  "max_helpers": 2,
  "accommodation_details": "Private cabin with bathroom",
  "food_details": "Organic meals from the garden",
  "internet_provided": false,
  "family_friendly": true,
  "pets_allowed": true,
  "smoking_allowed": false
}
```

**Response** (201):
```json
{
  "id": 15,
  "title": "Permaculture Farm in Brittany",
  ...
}
```

---

### Update Project
Mettre à jour un projet (propriétaire uniquement).

```http
PUT /api/projects/{id}/
PATCH /api/projects/{id}/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

---

### Delete Project
Supprimer un projet (propriétaire uniquement).

```http
DELETE /api/projects/{id}/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

---

### Get Project Availabilities
Obtenir les disponibilités d'un projet.

```http
GET /api/projects/{id}/availabilities/
```

**Response** (200):
```json
[
  {
    "year": 2024,
    "january": false,
    "february": false,
    "march": true,
    ...
    "available_months": ["March", "April", "May"]
  },
  {
    "year": 2025,
    ...
  }
]
```

---

### Set Project Availabilities
Définir les disponibilités d'un projet (propriétaire uniquement).

```http
POST /api/projects/{id}/set_availabilities/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

**Body**:
```json
[
  {
    "year": 2024,
    "january": false,
    "february": false,
    "march": true,
    "april": true,
    "may": true,
    "june": true,
    "july": true,
    "august": true,
    "september": true,
    "october": false,
    "november": false,
    "december": false
  },
  {
    "year": 2025,
    "january": true,
    "february": true,
    ...
  }
]
```

---

### Map Data
Obtenir les données optimisées pour affichage sur carte.

```http
GET /api/projects/map_data/
```

**Query Parameters**: Mêmes filtres que `/api/projects/`

**Response** (200):
```json
[
  {
    "id": 1,
    "title": "Eco-Construction Project",
    "description_preview": "Build a strawbale house in beautiful Provence...",
    "latitude": 43.9493,
    "longitude": 4.8055,
    "cover_image": "http://localhost:8000/media/projects/...",
    "project_type": "NATB"
  },
  ...
]
```

---

### Flag Project
Signaler un projet (modération communautaire).

```http
POST /api/projects/{id}/flag/
```

**Headers**:
```
Authorization: Bearer {access_token}
```

**Response** (200):
```json
{
  "message": "Project flagged successfully.",
  "flagged_count": 1,
  "is_visible": true
}
```

**Note**: Après 3 signalements, `is_visible` devient `false`.

---

## 🧪 Testing with curl

### Example 1: Register and Login

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword",
    "password_confirm": "testpassword",
    "first_name": "Test",
    "last_name": "User",
    "date_of_birth": "1995-05-15"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword"
  }'
```

---

### Example 2: Get Skills

```bash
# All skills
curl http://localhost:8000/api/skills/

# French translation
curl http://localhost:8000/api/skills/?lang=fr

# Only Permaculture skills
curl http://localhost:8000/api/skills/?category=PERM
```

---

### Example 3: Search Projects

```bash
# All projects
curl http://localhost:8000/api/projects/

# Projects in France with carpentry skill
curl "http://localhost:8000/api/projects/?countries=FR&skills=carpentry"

# Projects available in June 2024 with internet
curl "http://localhost:8000/api/projects/?available_from=2024-06-01&internet=true"

# Map data for filtered projects
curl "http://localhost:8000/api/projects/map_data/?countries=FR,ES"
```

---

### Example 4: Create Project

```bash
# Get access token first (from login response)
ACCESS_TOKEN="your_access_token_here"

# Create project
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Natural Building Workshop",
    "description": "Learn cob building techniques",
    "project_type": "NATB",
    "address": {
      "city": "Lyon",
      "postal_code": "69001",
      "country_code": "FR",
      "latitude": 45.7640,
      "longitude": 4.8357,
      "formatted_address": "Lyon, France"
    },
    "skill_codes": ["cob_building", "earthen_plaster"],
    "hours_per_day": 6,
    "days_per_week": 5,
    "max_helpers": 4,
    "accommodation_details": "Camping on site",
    "food_details": "Communal meals",
    "internet_provided": true,
    "family_friendly": false,
    "pets_allowed": false,
    "smoking_allowed": false
  }'
```

---

## 📝 Notes

### Authentication
Toutes les requêtes authentifiées nécessitent le header:
```
Authorization: Bearer {access_token}
```

### Pagination
Les listes utilisent la pagination par défaut (20 items par page):
```
?page=2
```

### Error Responses
```json
{
  "error": "Error message",
  "detail": "Detailed error description"
}
```

### Status Codes
- `200`: OK
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## 🚀 Next Steps

1. **Démarrer le serveur backend**:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Tester avec Postman ou curl**

3. **Connecter le frontend React** aux endpoints

4. **Phase suivante**: WebSocket pour messagerie temps réel

---

**Documentation générée le**: 25 Décembre 2024
