# Session 25 Décembre 2024 - Part 13: Fixes de configuration

## Résumé

Cette session corrige les derniers problèmes bloquants pour le setup local:
- GDAL/PostGIS désactivé temporairement (Windows)
- Axios version corrigée (1.7.9)
- TypeScript types mis à jour

## Problèmes résolus

### 1. GDAL Library Missing (Backend)

**Erreur**:
```
django.core.exceptions.ImproperlyConfigured: Could not find the GDAL library
(tried "gdal307", "gdal306", ...). Is GDAL installed?
```

**Cause**: PostGIS nécessite GDAL, complexe à installer sur Windows.

**Solution**: Désactivé temporairement pour le développement local.

**Fichiers modifiés**: `backend/config/settings/base.py`

```python
# Ligne 25-26 (avant)
'django.contrib.gis',  # For PostGIS geolocation

# Ligne 25-26 (après)
# 'django.contrib.gis',  # Temporarily disabled - requires GDAL installation on Windows
# TODO: Re-enable for production deployment with proper GDAL setup
```

```python
# Ligne 94 (avant)
'ENGINE': 'django.contrib.gis.db.backends.postgis',

# Ligne 97 (après)
# Using standard PostgreSQL for local dev (PostGIS requires GDAL on Windows)
# TODO: Change to 'django.contrib.gis.db.backends.postgis' for production
'ENGINE': 'django.db.backends.postgresql',
```

**Impact**:
- ✅ Django démarre localement sans GDAL
- ✅ Latitude/longitude fonctionnent (DecimalField)
- ⚠️ Pas de requêtes spatiales avancées (distance, within, etc.)
- 🔄 À réactiver pour la production

---

### 2. Axios Export Error (Frontend)

**Erreur**:
```
Uncaught SyntaxError: The requested module
'http://localhost:5176/node_modules/.vite/deps/axios.js?v=97a79d57'
doesn't provide an export named: 'InternalAxiosRequestConfig'
```

**Cause**: Version axios invalide (1.13.2 n'existe pas) + mauvais import TypeScript.

**Solution**: Version corrigée + import TypeScript mis à jour.

**Fichiers modifiés**:

`frontend/package.json`:
```json
// Avant
"axios": "^1.13.2",

// Après
"axios": "^1.7.9",
```

`frontend/src/services/api.ts`:
```typescript
// Avant
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
...
(config: InternalAxiosRequestConfig) => {

// Après
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
...
(config: AxiosRequestConfig) => {
```

**Actions requises**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Fichiers créés

### QUICK_START.md

Guide de démarrage rapide en français couvrant:
- Prérequis (Docker, Python 3.11, Node.js)
- 4 étapes de démarrage (Docker → Django → Celery → Frontend)
- Commandes utiles
- Problèmes courants
- Notes sur PostGIS et Python 3.11

---

## État actuel

### ✅ Backend prêt
- Django configuré avec PostgreSQL standard
- Celery configuré avec Redis
- Channels configuré avec WebSocket
- JWT authentication prêt
- Migrations prêtes

### ✅ Frontend prêt
- Axios corrigé
- Tailwind CSS v4 configuré
- React 19 + TypeScript 5
- Vite 7 build tool

### 🔄 Prochaines étapes

1. **Lancer tous les services**:
   ```bash
   # Terminal 1: Docker
   .\start-dev.ps1

   # Terminal 2: Django
   cd backend
   source venv/Scripts/activate
   ./run-django.sh

   # Terminal 3: Celery
   cd backend
   source venv/Scripts/activate
   ./run-celery.sh

   # Terminal 4: Frontend
   cd frontend
   npm install
   ./run-frontend.sh
   ```

2. **Créer superuser**:
   ```bash
   cd backend
   python manage.py createsuperuser
   ```

3. **Tester**:
   - API: http://localhost:8000/api/
   - Admin: http://localhost:8000/admin/
   - Frontend: http://localhost:5173
   - WebSocket chat (voir TESTING_REALTIME.md)

---

## Notes importantes

### PostGIS pour production

Avant le déploiement production, réactiver PostGIS:

1. Installer GDAL sur le serveur:
   ```bash
   # Ubuntu/Debian
   apt-get install gdal-bin libgdal-dev

   # Docker
   FROM python:3.11
   RUN apt-get update && apt-get install -y gdal-bin libgdal-dev
   ```

2. Réactiver dans settings:
   ```python
   # base.py ligne 25
   'django.contrib.gis',  # Re-enabled for production

   # base.py ligne 97
   'ENGINE': 'django.contrib.gis.db.backends.postgis',
   ```

3. Utiliser image Docker PostGIS:
   ```bash
   docker run -d --name ecobilda-postgres postgis/postgis:15-3.3
   ```

### Python 3.11 obligatoire

- Python 3.13 trop récent (Pillow incompatible)
- Python 3.11 recommandé pour stabilité
- Django 5.0 officiellement supporté sur 3.11

---

## Résumé des corrections cette session

| Problème | Fichier | Solution |
|----------|---------|----------|
| GDAL missing | `backend/config/settings/base.py` | Désactivé PostGIS (ligne 25, 97) |
| Axios version | `frontend/package.json` | `1.13.2` → `1.7.9` |
| TypeScript type | `frontend/src/services/api.ts` | `InternalAxiosRequestConfig` → `AxiosRequestConfig` |

Tous les blockers sont maintenant résolus pour le développement local! 🎉
