# ECOBILDA - Document de Reference (Bible)

> **Derniere mise a jour :** 22 mars 2026
> **Plateforme :** Echange de competences pour l'eco-construction et la permaculture (type Workaway/WWOOF specialise)
> **Serveur de production :** Hetzner (a configurer)

---

## 1. Ce que fait le site

### Concept
Ecobilda connecte des **porteurs de projets** (hotes) avec des **volontaires** qui veulent apprendre et participer a des projets concrets d'eco-construction et de permaculture. Un utilisateur peut etre a la fois hote ET volontaire (modele unifie comme Airbnb).

### Les 16 competences (taxonomie fixe)
- **Permaculture (8) :** Entretien de jardin, Greffage, Taille, Recolte, Compostage, Desherbage, Multiplication, Recolte de graines
- **Eco-construction (8) :** Charpenterie, Maconnerie, Construction paille, Construction torchis, Enduit terre, Enduit chaux, Beton de chanvre, Tadelakt

---

## 2. Stack technique

| Composant | Technologie |
|-----------|------------|
| **Backend** | Django 5.0, Django REST Framework, PostgreSQL 15, Redis 7, Django Channels 4 (WebSocket), Celery 5 |
| **Frontend** | Next.js 16 + React 19 + TypeScript, Mantine v7, TanStack Query, next-intl, Mapbox GL (`frontend/`) |
| **Frontend legacy** | React 19 + Vite 7 (`frontend-old/` - NE PAS MODIFIER) |
| **Admin Panel** | React 18 + TypeScript, Vite 5, Radix UI (shadcn/ui), TanStack Query, React Router 6 (`admin/`) |
| **Auth** | JWT (SimpleJWT) + Google OAuth (pas d'Apple, pas d'OTP) |
| **Langues** | EN, FR, ES, DE, NL, PT (frontend) / EN, FR, ES, DE, PT (admin) |

---

## 3. Fonctionnalites - Site principal (frontend)

### 3.1 Authentification
| Fonctionnalite | Statut |
|----------------|--------|
| Inscription email/mot de passe (avec date de naissance, 18+ requis) | FAIT |
| Connexion email/mot de passe | FAIT |
| Google OAuth | FAIT |
| Mot de passe oublie / reset | FAIT |
| Verification email par token | FAIT |
| Email verifie obligatoire avant connexion | FAIT |
| Profil complet obligatoire pour creer un projet | FAIT |
| Refresh automatique du JWT | FAIT |
| Deconnexion avec nettoyage tokens | FAIT |

**Flow :** Inscription -> email de verification -> connexion -> JWT (access + refresh) stocke en localStorage -> intercepteur axios pour refresh auto sur 401.

### 3.2 Projets
| Fonctionnalite | Statut |
|----------------|--------|
| Parcourir les projets (grille + carte) | FAIT |
| Filtres : type, skills, pays, commodites, mots-cles | FAIT |
| Detail projet complet (images, carte, hote, reviews) | FAIT |
| Creation projet (formulaire 4 etapes) | FAIT |
| Edition projet | FAIT |
| Suppression projet | FAIT |
| Mes projets (liste avec statuts) | FAIT |
| Upload d'images projet | FAIT (local) |
| Systeme de disponibilite (mois/annee) | FAIT |
| Signalement de projet | FAIT |
| Langues du projet (ManyToMany) | FAIT |
| Minimum 5 images pour soumettre | FAIT |
| Endpoint de soumission (POST /submit/) | FAIT |

**Statuts projet :** DRAFT (creation) -> PENDING (soumission avec 5+ images) -> ACTIVE (validation admin) ou REJECTED

### 3.3 Demandes de participation
| Fonctionnalite | Statut |
|----------------|--------|
| Soumettre une demande (message + dates) | FAIT |
| Voir ses demandes envoyees | FAIT |
| Voir les demandes recues (cote hote) | FAIT |
| Accepter une demande (cree la conversation) | FAIT |
| Refuser une demande (avec message optionnel) | FAIT |
| Annuler une demande (cote volontaire) | FAIT |
| Verification anti-doublon | FAIT |

**Flow :** Volontaire demande -> Hote accepte/refuse -> Si accepte -> Conversation creee -> Chat disponible.
**Regle critique :** PAS de messagerie libre. On doit passer par une demande de participation acceptee.

