# 🧪 Guide de Test Complet - Ecobilda

**Date**: 25 Décembre 2024
**Version**: MVP 75%
**Objectif**: Tester l'application complète frontend ↔ backend

---

## ⚡ Démarrage Rapide (5 minutes)

### Étape 1: Backend

```bash
# Terminal 1
cd backend

# Environnement virtuel (si pas déjà fait)
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Installer dépendances (première fois seulement)
pip install -r requirements/development.txt

# Base de données (première fois seulement)
# Option A: PostgreSQL avec PostGIS (recommandé)
createdb ecobilda
psql ecobilda -c "CREATE EXTENSION postgis;"

# Option B: SQLite pour test rapide (modifier settings/development.py)
# Aucune commande nécessaire

# Migrations
python manage.py makemigrations
python manage.py migrate

# Charger fixtures (16 skills)
python manage.py loaddata apps/skills/fixtures/initial_skills.json

# Créer superuser (optionnel)
python manage.py createsuperuser

# Démarrer serveur
python manage.py runserver
# ✅ Backend running on http://localhost:8000
```

---

### Étape 2: Frontend

```bash
# Terminal 2
cd frontend

# Installer dépendances (première fois seulement)
npm install

# Démarrer dev server
npm run dev
# ✅ Frontend running on http://localhost:5173
```

---

### Étape 3: Ouvrir navigateur

**URL**: http://localhost:5173

**Outils de debug**:
- **F12** → Console + Network tab
- **Vue React DevTools** (extension Chrome/Firefox recommandée)

---

## 🎯 Scénarios de Test

### Scénario 1: Inscription complète ✅

**Objectif**: Créer un nouveau compte et accéder aux projets

1. **Aller sur** http://localhost:5173
2. **Click** "Register" dans navbar
3. **Remplir formulaire**:
   - First Name: `John`
   - Last Name: `Doe`
   - Date of Birth: `1995-01-15` (doit avoir 18+)
   - Email: `john@example.com`
   - Password: `testpass123` (min 8 caractères)
   - Confirm Password: `testpass123`

4. **Click** "Register"

**Vérifications**:
- ✅ **Console réseau (F12 → Network)**:
  - POST `http://localhost:8000/api/auth/register/`
  - Status: **201 Created**
  - Response: `{ tokens: {...}, user: {...}, message: "..." }`

- ✅ **Redirection automatique** vers `/projects`

- ✅ **Navbar change**:
  - Avant: "Login" | "Register"
  - Après: "Messages" | "Profile" | "Logout"

- ✅ **LocalStorage** (F12 → Application → Local Storage):
  - Key: `auth_tokens`
  - Value: `{"access":"eyJ...","refresh":"eyJ..."}`

**Si erreur**:
- "Email already exists" → Utiliser autre email
- "Must be 18 years old" → Changer date de naissance
- "Passwords don't match" → Vérifier confirmation

---

### Scénario 2: Voir les projets ✅

**Objectif**: Afficher la liste des projets depuis le backend

**Préconditions**: Être sur `/projects` (après inscription ou login)

**Test 1: Base de données vide**
- ✅ Affiche: "No projects found"
- ✅ Message: "Try changing your filters or check back later"
- ✅ **Console réseau**: GET `/api/projects/` → Status 200
- ✅ Response: `{ count: 0, results: [] }`

**Test 2: Avec projets (créer via admin)**
1. **Aller sur** http://localhost:8000/admin/
2. **Login** avec superuser
3. **Projects** → Add project
4. Remplir tous les champs requis
5. Save
6. **Retour frontend** → Refresh page

**Vérifications**:
- ✅ Projets affichés dans la grille
- ✅ **Console réseau**: GET `/api/projects/` → Response avec projects
- ✅ Count correct: "All Projects (X)"

---

### Scénario 3: Filtrer les projets ✅

**Préconditions**: Au moins 2 projets (1 PERM + 1 NATB)

1. **Click** "🌿 Permaculture"
   - ✅ **Console réseau**: GET `/api/projects/?project_type=PERM`
   - ✅ Affiche seulement projets PERM

2. **Click** "🏗️ Natural Building"
   - ✅ **Console réseau**: GET `/api/projects/?project_type=NATB`
   - ✅ Affiche seulement projets NATB

3. **Click** "All Projects"
   - ✅ **Console réseau**: GET `/api/projects/`
   - ✅ Affiche tous les projets

**Vérifications**:
- ✅ Loading skeletons pendant fetch
- ✅ Count mis à jour dynamiquement
- ✅ Transition smooth (pas de flash)

