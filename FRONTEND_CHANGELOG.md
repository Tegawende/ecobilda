# FRONTEND_CHANGELOG.md - Journal complet des modifications frontend-next

Document de reference pour la reconstruction du frontend-next. Compile a partir de toutes les sessions Claude Code du 11 au 22 mars 2026.

---

## 1. Chronologie des sessions (11-22 mars 2026)

### Session 1 - 5f3c9f4e (environ 11-12 mars)
**Theme : Design UI, profil utilisateur, filtres par skills**

**Demandes utilisateur :**
- Repositionner le logo a gauche et les boutons a droite dans la navbar
- Supprimer le style "selected" sur les boutons navbar
- Page Account Settings consideree clean, aligner les pages Favoris, Profile, My Projects, My Participations sur le meme style graphique
- Ajouter les traductions manquantes + icone oeil du password comme sur login
- Uniformiser la taille des cards projet
- Verifier les 16 skills (8 permaculture + 8 natural building) par rapport a l'ancien projet
- Mettre a jour CLAUDE.md avec les skills
- Separer visuellement les skills permaculture et construction sur le profil
- Utiliser le meme date picker pour la date de naissance sur login que sur profil
- Pour la localisation, utiliser un select avec autocomplete pour choisir une ville
- Corriger le dropdown ville qui s'affiche vide au focus au lieu d'attendre des resultats
- Corriger erreur 405 lors du save du profil
- Corriger erreur FORMATTING_ERROR pour `{count}` dans les traductions
- Ajouter les skills dans les filtres projet (modal des filtres, pas directement affiches)
- Corriger erreur 400 lors du save du profil
- Simplifier la gestion d'adresse : garder uniquement ville + pays
- Corriger la sauvegarde des skills dans le profil (ne se sauvegardaient pas)
- Afficher les skills permaculture et natural building sur la meme ligne
- Permettre de choisir plusieurs langues sur le profil avec la langue d'inscription comme defaut
- La photo de profil uploadee doit s'afficher dans la navbar aussi
- Liste complete des langues ordonnee alphabetiquement, traduite dans les 6 langues du site
- Changer la taille de l'avatar navbar a 40px
- Les filtres skills doivent etre dans le modal des filtres (pas directement visibles)
- Le compteur de projets doit se mettre a jour quand un filtre est selectionne
- Corriger la recuperation de la photo de profil Google OAuth
- Corriger erreur `Avatar.extend is not a function`
- Sur le panel admin, utiliser icone placeholder si pas de photo de profil

**Fichiers affectes (frontend-next) :**
- `src/components/common/Navbar.tsx` - Position logo/boutons, taille avatar 40px, affichage photo profil
- `src/pages/FavoritesPage.tsx` - Alignement style graphique
- `src/pages/ProfilePage.tsx` - Alignement style, skills, langues, date naissance
- `src/pages/MyProjectsPage.tsx` - Alignement style graphique
- `src/pages/MyParticipationsPage.tsx` - Alignement style graphique
- `src/components/profile/EditProfileForm.tsx` - Date picker, ville autocomplete, save skills, langues multiples, photo profil
- `src/components/projects/ProjectFilters.tsx` - Filtres skills dans modal, compteur dynamique
- `src/components/auth/AuthenticationForm.tsx` - Date picker harmonise
- `src/services/profile.ts` - Correction erreur 405/400
- `src/locales/*/translation.json` (6 fichiers) - Traductions manquantes, formatage `{count}`
- `src/components/common/AccountSettingsPage.tsx` - Icone oeil password
- `src/components/projects/ProjectCard.tsx` - Uniformisation taille cards

---

### Session 2 - d64ee3a5 (environ 12-13 mars)
**Theme : Google OAuth, date de naissance, modal contact host, bug fixes**

