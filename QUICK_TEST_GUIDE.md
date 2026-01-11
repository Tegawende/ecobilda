# 🧪 Guide de Test Rapide - Nouvelles Fonctionnalités

**Pour**: Tester rapidement les 3 nouvelles features implémentées aujourd'hui
**Durée**: ~15 minutes
**Pré-requis**: Backend + Frontend running

---

## ⚡ Démarrage Rapide (2 minutes)

### Terminal 1: Backend
```bash
cd backend
venv\Scripts\activate
python manage.py runserver
# ✅ Backend: http://localhost:8000
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
# ✅ Frontend: http://localhost:5173
```

### Configuration Mapbox (optionnel)
Si vous voulez tester la carte:
1. Créer compte gratuit: https://www.mapbox.com/
2. Copier votre token (commence par `pk.`)
3. Éditer `frontend/.env`:
   ```env
   VITE_MAPBOX_ACCESS_TOKEN=pk.VOTRE_TOKEN_ICI
   ```
4. Redémarrer frontend (`Ctrl+C` puis `npm run dev`)

---

## 🎯 Test 1: Create Project (5 minutes)

**Ce qu'on teste**: Formulaire multi-étapes de création de projet

### Steps:

**1. Créer un compte** (si pas encore fait)
```
http://localhost:5173/register
- First Name: Test
- Last Name: User
- Date of Birth: 1990-01-01
- Email: test@example.com
- Password: testpass123
→ Click "Register"
```

**2. Aller sur Projects**
```
http://localhost:5173/projects
→ Vérifier: Bouton "Create Project" visible en haut à droite
```

**3. Click "Create Project"**
```
→ Redirigé vers /projects/new
→ Vérifier: Barre de progression à 0%, Step 1 actif
```

**4. Step 1: Basic Info**
```
- Project Type: Click "🌿 Permaculture"
- Title: "Test Organic Garden Project"
- Description: "This is a test project for permaculture. We grow organic vegetables and need volunteers to help with daily garden maintenance tasks." (min 50 chars)
→ Click "Next"
```

**5. Step 2: Location & Work**
```
- City: "Lyon"
- Postal Code: "69000"
- Country: "France"
- Hours per day: 5
- Days per week: 5
- Max volunteers: 2
- Accommodation: "Shared room in main house with comfortable beds"
- Food: "3 vegetarian meals per day from our garden"
→ Click "Next"
```

**6. Step 3: Skills & Amenities**
```
→ Vérifier: Skills chargées automatiquement (Permaculture)
- Click 3 skills: "Garden maintenance", "Composting", "Weeding"
- Check: Internet provided
- Check: Family friendly
→ Click "Next"
```

**7. Step 4: Availability & Images**
```
- Year: Garder 2025
- Months: Click "Apr", "May", "Jun", "Jul", "Aug"
- Images: (optionnel) Click upload, select 1-3 photos
→ Vérifier: Summary affiche toutes les infos
→ Click "🚀 Create Project"
```

**8. Vérification**
```
→ Loading: "Creating Project..." avec spinner
→ Success: Redirigé vers /projects/{new_id}
→ Vérifier: Projet affiché avec tous les détails
```

**✅ Success Criteria**:
- Formulaire navigate entre steps
- Validation fonctionne (essayer soumettre Step 1 avec title trop court)
- Skills chargent dynamiquement
- Project créé et visible

---

## 🎯 Test 2: Project Detail Page (3 minutes)

**Ce qu'on teste**: Page détail avec gallery + map

### Steps:

**1. Aller sur Projects List**
```
http://localhost:5173/projects
→ Vérifier: Au moins 1 projet affiché
```

**2. Click sur un projet**
```
→ Redirigé vers /projects/{id}
→ Vérifier: Page charge
```

**3. Vérifier sections**
```
✅ Header: Type badge (Permaculture/Natural Building)
✅ Title et location
✅ Description complète
✅ Skills badges
✅ Work arrangement (hours, days, max helpers)
✅ Accommodation details
✅ Food details
✅ Amenities (4 icons)
✅ Available periods (si configuré)
✅ Host card (right sidebar, sticky)
✅ "Contact Host" button
```

**4. Tester Gallery** (si projet a images)
```
- Click sur image principale
→ Lightbox s'ouvre full-screen
- Click Next arrow (→)
→ Image suivante
- Press ESC
→ Lightbox ferme
```

**5. Tester Map** (si Mapbox token configuré)
```
→ Scroll vers "Location" section
→ Vérifier: Carte Mapbox affichée
→ Vérifier: Marker vert sur la carte
- Click marker
→ Popup avec titre projet
- Zoom controls: Test + et -
```

**6. Tester "Contact Host"**
```
- Click "Contact Host" button
→ Navigate vers /messages/{owner_id} (placeholder)
```