---

### Scénario 4: Déconnexion (Logout) ✅

**Préconditions**: Être connecté

1. **Click** "Logout" dans navbar

**Vérifications**:
- ✅ **Console réseau**: POST `/api/auth/logout/` → Status 200
- ✅ **LocalStorage vidé**: `auth_tokens` supprimé
- ✅ **Redirection** vers `/`
- ✅ **Navbar change**: "Login" | "Register" réapparaissent

---

### Scénario 5: Connexion (Login) ✅

**Préconditions**: Compte créé (du Scénario 1)

1. **Aller sur** http://localhost:5173/login
2. **Remplir**:
   - Email: `john@example.com`
   - Password: `testpass123`

3. **Click** "Login"

**Vérifications**:
- ✅ **Console réseau**: POST `/api/auth/login/` → Status 200
- ✅ Response: `{ tokens, user, message }`
- ✅ **Redirection** `/projects`
- ✅ **Navbar** affiche "Logout"
- ✅ **LocalStorage** contient tokens

**Test erreur**:
- Mauvais password → "Invalid email or password"
- Email inexistant → "Invalid email or password" (sécurité)

---

### Scénario 6: Routes protégées ✅

**Objectif**: Vérifier protection des routes

**Test 1: Non connecté**
1. **Déconnecté** (Logout si nécessaire)
2. **Aller directement sur** http://localhost:5173/profile

**Vérifications**:
- ✅ **Redirection automatique** vers `/login`
- ✅ Pas d'affichage de la page protégée

**Test 2: Connecté**
1. **Connecté** (Login)
2. **Aller sur** http://localhost:5173/profile

**Vérifications**:
- ✅ **Page affichée**: "Profile (Coming soon...)"
- ✅ Pas de redirection

**Routes à tester**:
- `/profile` - ✅ Protégée
- `/messages` - ✅ Protégée
- `/projects` - ❌ Publique (accessible sans login)

---

### Scénario 7: Token auto-refresh ✅

**Objectif**: Vérifier le refresh automatique du token

**Setup**: Token expire après 60 minutes (config par défaut)

**Test manuel** (modifier expiration pour test):
1. **Backend**: `settings/base.py` → Change `ACCESS_TOKEN_LIFETIME` à 1 minute
2. **Restart backend**
3. **Login**
4. **Attendre 2 minutes**
5. **Faire une requête** (ex: filter projects)

**Vérifications**:
- ✅ **Console réseau**:
  - Requête initiale → 401 Unauthorized
  - Auto-refresh → POST `/api/auth/token/refresh/`
  - Retry requête → 200 OK
- ✅ Pas de logout forcé
- ✅ Pas de redirection login

---

## 🔍 Tests API avec curl

### Test 1: Register

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "password_confirm": "testpass123",
    "first_name": "Test",
    "last_name": "User",
    "date_of_birth": "1995-05-15"
  }'
```

**Résultat attendu**:
```json
{
  "tokens": {
    "access": "eyJ0eXAi...",
    "refresh": "eyJ0eXAi..."
  },
  "user": {
    "id": 1,
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "Test",
    ...
  },
  "message": "Registration successful. Welcome to Ecobilda!"
}
```

---

### Test 2: Login

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

---

### Test 3: Get Projects

```bash
# Sans auth (public)
curl http://localhost:8000/api/projects/

# Avec filtres
curl "http://localhost:8000/api/projects/?project_type=PERM"
```

---

### Test 4: Get Skills

```bash
# Toutes les skills
curl http://localhost:8000/api/skills/

# En français
curl "http://localhost:8000/api/skills/?lang=fr"

# Seulement Permaculture
curl "http://localhost:8000/api/projects/?category=PERM"
```

---

### Test 5: Protected Endpoint

```bash
# Sauvegarder access token
ACCESS_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGci..."