### 3.4 Messagerie temps reel
| Fonctionnalite | Statut |
|----------------|--------|
| Chat WebSocket temps reel | FAIT |
| Fallback HTTP si WebSocket indisponible | FAIT |
| Indicateur de frappe ("X est en train d'ecrire...") | FAIT |
| Compteur de messages non lus | FAIT |
| Muter/demuter une conversation | FAIT |
| Supprimer une conversation | FAIT |
| Marquer comme lu | FAIT |

**Regle anti-spam email :** Max 1 email de notification par conversation toutes les 24h.

### 3.5 Reviews
| Fonctionnalite | Statut |
|----------------|--------|
| Laisser un avis (note 1-5 + texte) | FAIT |
| Voir les avis sur un profil | FAIT |
| Repondre a un avis recu | FAIT |
| Supprimer un avis (si pas de reponse) | FAIT |
| Verification d'eligibilite (regle 180 jours) | FAIT |

**Publication Airbnb-style :** Les avis ne sont visibles que quand les DEUX parties ont soumis leur avis OU apres 30 jours.

### 3.6 Profil & Parametres
| Fonctionnalite | Statut |
|----------------|--------|
| Voir son profil / profil public | FAIT |
| Editer profil (nom, bio, photo, langues, skills, adresse) | FAIT |
| Upload photo de profil | FAIT (local) |
| Parametres notifications (email, in-app, newsletter) | FAIT |
| Changer mot de passe | FAIT |
| Supprimer son compte | FAIT |

### 3.7 Favoris & Recherches sauvegardees
| Fonctionnalite | Statut |
|----------------|--------|
| Ajouter/retirer des favoris | FAIT |
| Page favoris | FAIT |
| Sauvegarder des filtres de recherche | FAIT |
| Notifications pour nouvelles correspondances | FAIT |
| Supprimer une recherche sauvegardee | FAIT |

### 3.8 Notifications
| Fonctionnalite | Statut |
|----------------|--------|
| Cloche de notification dans la navbar | FAIT |
| Liste des notifications avec compteur non-lu | FAIT |
| Marquer comme lu (individuel + tout) | FAIT |
| Notifications temps reel (WebSocket) | A FAIRE |

### 3.9 Pages publiques
| Page | Statut |
|------|--------|
| Accueil (hero, features, FAQ, CTA) | FAIT |
| A propos | FAIT |
| Comment ca marche | FAIT |
| Pour les hotes | FAIT |
| Pour les volontaires | FAIT |
| FAQ | FAIT |
| Contact (formulaire) | FAIT |
| Conditions d'utilisation | FAIT |
| Politique de confidentialite | FAIT |
| Page 404 | FAIT |

### 3.10 Signalements
| Fonctionnalite | Statut |
|----------------|--------|
| Signaler un projet/review/utilisateur | FAIT |
| Voir ses signalements soumis | FAIT |
| Raisons : inapproprie, trompeur, spam, harcelement, faux, securite, autre | FAIT |

### 3.11 Cartes
| Fonctionnalite | Statut |
|----------------|--------|
| Carte interactive Mapbox (tous les projets) | FAIT |
| Carte sur le detail d'un projet | FAIT |
| Vue carte dans la recherche | FAIT |

---

## 4. Fonctionnalites - Panel Admin

### 4.1 Dashboard
- 8 cartes de stats : utilisateurs, projets actifs, taux de conversion, signalements en attente, messages, favoris, hotes, note moyenne
- Graphique d'activite (courbes : nouveaux utilisateurs + nouveaux projets par jour, recharts)
- Top pays (distribution des projets)
- Skills populaires
- Actions rapides (liens vers projets, signalements, utilisateurs)

### 4.2 Validation des projets
- **Onglet "En attente"** : liste des projets a valider avec carousel d'images, infos projet, skills, commodites
  - Actions : Approuver, Rejeter (avec raison obligatoire), Previsualiser
- **Onglet "Valides"** : projets approuves
  - Action : Invalider (remettre en attente)
- Recherche par titre ou nom du proprietaire
- Filtre par type (Permaculture / Eco-construction)

### 4.3 Gestion des utilisateurs
- Tableau paginable et triable (nom, email, note, date inscription, derniere connexion, statut)
- Recherche par nom/email
- Filtres : tous, email verifie, non verifie
- Actions : basculer verification email, bloquer/debloquer utilisateur, supprimer utilisateur (avec confirmation cascade)
- Badge "Bloque" (rouge) pour les utilisateurs desactives

### 4.4 Moderation des signalements
- **Onglet "En attente"** : signalements non traites
  - Actions : Marquer resolu (avec notes admin) ou Rejeter
