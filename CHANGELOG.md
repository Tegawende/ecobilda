# 📝 Changelog - Ecobilda

Toutes les modifications notables du projet sont documentées dans ce fichier.

---

## [Unreleased] - 2024-12-25

### ✨ Ajouté

#### Frontend UI - Pages complètes
- **HomePage** : Page d'accueil moderne avec hero section, features Permaculture/Natural Building, et CTA
- **LoginPage** : Formulaire de connexion avec validation (Zod), boutons OAuth Google/Apple, gestion erreurs
- **RegisterPage** : Formulaire d'inscription complet avec validation email, mot de passe, date de naissance
- **ProjectsPage** : Liste de projets avec données mockées (6 projets), filtres (All/Permaculture/Natural Building)

#### Frontend UI - Composants
- **Navbar** : Navigation principale avec sélecteur de langue (EN/FR/ES/DE), liens auth
- **Footer** : Pied de page avec sections About, Projects, Community
- **Layout** : Wrapper layout pour toutes les pages avec Navbar + Footer
- **Loading** : Composant loading spinner (3 tailles: sm/md/lg)
- **ProjectCard** : Carte projet réutilisable avec image, skills, amenities, location
- **ProjectCardSkeleton** : Loader skeleton pour état de chargement

#### Frontend Structure
- Organisation des dossiers : `pages/`, `components/auth/`, `components/common/`, `components/projects/`
- Mock data pour démonstration (6 projets exemple)

#### Documentation
- **QUICKSTART.md** : Guide de démarrage rapide (5 minutes)
- **CHANGELOG.md** : Ce fichier (suivi des modifications)

### 🎨 Amélioré

- **App.tsx** : Refactorisé pour utiliser les vraies pages au lieu de placeholders
- **Types TypeScript** : Complétés pour ProjectCard
- **Routing** : Toutes les routes utilisent maintenant le composant Layout

### 🧪 Testé

- ✅ Dev server fonctionne (http://localhost:5173)
- ✅ Navigation entre pages opérationnelle
- ✅ Changement de langue instantané (4 langues)
- ✅ Validation formulaires (email, password, date de naissance)
- ✅ Filtres projets (All/Perm/NatB)
- ✅ Design responsive (mobile, tablet, desktop)
- ✅ Loading states
- ✅ Hover effects et transitions

---

## [Initial] - 2024-12-24

### ✨ Créé

#### Backend Django
- Structure complète des apps Django (core, users, skills, projects, messaging, reviews, notifications, authentication)
- Modèles de données complets avec logique métier critique préservée
- Configuration Django (base, development, production)
- Requirements.txt (base, development, production)
- Fixtures 16 compétences avec traductions 4 langues

#### Frontend React
- Structure Vite + React + TypeScript
- Configuration i18next (4 langues)
- Services API (auth, projects)
- Types TypeScript complets
- Configuration Tailwind CSS

#### Documentation
- README.md racine (vue d'ensemble)
- README.md backend (500+ lignes)
- README.md frontend (330+ lignes)
- STATUS.md (suivi détaillé)
- .gitignore

---

## 📊 Statistiques

### Lignes de code
- **Backend** : ~2000 lignes (modèles + config)
- **Frontend** : ~1500 lignes (composants + pages + services)
- **Documentation** : ~2000 lignes (README, STATUS, QUICKSTART)

### Fichiers créés
- **Backend** : ~30 fichiers
- **Frontend** : ~25 fichiers
- **Documentation** : 6 fichiers

### Fonctionnalités
- **Complètes** : Auth UI, Projects UI, i18n, Routing, Layout
- **Partielles** : API backend (structure prête, endpoints à implémenter)
- **À faire** : WebSocket chat, Mapbox maps, OAuth integration, Tests

---

## 🎯 Prochaines versions

### v0.2.0 (Plannifié)
- Backend API endpoints (serializers, viewsets)
- Connexion Login/Register au backend
- Protected routes
- User authentication flow complet

### v0.3.0 (Plannifié)
- ProjectDetailPage complète
- Create Project form (multi-étapes)
- Image upload S3
- Mapbox map integration

### v0.4.0 (Plannifié)
- Messagerie temps réel (WebSocket)
- Chat UI
- Notifications

### v0.5.0 (Plannifié)
- Reviews system
- Profile page complète
- User dashboard

---

## 📝 Notes de version

### Version actuelle : 0.1.0 (MVP Frontend)

**Status** : ✅ Frontend UI fonctionnel, backend structure complète

**Testé sur** :
- Node.js 22.11.0
- npm 11.5.2
- Windows 11

**Navigateurs supportés** :
- Chrome/Edge (dernières versions)
- Firefox (dernières versions)
- Safari (dernières versions)

**Écrans supportés** :
- Mobile (320px+)
- Tablet (768px+)
- Desktop (1024px+)
- Large desktop (1920px+)

---

## 🐛 Bugs connus

Aucun bug critique identifié.

### Améliorations mineures
- Node.js version warning (22.11.0 vs 22.12.0) - sans impact
- OAuth buttons (UI seulement, intégration à faire)
- API calls retournent erreurs réseau (normal, backend API endpoints pas encore implémentés)

---

## 🙏 Contributions

Pour contribuer :
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

**Maintainers** : Équipe Ecobilda
**License** : À définir