# Get current user
curl http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Logout
curl -X POST http://localhost:8000/api/auth/logout/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refresh": "eyJ0eXAi..."}'
```

---

## 🐛 Troubleshooting

### Problème 1: CORS Error

**Symptôme**:
```
Access to XMLHttpRequest at 'http://localhost:8000/api/...'
has been blocked by CORS policy
```

**Solution**:
1. Vérifier `backend/config/settings/development.py`:
   ```python
   CORS_ALLOW_ALL_ORIGINS = True
   ```
2. Restart backend

---

### Problème 2: Backend pas démarré

**Symptôme**: `ERR_CONNECTION_REFUSED` dans console

**Solution**:
```bash
cd backend
python manage.py runserver
```

**Vérifier**: http://localhost:8000 doit répondre

---

### Problème 3: Frontend pas démarré

**Symptôme**: http://localhost:5173 ne charge pas

**Solution**:
```bash
cd frontend
npm install  # Si pas fait
npm run dev
```

---

### Problème 4: Base de données pas migrée

**Symptôme**: Errors Django `no such table`

**Solution**:
```bash
cd backend
python manage.py migrate
python manage.py loaddata apps/skills/fixtures/initial_skills.json
```

---

### Problème 5: Token invalide

**Symptôme**: 401 Unauthorized constant

**Solution**:
1. **Console navigateur** (F12):
   ```javascript
   localStorage.removeItem('auth_tokens')
   ```
2. Refresh page
3. Re-login

---

### Problème 6: "No projects found" toujours

**Cause**: Base de données vide

**Solution**: Créer projets via Django Admin
1. http://localhost:8000/admin/
2. Login superuser
3. Projects → Add project
4. Remplir formulaire:
   - Owner: (select user)
   - Title: "Test Project"
   - Description: "Description..."
   - Project Type: PERM ou NATB
   - Address: Créer nouvelle adresse
   - Hours/Days: 5/5
   - Accommodation/Food: "Details..."
5. Save
6. Refresh frontend

---

## ✅ Checklist complète

### Backend Setup
- [ ] PostgreSQL installé et running (ou SQLite configuré)
- [ ] Database `ecobilda` créée
- [ ] Extension PostGIS activée (si PostgreSQL)
- [ ] `pip install -r requirements/development.txt` exécuté
- [ ] `python manage.py migrate` exécuté
- [ ] Fixtures skills chargées
- [ ] Superuser créé
- [ ] `python manage.py runserver` running
- [ ] http://localhost:8000 accessible

### Frontend Setup
- [ ] Node.js installé (20.19+ ou 22.12+)
- [ ] `npm install` exécuté
- [ ] `.env` créé avec `VITE_API_BASE_URL`
- [ ] `npm run dev` running
- [ ] http://localhost:5173 accessible

### Tests Fonctionnels
- [ ] Register fonctionne (201 Created)
- [ ] Auto-login après register
- [ ] Redirection `/projects` après register
- [ ] Navbar affiche "Logout" quand connecté
- [ ] Projects chargent depuis backend
- [ ] Filtres fonctionnent (PERM/NATB)
- [ ] Loading skeletons affichés
- [ ] Logout fonctionne
- [ ] Tokens supprimés de localStorage
- [ ] Login fonctionne avec compte créé
- [ ] Routes protégées redirect `/login`
- [ ] Error handling (mauvais password, email existe, etc.)

### Tests API (curl)
- [ ] POST `/api/auth/register/` → 201
- [ ] POST `/api/auth/login/` → 200
- [ ] GET `/api/projects/` → 200
- [ ] GET `/api/skills/` → 200
- [ ] GET `/api/auth/me/` (avec token) → 200
- [ ] POST `/api/auth/logout/` (avec token) → 200

---

## 📊 Métriques de Performance

### Temps de chargement (cibles)
- Homepage: < 1s
- Projects page (empty): < 500ms
- Projects page (10 items): < 1s
- Login/Register: < 300ms (submit)

### Utiliser pour mesurer
**Chrome DevTools** → Performance tab → Record → Actions → Stop

---

## 🎓 Pour aller plus loin

### Créer des données de test

**Script Python** (à créer):
```python
# backend/scripts/create_test_data.py
from apps.users.models import User
from apps.projects.models import Project
from apps.core.models import Address, Country

# Créer 10 projets de test
# Utiliser Faker pour données réalistes
```

### Test automatisés

**Frontend** (Jest + React Testing Library):
```bash
cd frontend
npm run test
```

**Backend** (Django tests):
```bash
cd backend
python manage.py test
```

---

## 🎉 Success Criteria

**L'application est considérée fonctionnelle si** :

✅ **Flow complet Register → Login → Projects → Logout fonctionne**
✅ **Aucune erreur console (sauf warnings attendus)**
✅ **Tokens stockés/supprimés correctement**
✅ **Routes protégées fonctionnent**
✅ **Filtres projets fonctionnent**
✅ **UI responsive (mobile/desktop)**
✅ **Multilingue fonctionne (EN/FR/ES/DE)**

---

**Si tous les tests passent : L'application MVP est à 75% et prête pour les prochaines features ! 🚀**