**Demandes utilisateur :**
- Corriger la ligne verte au-dessus du logo (skip-link visible) : enlever la couleur
- Google login redirige directement sur projets sans demander date de naissance etc. : apres auth Google, afficher le modal "Finish signing up" avec les champs manquants (sauf email/nom deja recuperes)
- Date de naissance : remplacer le date picker par 3 selects (jour, mois, annee) sur la meme ligne, traduire dans toutes les langues
- Sur la page edit profil aussi, utiliser les 3 selects pour la date de naissance
- Ajouter des indications/labels clairs pour les champs (principe : l'utilisateur est debutant)
- Ne pas afficher les annees qui donnent < 18 ans (dynamique en fonction du temps)
- Validation bloquante sur l'age minimum 18 ans
- Corriger erreur "duplicate key" pour les villes dans le select
- Modal "Contact Host" : l'agrandir, corriger le select dates (affiche en double), mettre un seul calendrier range
- Verifier les memes arrondis (border-radius) que sur la page profile
- Tentative de creation d'un frontend-next2 sans Mantine (tailwind only) - abandonnee

**Fichiers affectes (frontend-next) :**
- `src/components/common/Layout.tsx` - Correction skip-link couleur
- `src/components/auth/AuthenticationForm.tsx` - Modal "Finish signing up" Google, 3 selects date naissance
- `src/components/auth/GoogleButton.tsx` - Flow post-auth Google modifie
- `src/components/profile/EditProfileForm.tsx` - 3 selects date naissance
- `src/components/participations/ParticipationRequestModal.tsx` - Agrandissement modal, calendrier range unique
- `src/services/auth.ts` - Flow Google OAuth modifie
- `src/locales/*/translation.json` (6 fichiers) - Labels jour/mois/annee, indications

---

### Session 3 - 31d95982 (environ 13-14 mars)
**Theme : Bug fixes backend messaging, tests conversations**

**Demandes utilisateur :**
- Corriger 3 bugs bloquants dans les emails : tasks.py reference `last_email_notif_user1/2` mais le modele definit `last_email_sent_to_user1/2`, le task Celery crash
- Demande des regles pour creer une conversation entre deux users pour tester le frontend messaging
- Modifier le mot de passe d'un user avec projet pour tester les conversations
- Demande des regles de creation de projet pour tester

**Fichiers affectes (frontend-next) :**
- Pas de modifications frontend directes dans cette session
- Backend : `apps/messaging/tasks.py`, `apps/messaging/models.py`

---

### Session 4 - cdc832c5 (environ 14 mars)
**Theme : Demarrage backend/frontend**

**Demandes utilisateur :**
- Lancer le backend et savoir comment lancer le frontend
- Docker Desktop lance

**Fichiers affectes :** Aucun changement de code.

---

### Session 5 - 90bdb184 (environ 14-15 mars)
**Theme : Audit complet, nettoyage, admin panel, verification email, browser language detection**

**Demandes utilisateur :**
- Analyser tout le code et identifier ce qui n'est pas encore implemente
- Supprimer le code Apple OAuth, garder uniquement email/password + Google
- Upload fichiers : decision de stockage local sur serveur Hetzner
- Explication PostGIS
- Creer un fichier sur l'etat actuel (PROJECT_STATUS.md)
- Reporter CI/CD, Nginx, Dockerfile production a plus tard
- Nettoyer les anciens fichiers .md inutilises
- Verifier que les 5 fichiers conserves (CLAUDE.md, PROJECT_STATUS.md, FUNCTIONAL_SPECIFICATION.md, API_ENDPOINTS.md, DESIGN_SYSTEM.md) sont a jour
- Commencer les TODO priorite haute et moyenne
- Verification email obligatoire avant login
- Au moment de l'inscription demander les infos supplementaires
- Profil complet obligatoire pour creer un projet (photo, bio, pays, langue)
- Detection de la langue du navigateur et affichage du site dans cette langue
- Stocker la langue de l'utilisateur lors de l'inscription
- Configurer turbopack.root pour corriger le warning Next.js
- Corriger erreur "Can't resolve 'tailwindcss'"
- Apres inscription, ne pas auto-login mais afficher message "Check your email" avec scroll auto vers le haut
- L'email de verification pointe vers port 5173 au lieu de 3000
- Corriger le flow de verification email : au clic sur le lien, connecter directement et rediriger vers projets (puis changement : page classique avec bouton login uniquement, pas de "browse projects")
- Gerer le cas ou l'email a deja ete verifie et l'utilisateur reclique
- Si deja logge, rediriger directement vers la page d'accueil authentifiee
- Si pas logge, afficher "email deja valide" + bouton login
- Token d'expiration a passer a 7 jours
- Ajouter bouton "renvoyer email" avec decompte 1 min anti-spam si email pas encore valide au login
- La navbar doit etre transparente en haut de page (regression)
- Bug routing langues : cliquer sur "es" amene sur /es/fr, navbar ne marche bien qu'en /en
- Warning middleware deprece : utiliser "proxy" au lieu de "middleware"
- Traduire "Natural Building Everywhere" dans la navbar
- Une seule couronne pour les admin dans le panel admin
- Pour les emails : 3000 au lieu de 5173

**Fichiers affectes (frontend-next) :**
- `src/components/auth/AuthenticationForm.tsx` - Suppression Apple OAuth, etape verification-sent, scroll auto
- `src/components/auth/GoogleButton.tsx` - Suppression references Apple
- `src/services/auth.ts` - Suppression Apple, flow register modifie (pas d'auto-login), return type change
- `src/components/common/Navbar.tsx` - Transparence, correction routing langues, traduction
- `src/app/[locale]/(auth)/verify-email/[token]/page.tsx` - Page verification email, gestion deja verifie, redirection si logge
- `src/middleware.ts` - Correction routing langues, deprecation warning
- `next.config.ts` - turbopack.root, correction tailwindcss resolve
- `src/locales/*/translation.json` (6 fichiers) - Cles verification email, "redirecting", traductions manquantes
- `src/app/[locale]/layout.tsx` ou `src/i18n/` - Detection langue navigateur
- `src/contexts/AuthContext.tsx` - Flow verification email

**Backend associe :**
- `backend/apps/authentication/views.py` - register_view ne retourne plus de tokens (pas d'auto-login)
- `backend/apps/authentication/serializers.py` - Admins exempts de verification email
- `backend/apps/projects/views.py` - Profil complet obligatoire pour creer projet
- `backend/apps/projects/models.py` - MIN_IMAGES_FOR_SUBMISSION = 5, champ languages
- `backend/apps/projects/serializers.py` - is_ready_for_submission, language_codes

---

### Session 6 - 224fa20e (15 mars)
**Theme : Audit traductions, coherence UI, avatar navbar**

**Demandes utilisateur :**
- Verifier que toutes les pages du footer et du site sont traduites dans toutes les langues, aucun texte hardcode, proceder methodiquement
- Traduction manquante pour "Please verify your email before logging in."
- Tout doit etre clean, rien d'oublie
- Quand on se log pour la premiere fois, pas de photo de profil : afficher icone user au lieu d'image Unsplash
- Pour Google login, recuperer et utiliser la photo de profil
- Preference : icone user au lieu des initiales pour l'avatar sans photo
- Icone en vert dans le cercle
- Verifier coherence UI et theme sur TOUTES les pages (avant login, apres login, etc.)

**Fichiers affectes (frontend-next) :**
- `src/components/common/Navbar.tsx` - Avatar : `src={user?.profile_picture || null}` au lieu de l'URL Unsplash hardcodee, IconUser si pas de photo, suppression `bg-eco-primary text-white`
- `src/locales/*/translation.json` (6 fichiers) - Completion a 1063 cles chacun
- `src/components/messaging/ChatInterface.tsx` - Suppression textes hardcodes
- `src/pages/HomePage.tsx` - Suppression fallbacks
- `src/components/reviews/ReviewForm.tsx` - Suppression fallbacks
- `src/pages/ChatPage.tsx` - Suppression fallbacks
- `src/components/profile/EditProfileForm.tsx` - Suppression fallbacks
- `src/components/projects/ProjectCard.tsx` - 6 fallbacks supprimes
- `src/components/projects/ProjectFilters.tsx` - 11 fallbacks supprimes
- `src/components/projects/MobileProjectDetailModal.tsx` - 11 fallbacks supprimes
- `src/components/projects/MobileSearchModal.tsx` - 16 fallbacks supprimes
- `src/components/participations/ParticipationRequestModal.tsx` - 12 fallbacks supprimes
- `src/components/participations/RequestCard.tsx` - 17 fallbacks supprimes
- `src/pages/ProjectsPage.tsx` - Suppression fallbacks `|| 'fallback'`
- `src/pages/MessagesPage.tsx` - Suppression fallbacks, `bg-gray-50` -> `bg-stone-50`
- `src/pages/FavoritesPage.tsx` - Suppression fallbacks
- `src/pages/HostRequestsPage.tsx` - Suppression fallbacks
- `src/pages/EditProjectPage.tsx` - Suppression fallbacks
- `src/pages/ProfilePage.tsx` - Suppression fallbacks
- `src/pages/MyProjectsPage.tsx` - Suppression fallbacks, header Mantine Pattern A (Group + ThemeIcon + Title + Text), Alert Mantine pour erreurs
- `src/pages/MyParticipationsPage.tsx` - Suppression fallbacks, header Mantine Pattern A, Alert/Loader Mantine
- `src/pages/NotFoundPage.tsx` - Suppression fallbacks
- `src/pages/VerifyEmailPage.tsx` - Suppression fallbacks
- `src/pages/SavedSearchesPage.tsx` - Ajout `bg-stone-50 min-h-screen` sur les 3 return paths
- `src/pages/AboutPage.tsx` - Suppression `!bg-` overrides, remplacement par non-important
- `src/pages/FAQ.tsx` - Suppression `!bg-`/`!text-` overrides, spacing `py={64}`
- `src/pages/ForVolunteersPage.tsx` - Suppression 7 `!bg-` et 2 `!text-` overrides
- `src/pages/ForHostsPage.tsx` - Suppression 7 `!bg-` et 2 `!text-` overrides
- `src/pages/HowItWorksPage.tsx` - Suppression 9 `!bg-` et 1 `!text-` overrides
- `src/pages/TermsPage.tsx` - Suppression 1 `!bg-` override
- `src/pages/PrivacyPage.tsx` - Suppression 1 `!bg-` override
- `src/pages/ContactPage.tsx` - Suppression `!text-`/`hover:!bg-` overrides, spacing `py={64}`

---

### Session 7 - 0e940d45 (environ 16-17 mars)
**Theme : Bug map/cards synchronisation, modal filtres sous navbar**

**Demandes utilisateur :**
- 3 projets visibles sur la map mais seulement 2 cards affichees : synchroniser map et cards
- Quand on zoom et 4 projets sont visibles sur la map, le nombre de cards ne change pas (reste a 8)
- Le modal des filtres est sous la navbar, corriger le z-index

**Fichiers affectes (frontend-next) :**
- `src/components/projects/ProjectsMap.tsx` ou `src/components/search/InteractiveMap.tsx` - Synchronisation viewport map -> cards filtrees
- `src/pages/ProjectsPage.tsx` - Logique de filtrage cards par viewport map
- `src/components/projects/ProjectFilters.tsx` - z-index modal au-dessus de la navbar

---

### Session 8 - 92d739ea (environ 17-18 mars)
**Theme : Audit performance backend**

**Demandes utilisateur :**
- Verifier que le backend est optimise et suit les best practices (performance, fluidite, clean)

**Fichiers affectes (frontend-next) :** Aucun (session backend uniquement).

---

### Session 9 - c75093b0 (environ 18-19 mars)
**Theme : Audit performance frontend, remplacement console.* par logger**

**Demandes utilisateur :**
- Verifier que le frontend est optimise et suit les best practices (performance, fluidite, clean)

**Fichiers affectes (frontend-next) :**
- `src/utils/logger.ts` - Nouveau fichier : utilitaire logger avec niveaux (error, warn, debug, ws)
- 23 fichiers modifies pour remplacer tous les `console.error/warn/log/debug` par `logger.error/warn/debug/ws`
- Fichiers concernes : tous les services, composants avec des console.* (ChatClient.tsx, AuthenticationForm.tsx, etc.)

---

### Session 10 - 7ae449d3 (22 mars)
**Theme : Admin panel, projets mock, images, corrections DOM/traductions**

**Demandes utilisateur :**
- Creer un admin avec email/mdp specifique
- Les admins ne doivent pas avoir besoin de verification email
- Tab separee pour les admins dans la page Users (pas de colonne status, action supprimer uniquement)
- Les projets mock en DB ont disparu, les recreer avec images
- Les projets ont de vraies coordonnees ?
- Geocodage/recherche par distance pas necessaire pour le MVP
- PostGIS pas necessaire
- Nettoyer les references PostGIS
- Les images des projets ne s'affichent pas
- Corriger erreur DOM : `<p>` ne peut pas contenir `<div>` (Group rend un div)
- Corriger FORMATTING_ERROR : variable "strong" non fournie dans les traductions
- Verifier que tout est bien traduit

**Fichiers affectes (frontend-next) :**
- `next.config.ts` - `unoptimized: process.env.NODE_ENV === "development"` pour les images
- `src/components/projects/ProjectFormStep1.tsx` - `<Group>` remplace par `<span style={{display:'flex',...}}>`, `component="span"` sur les `<Text>`
- `src/components/projects/ProjectFormStep4.tsx` - Import `IconArrowLeft, IconArrowRight`, fonction `moveImage()`, badges numerotes au lieu de "Cover", boutons fleches gauche/droite pour reordonner
- `src/locales/en/translation.json` - `reviewProject` sans `<strong>`, suppression cle `"cover"`, mise a jour `imagesDescription` (drag to reorder)
- `src/locales/fr/translation.json` - Idem
- `src/locales/es/translation.json` - Idem
- `src/locales/de/translation.json` - Idem
- `src/locales/nl/translation.json` - Idem
- `src/locales/pt/translation.json` - Idem

---

### Session 11 - 1cd5a9d9 (22 mars)
**Theme : Diagramme architecture**

**Demandes utilisateur :**
- Generer un diagramme Mermaid de toute l'architecture dans un readme

**Fichiers affectes (frontend-next) :** Aucun. Uniquement generation de `ARCHITECTURE.md`.

---

### Session 12 - df5a8f36 (22 mars)
**Theme : Deploiement Hetzner, renommage frontend, PERTE DU CODE frontend-next**

**Demandes utilisateur :**
- Configuration SSH pour serveur Hetzner
- Creation cle SSH `aurel@ecobilda`
- Configuration DNS (OVH) pour ecobilda.org
- Securisation serveur
- Renommer frontend-next en frontend et l'ancien en frontend-old
- Le repo doit contenir uniquement : admin, frontend, backend

**INCIDENT CRITIQUE :**
- Lors du renommage de `frontend-next` en `frontend`, une commande a echoue et les fichiers `frontend-next` ont ete perdus
- Le dossier `frontend-next/` a ete supprime sans possibilite de recuperation via la corbeille
- Decision de repartir de l'ancien frontend (legacy) pour reconstruire un nouveau frontend-next

**Fichiers affectes :** Perte totale du dossier `frontend-next/`.

---

## 2. Liste complete des modifications par composant/page

### Auth (inscription, login, verification email)

| Composant/Fichier | Modifications |
|---|---|
| `AuthenticationForm.tsx` | - Suppression code Apple OAuth<br>- Ajout etape `'verification-sent'` apres inscription (pas d'auto-login)<br>- Ecran "Check your email" avec icone mail verte, adresse email, note spam, bouton "Back to login"<br>- Header masque pendant l'etape verification-sent<br>- Scroll automatique vers le haut apres inscription<br>- Date de naissance : 3 selects (jour, mois, annee) au lieu de date picker<br>- Annees filtrees dynamiquement (>= 18 ans)<br>- Validation bloquante age minimum 18 ans<br>- Indications/labels clairs pour chaque champ<br>- Meme style date picker que sur le profil |
| `GoogleButton.tsx` | - Suppression references Apple<br>- Apres auth Google, afficher modal "Finish signing up" avec champs manquants (date naissance, etc.) au lieu de connecter directement<br>- Recuperation photo de profil Google |
| `auth.ts` (service) | - Suppression Apple OAuth<br>- `register()` retourne `{ message, email, created }` au lieu de `{ tokens, user, created }`<br>- Suppression de `setAuthTokens()` apres inscription<br>- Flow Google OAuth modifie |
| `verify-email/[token]/page.tsx` | - Page verification email complete<br>- Gestion cas "deja verifie" : si logge -> redirection accueil, si pas logge -> message "email deja valide" + bouton login<br>- Token d'expiration passe a 7 jours<br>- Port corrige : 3000 au lieu de 5173 |
| `AuthContext.tsx` | - Integration flow verification email |
| Bouton "renvoyer email" | - Ajoute sur la page login si email pas verifie<br>- Decompte 1 minute anti-spam avant de pouvoir renvoyer |

### Navigation (Navbar, Language Switcher)

| Composant/Fichier | Modifications |
|---|---|
| `Navbar.tsx` | - Logo repositionne a gauche, boutons a droite<br>- Suppression style "selected" sur les boutons<br>- Avatar : `src={user?.profile_picture || null}` (plus de photo Unsplash hardcodee)<br>- Si pas de photo : `<IconUser size={20} />` (pas d'initiales)<br>- Suppression classes `bg-eco-primary text-white`, garde `hover:ring-2 hover:ring-eco-primary/50 transition-all`<br>- Taille avatar changee a 40px<br>- Photo de profil uploadee se met a jour dans la navbar<br>- Navbar transparente en haut de page (regression corrigee)<br>- Traduction "Natural Building Everywhere"<br>- 1 fallback `|| 'fallback'` supprime |
| `middleware.ts` | - Correction bug routing langues (cliquer sur "es" amenait sur /es/fr)<br>- Navbar ne marchait qu'en /en -> corrige<br>- Deprecation warning "middleware" -> "proxy" |
| `Layout.tsx` | - Correction skip-link : couleur supprimee (ligne verte au-dessus du logo) |
| Detection langue | - Detection de la langue du navigateur a l'ouverture<br>- Stockage de la langue lors de l'inscription |

### Projets (listing, filtres, map, detail, creation, edition)

| Composant/Fichier | Modifications |
|---|---|
| `ProjectCard.tsx` | - Uniformisation taille des cards<br>- 6 fallbacks `|| 'text'` supprimes |
| `ProjectFilters.tsx` | - Ajout filtres par skills (dans le modal, pas directement visibles)<br>- Si filtre "nat building" : afficher uniquement les skills nat building<br>- Si "tous" : afficher tous les skills<br>- Compteur de projets se met a jour dynamiquement au changement de filtre<br>- z-index modal corrige (etait sous la navbar)<br>- 11 fallbacks supprimes |
| `ProjectsMap.tsx` / `InteractiveMap.tsx` | - Synchronisation map viewport -> cards : les cards affichees correspondent aux projets visibles sur la map<br>- Quand on zoom, le nombre de cards se met a jour |
| `ProjectsPage.tsx` | - Logique de filtrage cards par viewport map<br>- Suppression fallbacks |
| `ProjectFormStep1.tsx` | - Correction DOM nesting : `<Group>` (rend un div) remplace par `<span style={{display:'flex',...}}>` dans le prop `description`<br>- Ajout `component="span"` sur les `<Text>` internes |
| `ProjectFormStep4.tsx` | - Import `IconArrowLeft, IconArrowRight` (suppression `IconGripVertical` inutilise)<br>- Ajout fonction `moveImage(from, to)` pour reordonner les images<br>- Badges numerotes (1, 2, 3...) au lieu du badge "Cover" sur la premiere image<br>- Boutons fleches gauche/droite pour reordonner<br>- Nom du fichier centre entre les fleches |
| `MobileProjectDetailModal.tsx` | - 11 fallbacks supprimes |
| `MobileSearchModal.tsx` | - 16 fallbacks supprimes |
| `ProjectGallery.tsx` / `ProjectImageGallery.tsx` | - Images potentiellement affectees par le changement `unoptimized` dans next.config |

### Profil (edition, avatar, date de naissance, skills, langues)

| Composant/Fichier | Modifications |
|---|---|
| `EditProfileForm.tsx` | - Date de naissance : 3 selects (jour, mois, annee) au lieu de date picker<br>- Ville : select avec autocomplete, dropdown uniquement quand il y a des resultats<br>- Simplification adresse : uniquement ville + pays<br>- Sauvegarde des skills corrigee (ne marchait pas)<br>- Skills permaculture et natural building affiches sur la meme ligne/groupe<br>- Choix de plusieurs langues avec langue d'inscription comme defaut<br>- Photo de profil uploadee se repercute dans la navbar<br>- Suppression fallbacks |
| `ProfilePage.tsx` | - Suppression fallbacks<br>- Arrondis (border-radius) harmonises |

### Messagerie (chat, conversations)

| Composant/Fichier | Modifications |
|---|---|
| `ChatInterface.tsx` | - Suppression textes hardcodes |
| `ChatPage.tsx` | - Suppression fallbacks |
| `ChatClient.tsx` | - `console.log('[WS]...')` remplace par `logger.ws(...)` |
| `MessagesPage.tsx` | - Suppression fallbacks<br>- `bg-gray-50` -> `bg-stone-50` (7 instances) |

### Participations (demandes, mes participations)

| Composant/Fichier | Modifications |
|---|---|
| `ParticipationRequestModal.tsx` | - Modal agrandi<br>- Select dates corrige (etait affiche en double) : un seul calendrier range<br>- 12 fallbacks supprimes |
| `RequestCard.tsx` | - 17 fallbacks supprimes (sauf les fallbacks API error qui sont preserves) |
| `MyParticipationsPage.tsx` | - Suppression fallbacks<br>- Header refait avec Mantine Pattern A (Group + ThemeIcon + Title + Text + Stack)<br>- Loading : `animate-pulse` remplace par Mantine `Loader` + `Center`/`Stack`<br>- Erreur : div custom remplace par Mantine `Alert`<br>- Ajout `bg-stone-50 min-h-screen` (si applicable) |
| `HostRequestsPage.tsx` | - Suppression fallbacks |

### Settings

| Composant/Fichier | Modifications |
|---|---|
| `AccountSettingsPage.tsx` | - Icone oeil du password alignee avec celle de la page login<br>- Consideree comme page de reference pour le style |

### Favoris

| Composant/Fichier | Modifications |
|---|---|
| `FavoritesPage.tsx` | - Suppression fallbacks<br>- Alignement style graphique avec AccountSettingsPage |

### Pages informationnelles

| Composant/Fichier | Modifications |
|---|---|
| `AboutPage.tsx` | - Suppression 2 `!bg-` overrides importants, remplacement par non-important |
| `FAQ.tsx` | - Suppression 2 `!bg-` et 1 `!text-` overrides<br>- Spacing section principale : `py={48}` -> `py={64}` |
| `ForVolunteersPage.tsx` | - Suppression 7 `!bg-` et 2 `!text-` overrides |
| `ForHostsPage.tsx` | - Suppression 7 `!bg-` et 2 `!text-` overrides |
| `HowItWorksPage.tsx` | - Suppression 9 `!bg-` et 1 `!text-` overrides |
| `TermsPage.tsx` | - Suppression 1 `!bg-` override, garde `py={32}` |
| `PrivacyPage.tsx` | - Suppression 1 `!bg-` override, garde `py={32}` |
| `ContactPage.tsx` | - Suppression `!text-`/`hover:!bg-` overrides<br>- Spacing : `py={48}` -> `py={64}` |
| `SavedSearchesPage.tsx` | - Ajout `bg-stone-50 min-h-screen` sur les 3 return paths |
| `NotFoundPage.tsx` | - Suppression fallbacks |
| `VerifyEmailPage.tsx` | - Suppression fallbacks |
| `HomePage.tsx` | - Suppression textes hardcodes/fallbacks |
| `MyProjectsPage.tsx` | - Suppression fallbacks<br>- Header refait Mantine Pattern A, bouton "Create New Project" en Mantine Button<br>- Erreur : div `bg-red-50` remplace par Mantine `Alert` |
| `EditProjectPage.tsx` | - Suppression fallbacks |

### Traductions (i18n)

| Fichier | Modifications |
|---|---|
| Tous les `locales/*/translation.json` (EN, FR, ES, DE, NL, PT) | - Completion a 1063 cles par fichier<br>- Suppression de tous les patterns `\|\| 'fallback'` dans le code<br>- Ajout cles `auth.registrationSuccess.*` (check email, verification)<br>- Ajout cles `auth.verification.*` (redirecting, browseProjects, etc.)<br>- Ajout cle `auth.dateOfBirth`, `auth.dobDesc`, `auth.birthDateRequired`, `auth.ageRequirement`<br>- `reviewProject` : `<strong>{type}</strong>` -> texte simple `Type: {type}` (localise)<br>- Suppression cle `"cover"`<br>- Mise a jour `imagesDescription` : mention reordonnement par fleches au lieu de "premiere image = couverture"<br>- Correction FORMATTING_ERROR pour `{count}` et `{strong}`<br>- Traduction "Please verify your email before logging in."<br>- Labels jour/mois/annee pour la date de naissance<br>- Toutes les pages du footer traduites |

### Optimisations de performance

| Modification | Details |
|---|---|
| Logger utilitaire | - Nouveau fichier `src/utils/logger.ts`<br>- Niveaux : error, warn, debug, ws<br>- 23 fichiers modifies pour remplacer `console.*` par `logger.*`<br>- ~10 `console.warn`, ~30 `console.error`, 1 `console.debug`, 2 `console.log` (WS) remplaces |
| Images Next.js | - `next.config.ts` : `unoptimized: process.env.NODE_ENV === "development"` pour eviter les problemes d'images en dev |

### Infrastructure (middleware, routing, config)

| Fichier | Modifications |
|---|---|
| `next.config.ts` | - Ajout `turbopack.root` pour corriger le warning workspace root<br>- Resolution erreur "Can't resolve 'tailwindcss'"<br>- `images.unoptimized: process.env.NODE_ENV === "development"`<br>- Suppression des tentatives intermediaires (localPatterns, allowedDevOrigins, dangerouslyAllowSVG) |
| `middleware.ts` | - Correction routing multi-langues (bug /es/fr)<br>- Deprecation "middleware" -> "proxy" (Next.js 16) |
| `package.json` | - Suppression dependances Apple OAuth si presentes |

---

## 3. Etat final attendu du frontend-next reconstruit

### Architecture generale
- **Framework** : Next.js 16 + React 19 + TypeScript 5
- **UI** : Mantine v7 (composants principaux) + Tailwind CSS 4 (styles custom)
- **Routing** : App Router avec `[locale]` (next-intl)
- **State** : TanStack Query pour les donnees serveur, React Context pour auth/notifications
- **API** : Services axios dans `src/services/`
- **i18n** : next-intl avec 6 langues (EN, FR, ES, DE, NL, PT), 1063+ cles par fichier
- **Map** : Mapbox GL
- **Icones** : @tabler/icons-react (pas d'emojis)

### Pages et fonctionnalites attendues

**Pages publiques (non authentifie) :**
- `/` - HomePage
- `/projects` - Liste des projets avec map synchronisee, filtres (skills, type, dates), cards uniformes
- `/projects/[id]` - Detail projet avec galerie images
- `/about` - A propos
- `/contact` - Contact
- `/faq` - FAQ
- `/how-it-works` - Comment ca marche
- `/for-hosts` - Pour les hotes
- `/for-volunteers` - Pour les volontaires
- `/terms` - CGU
- `/privacy` - Politique de confidentialite
- `/login` - Connexion (email/password + Google uniquement, pas d'Apple)
- `/register` - Inscription avec date naissance (3 selects), verification email obligatoire
- `/verify-email/[token]` - Verification email (gere deja verifie, redirect si logge, expiration 7 jours)
- `/forgot-password` - Mot de passe oublie
- `/reset-password/[token]` - Reinitialisation mot de passe

**Pages protegees (authentifie) :**
- `/profile` - Profil avec skills (perma + nat building groupes), langues multiples, ville/pays
- `/settings` - Parametres du compte (reference pour le style)
- `/my-projects` - Mes projets (header Mantine Pattern A, bouton creer, Alert erreurs)
- `/my-participations` - Mes participations (header Mantine Pattern A, Loader Mantine)
- `/favorites` - Favoris
- `/messages` - Messages/conversations (fond stone-50)
- `/messages/[id]` - Chat (WebSocket)
- `/projects/create` - Creation projet (4 etapes, minimum 5 images, reordonnement par fleches)
- `/projects/[id]/edit` - Edition projet
- `/host-requests` - Demandes recues (pour les hotes)
- `/saved-searches` - Recherches sauvegardees

**Flux Google OAuth :**
1. L'utilisateur clique sur "Se connecter avec Google"
2. Apres authentification Google, si nouveau compte : afficher modal "Finish signing up" avec les champs manquants (date naissance en 3 selects, etc.)
3. Ne pas connecter automatiquement : attendre la completion du profil

**Flux inscription email :**
1. L'utilisateur remplit le formulaire (email, password, nom, prenom, date naissance en 3 selects)
2. Validation age >= 18 ans bloquante
3. Apres soumission : PAS d'auto-login, affichage ecran "Check your email" avec scroll auto vers le haut
4. L'utilisateur clique sur le lien dans l'email (port 3000, expiration 7 jours)
5. Page de verification : bouton login uniquement (pas de "browse projects")
6. Si deja verifie : message "email deja valide" + bouton login (ou redirect si deja logge)
7. Au login, si email non verifie : bouton "renvoyer email" avec decompte 1 min anti-spam

### Regles de style
- Fond : `bg-stone-50` (pas `bg-gray-50`)
- Pas de `!bg-*` ou `!text-*` CSS important overrides
- Pas de `style={{ backgroundColor }}` inline redondants
- Espacement sections : `py={64}` (sauf Terms/Privacy : `py={32}`)
- Cards : `rounded-2xl`, taille uniforme
- Boutons : `rounded-full`
- Hover : `hover:-translate-y-0.5` + `transition-all duration-300`
- Headers pages : Mantine Pattern A (Group + ThemeIcon + Title + Text)
- Erreurs : Mantine `Alert` (pas de div custom `bg-red-50`)
- Loading : Mantine `Loader` + `Center` (pas de `animate-pulse` custom)
- Pas d'emojis nulle part, utiliser `@tabler/icons-react`
- Logger : `src/utils/logger.ts` au lieu de `console.*`
- Avatar navbar : 40px, `src={user?.profile_picture || null}`, IconUser si pas de photo
- Navbar transparente en haut de page
- Traductions : 1063+ cles, aucun texte hardcode, pas de pattern `t('key') || 'fallback'`
- Date de naissance : 3 selects (jour, mois, annee), pas de date picker
- Ville : select autocomplete, dropdown seulement quand il y a des resultats
- Skills : permaculture et natural building groupes visuellement
- Images projet : badges numerotes, boutons fleches pour reordonner, pas de badge "Cover"
- `reviewProject` dans les traductions : texte simple `Type: {type}` (pas de `<strong>`)
- Detection automatique de la langue du navigateur