**✅ Success Criteria**:
- Toutes les sections affichent correctement
- Gallery fonctionne (si images)
- Map affiche (si token Mapbox)
- Contact button navigate

---

## 🎯 Test 3: Complete User Flow (5 minutes)

**Ce qu'on teste**: Flow complet bout-en-bout

### Scenario: Nouveau user crée projet et le consulte

**1. Logout** (si connecté)
```
→ Click "Logout" dans navbar
→ Verify: Redirected to /
```

**2. Register**
```
http://localhost:5173/register
- Email: newuser@test.com
- Password: newpass123
- (autres champs...)
→ Click "Register"
→ Verify: Auto-login + redirect /projects
→ Verify: Navbar shows "Logout" button
```

**3. Create Project**
```
- Click "Create Project" button
→ Fill all 4 steps (voir Test 1)
→ Submit
→ Verify: Redirected to new project detail
```

**4. View in List**
```
- Click "← Back to projects"
→ Verify: New project appears in list
```

**5. Filter Projects**
```
- If created PERM project:
  → Click "🌿 Permaculture" filter
  → Verify: Only PERM projects shown
- Click "All Projects"
  → Verify: All projects shown again
```

**6. Logout & Verify Visibility**
```
- Click "Logout"
- Navigate back to /projects
→ Verify: Projects still visible (public)
→ Verify: "Create Project" button NOT visible
- Try navigate to /projects/new
→ Verify: Redirected to /login
```

**✅ Success Criteria**:
- Complete flow works end-to-end
- Project visible après création
- Public pages accessible sans login
- Protected pages redirect to login

---

## 🐛 Troubleshooting

### Problème: Map ne charge pas

**Symptom**: Gray box au lieu de carte

**Fix**:
1. Vérifier `.env` a `VITE_MAPBOX_ACCESS_TOKEN`
2. Token valide (commence par `pk.`)
3. Restart frontend server

**Expected**: Si pas de token, fallback placeholder avec coordinates

---

### Problème: Skills ne chargent pas (Step 3)

**Symptom**: Loading skeletons infinis

**Fix**:
1. Vérifier backend running
2. Check console: GET `/api/skills/` → 200 OK
3. Vérifier fixtures chargées:
   ```bash
   cd backend
   python manage.py loaddata apps/skills/fixtures/initial_skills.json
   ```

---

### Problème: Images ne s'uploadent pas

**Symptom**: Erreur lors submit

**Fix**:
1. Check backend logs
2. Vérifier S3 configuration (ou disable S3 pour test)
3. Backend doit return presigned URL

**Workaround**: Créer projet sans images pour tester

---

### Problème: Project creation échoue

**Symptom**: Error message après submit

**Debug**:
1. F12 → Network tab
2. Check POST `/api/projects/` response
3. Look for validation errors
4. Common issues:
   - Title too short (< 10 chars)
   - Description too short (< 50 chars)
   - No skills selected

---

## ✅ Checklist Complet

### Backend Setup
- [ ] Backend running (http://localhost:8000)
- [ ] Database migrated
- [ ] Skills fixtures loaded
- [ ] At least 1 user exists (or can register)

### Frontend Setup
- [ ] Frontend running (http://localhost:5173)
- [ ] `.env` configured with API URL
- [ ] (Optional) Mapbox token configured

### Feature Tests
- [ ] Can register new account
- [ ] Can login with account
- [ ] Can view projects list
- [ ] Can filter projects
- [ ] Can view project detail
- [ ] Can click through gallery (if images)
- [ ] Can see map (if Mapbox token)
- [ ] Can create new project (4 steps)
- [ ] Created project appears in list
- [ ] Can logout

### Protection Tests
- [ ] "Create Project" button hidden when logged out
- [ ] `/projects/new` redirects to login when not authenticated
- [ ] Can access after login

---

## 📊 Expected Results

### After Testing

**You should have**:
- ✅ At least 1 new project created
- ✅ Verified all 4 steps of create form
- ✅ Seen project detail page working
- ✅ Tested gallery and map (if configured)
- ✅ Verified authentication flow

**Database should contain**:
- ✅ New project entry
- ✅ Skills associated with project
- ✅ Images uploaded (if tested)
- ✅ User profile complete

---

## 🎉 Success!

Si tous les tests passent:

**✅ Frontend UI: 75% complet**
**✅ Backend API: 100% fonctionnel**
**✅ Integration: 100% fonctionnelle**

**Next steps**:
1. Test sur mobile (responsive)
2. Test avec plus de données
3. Implement ProfilePage
4. Add real-time messaging

---

**Happy testing! 🚀**

**Durée totale**: ~15 minutes
**Features testées**: 3 (Create Project, Project Detail, Complete Flow)
**Couverture**: Core functionality du MVP