- **Onglet "Tous"** : historique complet
- Badges de severite par raison (rouge : harcelement/securite, jaune : spam/faux, gris : autre)
- Recherche par nom/email du rapporteur ou details
- Filtre par raison de signalement

### 4.5 Technique admin
- Auth JWT separee (is_staff/is_superuser requis)
- i18n : EN, FR, ES, DE, PT
- Toast notifications pour toutes les actions (succes/erreur)
- API dediee : `/api/admin/...`

---

## 5. Backend - Etat des apps Django

| App | Modeles | API | Celery Tasks | WebSocket | Emails | Statut |
|-----|---------|-----|-------------|-----------|--------|--------|
| core | Country, Language, Address | - | - | - | - | COMPLET |
| authentication | - (utilise User) | Login, Register, Google OAuth, Reset, Verify | - | - | OTP, verif | COMPLET |
| users | User (unifie) | Profils, settings | - | - | - | COMPLET |
| projects | Project, Availability, ProjectImage | CRUD + filtres avances + carte | - | - | - | COMPLET |
| participations | ParticipationRequest | CRUD + accept/refuse + check | Expiration J+14, rappels J+10 | - | Toutes notifications | COMPLET |
| messaging | Conversation, Message | CRUD + send + mute | Notif email (anti-spam 24h) | ChatConsumer, NotificationConsumer | new_message | COMPLET |
| reviews | Review | CRUD + eligibilite + reponse | Publication auto J+30, rappels | - | review_available, reminder | COMPLET |
| notifications | Notification | Liste + mark read + compteur | - | NotificationConsumer | - | COMPLET |
| favorites | Favorite | Add/remove/list | - | - | - | COMPLET |
| emails | - (service) | - | - | - | Tous templates HTML | COMPLET |
| reports | Report | User CRUD + Admin resolve | - | - | - | COMPLET |
| searches | SavedSearch | CRUD + resultats + notifs | Check quotidien | - | - | COMPLET |
| skills | Skill (16 fixes) | Liste | - | - | - | COMPLET |

---

## 6. Regles metier critiques (NE PAS TOUCHER)

1. **Anti-spam email 24h** (`messaging/models.py`) : Max 1 email par conversation par 24h par utilisateur
2. **Pas de DM libres** : Messagerie uniquement apres acceptation d'une demande de participation
3. **Eligibilite review 180 jours** (`reviews/utils.py`) : Les deux utilisateurs doivent avoir echange des messages dans les 180 derniers jours
4. **Publication review Airbnb** : Visible seulement quand les 2 ont soumis OU apres 30 jours
5. **Modele utilisateur unifie** : Un seul type d'utilisateur (pas de separation Hote/Volontaire)
6. **16 skills fixes** : Pas configurable par les utilisateurs, donnees de reference avec traductions
7. **Validation admin obligatoire** : Les projets passent par PENDING avant d'etre visibles

---

## 7. TODO - Priorite HAUTE

| # | Tache | Composant | Detail |
|---|-------|-----------|--------|
| 1 | ~~Celery Beat dans Docker~~ | docker-compose.yml | FAIT - Conteneur celery-beat ajoute, 5 taches planifiees actives. |
| 2 | ~~Notifications temps reel WebSocket~~ | backend + frontend | FAIT - Backend broadcast via channel layer + frontend NotificationProvider WebSocket. |
| 3 | ~~Upload fichiers (stockage local)~~ | backend | FAIT - MEDIA_ROOT configure, volume Docker persiste. Nginx a configurer en prod. |
| 4 | ~~PostGIS~~ | backend settings | RETIRE - Le filtrage geographique se fait cote frontend via les bounds de la carte Mapbox. PostGIS non necessaire. |

## 8. TODO - Priorite MOYENNE

| # | Tache | Composant | Detail |
|---|-------|-----------|--------|
| 5 | ~~Admin : recherche/filtres sur projets et rapports~~ | admin | FAIT - Recherche + filtres type/raison sur les 2 pages. |
| 6 | ~~Admin : graphiques d'activite~~ | admin | FAIT - Courbes recharts (users/projects par jour) sur le dashboard. |
| 7 | ~~Admin : bloquer/suspendre un utilisateur~~ | admin | FAIT - Bouton block/unblock + badge Bloque + confirmation. |
| 8 | ~~Admin : notifications toast~~ | admin | FAIT - Toasts Radix UI sur toutes les actions (succes/erreur). |
| 9 | ~~Admin : traductions ES, DE, PT~~ | admin | FAIT - 5 langues (EN, FR, ES, DE, PT) + selecteur mis a jour. |
| 10 | Filtres avances de recherche | frontend | Pas de filtre par plage de dates ou rayon geographique (l'API le supporte). |

## 9. TODO - Priorite BASSE (post-MVP)

| # | Tache | Detail |
|---|-------|--------|
| 11 | Error Boundaries React | Pas de composants Error Boundary pour catch les crashes UI. |
| 12 | Admin : audit log | Historique de qui a valide/rejete quoi et quand. |
| 13 | Admin : actions en masse | Selection multiple pour valider/rejeter/supprimer en lot. |
| 14 | Admin : export CSV | Export des donnees (users, projets, rapports). |
| 15 | Monitoring (Prometheus/Grafana) | Seulement Sentry configure. |
| 16 | Rate limiting API | Aucune limitation de debit sur les endpoints. |
| 17 | ProjectDetailModal inutilise | Code mort dans l'admin, jamais importe. A supprimer. |

## 10. TODO - Infrastructure (a faire avant mise en production)

| # | Tache | Detail |
|---|-------|--------|
| 18 | CI/CD pipeline | GitHub Actions pour tests, build, deploy. |
| 19 | Nginx reverse proxy | Config Nginx pour servir le frontend, proxy l'API, servir /media/ et /static/. |
| 20 | Dockerfile production | Utiliser Gunicorn/Daphne au lieu de runserver, separer deps dev/prod. |
| 21 | SSL/TLS (Let's Encrypt) | HTTPS obligatoire en production. |
| 22 | Backups PostgreSQL | Script de backup automatique + cron. |
| 23 | Config email SMTP production | Configurer le vrai serveur SMTP (actuellement console backend en dev). |

---

## 11. API Endpoints principaux

### Auth (`/api/auth/`)
- `POST /login/` - Connexion
- `POST /register/` - Inscription
- `POST /google/` - Google OAuth
- `GET /me/` - Utilisateur courant
- `POST /password-reset/` - Demande de reset
- `POST /password-reset/confirm/` - Confirmer reset
- `GET /verify-email/{token}/` - Verifier email
- `POST /token/refresh/` - Rafraichir JWT

### Projects (`/api/projects/`)
- `GET /` - Liste avec filtres
- `POST /` - Creer
- `GET /{id}/` - Detail
- `PATCH /{id}/` - Modifier
- `DELETE /{id}/` - Supprimer
- `POST /{id}/submit/` - Soumettre pour validation
- `GET /map-data/` - Donnees carte

### Participations (`/api/participations/`)
- `POST /` - Creer demande
- `GET /my-requests/` - Mes demandes (volontaire)
- `GET /received/` - Demandes recues (hote)
- `POST /{id}/accept/` - Accepter
- `POST /{id}/refuse/` - Refuser
- `POST /{id}/cancel/` - Annuler

### Messaging (`/api/conversations/`)
- `GET /` - Liste conversations
- `GET /{id}/messages/` - Messages
- `POST /{id}/send-message/` - Envoyer (HTTP fallback)
- `POST /{id}/mark-as-read/` - Marquer lu
- `POST /{id}/toggle-mute/` - Muter

### WebSocket
- `ws://host/ws/chat/?token={jwt}` - Chat temps reel
- `ws://host/ws/notifications/?token={jwt}` - Notifications temps reel

### Reviews (`/api/reviews/`)
- `GET /users/{id}/reviews/` - Avis sur un profil
- `POST /` - Laisser un avis
- `GET /eligibility/{userId}/` - Verifier eligibilite

### Admin (`/api/admin/`)
- `GET /stats/dashboard/` - Stats dashboard
- `GET /projects/pending/` - Projets en attente
- `POST /projects/{id}/validate/` - Approuver
- `POST /projects/{id}/reject/` - Rejeter
- `GET /reports/pending/` - Signalements en attente
- `POST /reports/{id}/resolve/` - Resoudre
- `GET /users/` - Liste utilisateurs

---

## 12. Decisions techniques

| Decision | Raison |
|----------|--------|
| Pas d'Apple OAuth | Complexite d'implementation sans valeur ajoutee suffisante pour le MVP |
| Pas d'OTP dans le frontend | Simplifie le flow d'auth, email/mdp + Google suffisent |
| Stockage fichiers local (pas S3) | Serveur Hetzner dedie, pas besoin de service cloud externe |
| Pas de PostGIS | Filtrage geo cote frontend via bounds Mapbox, pas besoin de requetes spatiales backend |
| Frontend legacy conserve | Garde comme reference dans `frontend-old/`, ne pas modifier |
| Validation admin obligatoire | Controle qualite des projets avant publication |
