# Ecobilda - Specification Fonctionnelle Complete

> **Document de reference** pour le developpement de la plateforme Ecobilda.
>
> **Version** : 3.1
> **Date** : 11 avril 2026
> **Statut** : Production deployee + admin reactif + email Graph API + infrastructure Caddy

---

## Table des matieres

1. [Vision du projet](#1-vision-du-projet)
2. [Authentification et Inscription](#2-authentification-et-inscription)
3. [Profil Utilisateur](#3-profil-utilisateur)
4. [Gestion des Projets](#4-gestion-des-projets)
5. [Recherche et Filtres](#5-recherche-et-filtres)
6. [Systeme de Favoris](#6-systeme-de-favoris)
7. [Messagerie et Participation](#7-messagerie-et-participation)
8. [Systeme de Reviews](#8-systeme-de-reviews)
9. [Recherches sauvegardees](#9-recherches-sauvegardees)
10. [Notifications](#10-notifications)
11. [Panel Administrateur](#11-panel-administrateur)
12. [Signalements](#12-signalements)
13. [Support Multi-langue](#13-support-multi-langue)
14. [Annexes](#14-annexes)
15. [Differences avec les versions precedentes](#15-differences-avec-les-versions-precedentes)

---

## 1. Vision du projet

### 1.1 Description

**Ecobilda** est une plateforme de mise en relation entre :
- **Hotes** : Proprietaires de projets d'eco-construction ou permaculture qui accueillent des volontaires
- **Volontaires** : Personnes souhaitant apprendre et participer a des projets concrets

### 1.2 Positionnement

Similaire a **Workaway/WWOOF** mais specialise dans :
- **Permaculture** (jardinage, compost, greffage, etc.)
- **Eco-construction** (construction naturelle, charpente, enduits, etc.)

### 1.3 Modele utilisateur

**Utilisateur unifie** : Pas de separation Hote/Volontaire. Tout utilisateur peut :
- Creer des projets (devenir hote)
- Participer aux projets d'autres (etre volontaire)

Ce modele offre une flexibilite similaire a Airbnb.

### 1.4 Stack technique

| Composant | Technologie |
|-----------|------------|
| Backend | Convex self-hosted (TypeScript, base de donnees reactive temps reel) |
| Frontend | Next.js 16 + React 19 + TypeScript 5, Mantine v7, next-intl, Tailwind CSS 4, Mapbox GL |
| Admin Panel | React 18 + TypeScript 5, Vite 5, Radix UI (shadcn/ui), TanStack Query, React Router 6 |
| Auth | Session tokens (Convex) + Google OAuth |
| Stockage fichiers | Convex File Storage (_storage) |
| Langues | EN, FR, ES, DE, NL, PT |

---

## 2. Authentification et Inscription

### 2.1 Methodes d'inscription [OK]

| Methode | Statut | Notes |
|---------|--------|-------|
| Email + Mot de passe | [OK] | Methode principale |
| Google OAuth | [OK] | Recupere prenom/nom automatiquement |
| Apple OAuth | [SUPPRIME] | Retire du projet - complexite sans valeur ajoutee pour le MVP |

### 2.2 Champs requis a l'inscription [OK]

| Champ | Obligatoire | Recuperable via OAuth |
|-------|-------------|----------------------|
| Email | Oui | Oui |
| Mot de passe | Oui (si email) | Non |
| Prenom | Oui | Oui |
| Nom | Oui | Oui |
| Date de naissance | Oui | Non |

**Date de naissance :**
- Obligatoire a l'inscription (3 selects : jour / mois / annee)
- Age minimum : 18 ans (validation cote client ET serveur)
- Champ `dateOfBirth` de type string dans le schema Convex

### 2.3 Validation email [OK]

- **Obligatoire** avant de pouvoir se connecter
- L'utilisateur recoit un token de verification (`emailVerificationToken`)
- Tant que l'email n'est pas valide, l'utilisateur ne peut pas acceder a son compte
- **Pas d'auto-login apres inscription** : l'utilisateur doit d'abord verifier son email

### 2.4 Flux d'authentification [OK]

```
Inscription -> Email de verification -> Clic sur le lien -> Connexion
-> Session token stocke en localStorage
-> Session valide 7 jours (table `sessions` avec `expiresAt`)
```

### 2.5 Recuperation de mot de passe [OK]

1. L'utilisateur saisit son email
2. Un token de reinitialisation est genere (expiration 1 heure)
3. L'utilisateur definit un nouveau mot de passe
4. Reponse identique que l'email existe ou non (securite anti-enumeration)

### 2.6 Changement de mot de passe [OK]

- Accessible depuis les parametres du compte
- Requiert l'ancien mot de passe
- Nouveau hash genere avec PBKDF2

### 2.7 Securite des mots de passe [OK]

- **Algorithme** : PBKDF2 (600 000 iterations, SHA-256) via Web Crypto API
- **Format** : `pbkdf2$600000$<salt_hex>$<hash_hex>`
- **Backward compat** : Les anciens hashes SHA-256 (`sha256$<salt>$<hash>`) sont verifies et automatiquement re-hashes en PBKDF2 au prochain login
- **Implementation** : `convex/auth.ts`

### 2.8 Permissions par type d'utilisateur

| Action | Non connecte | Connecte |
|--------|--------------|----------|
| Voir la liste des projets | Oui | Oui |
| Voir le detail d'un projet | Oui | Oui |
| Voir la carte des projets | Oui | Oui |
| Voir le profil d'un hote | Oui | Oui |
| Ajouter un projet en favori | Non (modal connexion) | Oui |
| Contacter un hote / Rejoindre un projet | Non (modal connexion) | Oui |
| Creer un projet | Non | Oui (si profil complet) |

---

## 3. Profil Utilisateur

### 3.1 Champs du profil [OK]

| Champ | Obligatoire inscription | Obligatoire pour creer un projet |
|-------|------------------------|----------------------------------|
| Prenom | Oui | - |
| Nom | Oui | - |
| Email (verifie) | Oui | - |
| Date de naissance (18+) | Oui | - |
| Photo de profil | Non | Oui |
| Bio / Description | Non | Oui |
| Ville + Pays | Non | Oui |
| Langues parlees | Non | Oui (au moins 1) |
| Competences | Non | Non |
| Genre | Non | Non |

**Photo de profil :**
- Upload via Convex File Storage (`generateUploadUrl` + `updateProfilePicture`)
- Stockee comme `storageId` (v.id("_storage")) dans le champ `profilePicture`
- URL externe possible via `profilePictureUrl` (Google OAuth)
- Resolution automatique : si `profilePicture` existe et pas de `profilePictureUrl`, le backend resout via `ctx.storage.getUrl()`

**Adresse simplifiee :** Le profil utilisateur utilise ville + pays uniquement (pas d'adresse complete). Le modele `addresses` est utilise via une relation, mais seuls la ville et le pays sont pertinents pour le profil public.

### 3.2 Donnees affichees sur le profil public [OK]

- Photo de profil
- Prenom + Initiale du nom
- Ville, Pays
- Bio
- Langues parlees
- Competences
- Note moyenne et nombre de reviews
- Date d'inscription ("Membre depuis...")
- Historique : "A deja participe a X projets" / "A deja accueilli X volontaires"
- Liste des projets actifs

### 3.3 Parametres du compte [OK]

| Parametre | Description |
|-----------|-------------|
| Langue de communication | Langue utilisee pour les emails (EN, FR, ES, DE) |
| Notifications email | Activer/Desactiver globalement |
| Notifications in-app | Activer/Desactiver |
| Newsletter | S'abonner/Se desabonner |
| Visibilite du profil | Masquer/Afficher son profil dans la recherche |
| Changer le mot de passe | Ancien + nouveau mot de passe |
| Supprimer le compte | Suppression definitive avec confirmation |

---

## 4. Gestion des Projets

### 4.1 Types de projets [OK]

| Code | Type | Description |
|------|------|-------------|
| `PERM` | Permaculture | Jardinage, compost, greffage, taille, etc. |
| `NATB` | Eco-construction (Natural Building) | Construction naturelle, charpente, enduits, etc. |

Un projet peut etre lie aux deux types via les competences selectionnees.

### 4.2 Champs de creation de projet [OK]

#### Etape 1 - Informations generales

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Titre | Oui | Nom du projet (max 200 caracteres) |
| Description | Oui | Description detaillee du projet |
| Type | Oui | Permaculture ou Eco-construction |
| Langues du projet | Oui | Langues parlees sur le projet (via `languageIds`) |

#### Etape 2 - Localisation

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Ville | Oui | Ville du projet |
| Pays | Oui | Pays du projet |
| Rue + Numero | Optionnel | Adresse exacte |
| Code postal | Optionnel | Code postal |
| Coordonnees GPS | Oui | Latitude/Longitude (saisie via carte ou geocodage) |

**Note :** Les coordonnees sont stockees dans le modele `addresses` avec des champs `latitude`/`longitude` (number). La recherche geographique se fait cote frontend via les limites de la carte Mapbox (viewport bounds), pas par rayon.

#### Etape 3 - Details du travail

| Champ | Obligatoire | Contraintes |
|-------|-------------|-------------|
| Heures de travail/jour | Oui | 1 a 10 heures |
| Jours de travail/semaine | Oui | 1 a 7 jours |
| Nombre max de volontaires | Oui | Minimum 1 |
| Competences liees | Oui | Selection parmi les 16 skills |
| Description hebergement | Oui | Type de logement propose |
| Description nourriture | Oui | Repas fournis, regime, etc. |

#### Etape 4 - Equipements, disponibilites et images

**Equipements (Amenities) :**

| Equipement | Type | Defaut |
|------------|------|--------|
| Internet disponible | Boolean | Non |
| Animaux acceptes | Boolean | Non |
| Familles bienvenues | Boolean | Non |
| Fumeurs acceptes | Boolean | Non |

**Disponibilites :**

Mode flexible par mois :
- Le hote selectionne les mois disponibles (interface grille de mois cliquables)
- Stockage : table `availability` avec une ligne par annee et un boolean par mois
- Le volontaire propose un range de dates dans sa demande de participation

**Images :**

| Contrainte | Valeur |
|------------|--------|
| Minimum | 5 images (requis pour soumettre le projet) |
| Formats acceptes | JPG, PNG, WebP |
| Taille max par image | 5 MB |
| Image de couverture | Premiere image (order=0) |
| Reordonnancement | Boutons fleches (haut/bas), pas de drag-and-drop |
| Stockage | Convex File Storage (_storage) via `generateUploadUrl` + `saveProjectImage` |
| Resolution URL | Le backend resout `storageId` -> URL publique via `ctx.storage.getUrl()` |

### 4.3 Workflow de publication [OK]

```
Creation projet (DRAFT)
      |
      v
Soumission (5+ images requises)
      |
      v
EN ATTENTE (PENDING) - Projet soumis, invisible publiquement
      |
  +---+---+
  |       |
  v       v
ACTIVE  REJECTED
(Valide  (Refuse par admin
 par      avec motif)
 admin,
 visible)
```

**Statuts du projet :**

| Statut | Code | Description |
|--------|------|-------------|
| Brouillon | `DRAFT` | En cours de creation, pas encore soumis |
| En attente | `PENDING` | Soumis avec 5+ images, en attente de validation admin |
| Actif | `ACTIVE` | Valide par un admin, visible publiquement |
| Refuse | `REJECTED` | Refuse par un admin (avec motif), notification envoyee au hote |

**Regles :**
- La validation admin est **obligatoire** avant publication
- Pas d'auto-publication (meme pour le MVP)
- Le hote recoit une notification en cas de validation ou de refus (avec motif)

### 4.4 Les 16 competences (Skills) [OK]

Taxonomie fixe, non configurable par les utilisateurs. Donnees de reference avec traductions en 4 langues (EN, FR, ES, DE).

#### Permaculture (8)

| Code | Nom EN | Nom FR |
|------|--------|--------|
| `garden_maintenance` | Garden maintenance | Entretien jardin |
| `grafting` | Grafting | Greffage |
| `pruning` | Pruning | Taille |
| `harvesting` | Harvesting | Recolte |
| `composting` | Composting | Compostage |
| `weeding` | Weeding | Desherbage |
| `propagating` | Propagating | Multiplication |
| `seeds_harvesting` | Seeds harvesting | Recolte graines |

#### Eco-construction (8)

| Code | Nom EN | Nom FR |
|------|--------|--------|
| `carpentry` | Carpentry | Charpenterie |
| `masonry` | Masonry | Maconnerie |
| `strawbale_building` | Strawbale building | Construction paille |
| `cob_building` | Cob building | Construction torchis |
| `earthen_plaster` | Earthen plaster | Enduit terre |
| `lime_plaster` | Lime plaster | Enduit chaux |
| `hempcrete` | Hempcrete | Beton chanvre |
| `tadelakt_plaster` | Tadelakt plaster | Tadelakt |

### 4.5 Edition et suppression de projet [OK]

- Le proprietaire peut editer son projet a tout moment
- Le proprietaire peut supprimer son projet
- Un projet edite apres validation peut necesiter une re-validation (selon les champs modifies)

---

## 5. Recherche et Filtres

### 5.1 Criteres de filtrage [OK]

| Filtre | Type | Description |
|--------|------|-------------|
| Type de projet | Select | Permaculture / Eco-construction |
| Localisation | Carte Mapbox | Zone visible sur la carte (viewport bounds) |
| Competences | Multi-select | Parmi les 16 skills |
| Langue du projet | Multi-select | Langues parlees sur le projet |
| Pays | Select | Filtrer par pays |
| Mots-cles | Texte libre | Recherche dans titre (index de recherche Convex `search_title`) |
| Internet | Toggle | Projets avec internet |
| Animaux acceptes | Toggle | Projets acceptant les animaux |
| Familles | Toggle | Projets family-friendly |
| Non-fumeur | Toggle | Projets strictement non-fumeur |

### 5.2 Recherche textuelle [OK]

- Recherche dans le **Titre** via l'index de recherche Convex `search_title`
- Filtrage additionnel par description cote client
- Recherche insensible a la casse

### 5.3 Tri des resultats

| Tri | Par defaut |
|-----|------------|
| Date de creation | Oui (plus recent d'abord) |

Pas de tri manuel ni algorithmique pour le MVP.

### 5.4 Affichage des resultats [OK]

- **Vue liste** : Cards avec image de couverture, titre, localisation, type, competences
- **Vue carte** : Carte Mapbox avec marqueurs cliquables et popup preview
- Les deux vues sont liees (synchronisation de la zone visible)

---

## 6. Systeme de Favoris

### 6.1 Fonctionnalites [OK]

| Action | Condition |
|--------|-----------|
| Ajouter un projet en favori | Utilisateur connecte |
| Retirer un projet des favoris | Utilisateur connecte |
| Voir ses favoris | Utilisateur connecte |

### 6.2 Regles metier

- Un utilisateur **ne peut pas** ajouter ses propres projets en favoris
- Si non connecte et clic sur favoris, affichage d'une modal de connexion
- Pas de synchronisation locale pour utilisateurs non connectes

### 6.3 Interface [OK]

- Icone coeur sur les cards projets et page detail
- Page "Mes favoris" accessible depuis le menu utilisateur
- La page favoris charge les projets via `projects.getByIds` a partir des IDs favoris

---

## 7. Messagerie et Participation

### 7.1 Principe cle

> **On ne peut pas envoyer un message libre a un hote.**
> Pour le contacter, il faut passer par une **demande de participation** ("Contacter l'hote").
> La messagerie complete s'ouvre **uniquement si le hote accepte**.

Ceci est fondamental au modele de confiance de la plateforme.

### 7.2 Parcours utilisateur - Volontaire [OK]

```
Page detail projet
  -> Bouton "Contacter l'hote"
    -> Modal de demande
      - Message de motivation (obligatoire)
      - Dates souhaitees (si projet flexible)
    -> Demande envoyee (statut : EN ATTENTE)
```

### 7.3 Formulaire de demande de participation [OK]

| Champ | Obligatoire | Condition |
|-------|-------------|-----------|
| Message de motivation | Oui | Toujours |
| Dates souhaitees (debut + fin) | Oui | Seulement si projet flexible |

**Verification anti-doublon :** Un volontaire ne peut pas envoyer deux demandes au meme projet tant qu'une demande est en attente ou acceptee.

### 7.4 Parcours utilisateur - Hote [OK]

Le hote recoit les demandes dans une section dediee ("Demandes recues").

**Affichage de chaque demande :**
- Nom + photo du demandeur
- Lien vers son profil
- Message de motivation
- Dates proposees (si flexible)
- Boutons : **Accepter** / **Refuser** (avec message optionnel)

### 7.5 Statuts de demande de participation [OK]

| Statut | Code | Description |
|--------|------|-------------|
| En attente | `PENDING` | Demande envoyee, pas encore traitee |
| Acceptee | `ACCEPTED` | Hote a accepte - conversation ouverte |
| Refusee | `REFUSED` | Hote a refuse - pas de conversation |
| Annulee | `CANCELLED` | Volontaire a annule sa demande |
| Expiree | `EXPIRED` | Aucune reponse apres 14 jours (automatique via cron Convex) |

### 7.6 Scenarios detailles

#### Scenario A : Le hote ACCEPTE [OK]

1. La demande passe au statut `ACCEPTED`
2. Une **conversation est creee automatiquement** (liee a la demande de participation et donc au projet)
3. La messagerie devient **libre et complete**
4. Les deux utilisateurs peuvent echanger librement
5. Le volontaire recoit une notification "Demande acceptee"

#### Scenario B : Le hote REFUSE [OK]

1. La demande passe au statut `REFUSED`
2. **Aucune conversation n'est creee**
3. Le volontaire voit "Refuse" dans ses demandes
4. Il peut eventuellement refaire une demande plus tard

#### Scenario C : Pas de reponse [OK]

1. La demande reste en `PENDING`
2. **Expiration automatique a J+14** (via cron Convex quotidien)
3. Le volontaire peut annuler sa demande a tout moment

### 7.7 Regle fondamentale

> Le hote ne peut pas repondre sans accepter ou refuser.
> Pas de "chat" avant acceptation = logique claire pour tout le monde.

### 7.8 Interface de messagerie [OK]

Une fois la conversation ouverte (apres acceptation) :

**Liste des conversations :**
- Avatar de l'autre utilisateur
- Nom
- Dernier message (apercu)
- Date du dernier message
- Badge nombre de messages non lus

**Vue conversation :**
- Historique des messages (temps reel via Convex reactive queries)
- Champ de saisie + bouton envoi
- Menu : Voir profil, Muter/Demuter, Supprimer

**Temps reel :**
Convex fournit le temps reel nativement via ses reactive queries (`useQuery`). Les messages, conversations et notifications se mettent a jour automatiquement sans WebSocket explicite.

### 7.9 Anti-spam email (Regle 24h) [OK]

> **Maximum 1 email par conversation toutes les 24 heures**

Logique (implementee dans `convex/messages.ts`) :
1. Verifier si l'utilisateur a les notifications email activees (`emailNotifications`)
2. Verifier si la conversation n'est pas "muted" (`user1Muted` / `user2Muted`)
3. Verifier si le dernier email envoye date de plus de 24h (`lastEmailSentToUser1` / `lastEmailSentToUser2`)
4. Si toutes les conditions sont remplies, envoyer l'email et mettre a jour le timestamp

**Ne jamais contourner cette logique** - c'est une fonctionnalite centrale anti-spam.

---

## 8. Systeme de Reviews

### 8.1 Eligibilite [OK]

| Condition | Detail |
|-----------|--------|
| Participation acceptee | La demande doit avoir le statut `ACCEPTED` |
| Activite recente | Les DEUX utilisateurs doivent avoir envoye au moins 1 message dans les 180 derniers jours |

**Regle des 180 jours** (implementee dans `convex/reviews.ts:checkEligibility`) : Ceci previent les faux avis provenant de conversations inactives. Les deux parties doivent avoir ete actives recemment.

### 8.2 Delai et expiration

| Parametre | Valeur |
|-----------|--------|
| Delai pour laisser une review | 30 jours |
| Publication automatique | Apres expiration du delai de 30 jours (via cron Convex) |

### 8.3 Bidirectionnalite [OK]

- Le **hote** peut noter le **volontaire**
- Le **volontaire** peut noter le **hote**
- Chacun independamment dans la fenetre de 30 jours

### 8.4 Publication style Airbnb [OK]

> Pour eviter les biais ("je te note bien si tu me notes bien") :

**Regle de publication :**
- Les reviews sont publiees **seulement quand** :
  - Les deux utilisateurs ont soumis leur review, **OU**
  - Le delai de 30 jours a expire
- Avant publication, les reviews sont "en attente" et invisibles

### 8.5 Contenu de la review [OK]

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Note globale | Oui | 1 a 5 (number) |
| Commentaire | Oui | Texte libre |

Note : Une seule note globale. Criteres multiples possibles en V2.

### 8.6 Reponse aux reviews [OK]

- Le destinataire d'un avis peut y repondre (une seule reponse)
- Champ `response` + `responseDate` sur le document review
- La reponse est publique

### 8.7 Suppression d'un avis [OK]

- L'auteur peut supprimer son avis tant qu'aucune reponse n'a ete ajoutee
- La suppression est definitive

### 8.8 Affichage des reviews [OK]

- Sur le profil de l'utilisateur
- Note moyenne + nombre de reviews (valeurs cachees sur le document user : `averageRating`, `reviewCount`)
- Liste des dernieres reviews recues
- Contrainte d'unicite : une seule review par paire writer/receiver

---

## 9. Recherches sauvegardees

### 9.1 Fonctionnement [OK]

**Action utilisateur :**
- Bouton "Sauvegarder cette recherche" sur la page de resultats
- Conditions : utilisateur connecte + au moins un filtre actif

**Donnees sauvegardees :**
- Filtres (JSON stringify des filtres actifs)
- Nom optionnel

**Implementation :**
- Table `savedSearches` dans le schema Convex
- Functions : `savedSearches.list`, `savedSearches.save`, `savedSearches.remove`

### 9.2 Limites [OK]

- Maximum **5 recherches** par utilisateur

### 9.3 Notifications intelligentes [PREVU V2]

Les notifications de nouveaux projets correspondant aux recherches sauvegardees ne sont pas encore implementees. Prevu pour V2 :
- Verification quotidienne via cron
- Maximum 1 email par semaine par recherche

### 9.4 Interface [OK]

Menu utilisateur : "Mes recherches sauvegardees"

Chaque recherche affiche :
- Resume des filtres
- Actions : Voir les resultats, Supprimer

---

## 10. Notifications

### 10.1 Types de notifications [OK]

| Type | Destinataire | Declencheur |
|------|--------------|-------------|
| Nouvelle demande de participation | Hote | Volontaire envoie une demande |
| Demande acceptee | Volontaire | Hote accepte |
| Demande refusee | Volontaire | Hote refuse |
| Nouveau message | Destinataire | Message recu dans conversation |
| Projet valide | Hote | Admin valide le projet |
| Projet refuse | Hote | Admin refuse (avec motif) |

### 10.2 Canaux de notification

| Canal | Statut |
|-------|--------|
| In-app (cloche + badge + compteur non-lu) | [OK] |
| Email (avec regle anti-spam 24h) | [SCAFFOLDING] Timestamps geres, envoi reel non implemente |
| Temps reel (Convex reactive queries) | [OK] |
| Push mobile | [PREVU V2] |

### 10.3 Modele de notification

Types definis dans le backend (`convex/notifications.ts`) :

| Code | Description |
|------|-------------|
| `REVIEW` | Avis disponible |
| `MESSAGE` | Nouveau message |
| `ADMIN` | Annonce admin |
| `PROJECT` | Mise a jour projet |
| `SYSTEM` | Notification systeme |

### 10.4 Parametres utilisateur [OK]

| Parametre | Description |
|-----------|-------------|
| Desactiver toutes les notifications email | Switch global (`emailNotifications`) |
| Notifications in-app | Switch global (`inAppNotifications`) |
| Muter une conversation | Desactiver les notifs pour une conversation specifique |

---

## 11. Panel Administrateur

Application React separee (Vite + Radix UI + Tailwind CSS) accessible a `http://localhost:5174` en dev et `https://admin.ecobilda.org` en prod.

**Communication reactive avec Convex :** Toutes les pages utilisent `useQuery` de `convex/react` via un hook helper `useAdminQuery` qui injecte automatiquement le token d'authentification. Les donnees se mettent a jour en temps reel sans polling. Le `ConvexProvider` n'enveloppe que les routes authentifiees (dans `ProtectedRoute`) pour eviter d'ouvrir un WebSocket sur la page de login.

Les mutations restent imperatives via `adminApi` (base sur `ConvexHttpClient`). Apres une mutation, les queries reactives se mettent automatiquement a jour.

### 11.1 Authentification admin [OK]

- Session token Convex (meme systeme que le frontend)
- Requiert `isStaff=true` ou `isSuperuser=true`
- Fonctions dediees sous `convex/admin/`

### 11.2 Dashboard [OK]

- Cartes de statistiques : utilisateurs, projets actifs, participations, reviews, signalements, messages, favoris
- Top pays et skills populaires
- Actions rapides (liens vers projets, signalements, utilisateurs)

### 11.3 Validation des projets [OK]

- **Onglet "En attente"** : liste des projets a valider avec carousel d'images, infos projet, skills, commodites
  - Actions : Approuver, Rejeter (avec raison obligatoire), Previsualiser
- **Onglet "Valides"** : projets approuves
  - Action : Invalider (remettre en attente)
- Recherche par titre ou nom du proprietaire
- Filtre par type (Permaculture / Eco-construction)

### 11.4 Gestion des utilisateurs [OK]

- Tableau paginable et triable (nom, email, note, date inscription, derniere connexion, statut)
- Recherche par nom/email
- Filtres : tous, email verifie, non verifie
- Actions : basculer verification email, bloquer/debloquer utilisateur, supprimer utilisateur (avec confirmation cascade)
- Badge "Bloque" (rouge) pour les utilisateurs desactives

### 11.5 Moderation des signalements [OK]

- **Onglet "En attente"** : signalements non traites
  - Actions : Marquer resolu (avec notes admin) ou Rejeter
- **Onglet "Tous"** : historique complet
- Recherche par nom/email du rapporteur ou details
- Filtre par raison de signalement

### 11.6 Statistiques proposees [OK]

| Metrique | Description |
|----------|-------------|
| Utilisateurs | Total, nouveaux ce mois, par pays |
| Projets | Total actifs, en attente, par type |
| Participations | Total, acceptees, refusees |
| Reviews | Total, note moyenne globale |
| Messages | Volume d'echanges |

### 11.7 Messages de contact [OK]

Page dediee `/contacts` dans l'admin pour gerer les messages recus via le formulaire de contact public.
- **Badge bleu** dans la sidebar affichant le nombre de messages non traites (reactif, mise a jour instantanee)
- Statuts : `new` (nouveau), `read` (lu), `replied` (repondu)
- Actions : Marquer comme lu, Marquer comme repondu, Repondre par email
- Support dark mode complet
- Backend : `convex/admin/contacts.ts` avec query `unreadCount` reactive

### 11.8 Dark mode [OK]

Le panel admin supporte dark/light mode avec persistence locale (`localStorage`). Le theme toggle est dans la sidebar.

### 11.9 Internationalisation admin [OK]

5 langues supportees dans le panel admin : EN, FR, ES, DE, PT
(NL non inclus dans l'admin)

### 11.10 Systeme de newsletters [PREVU V2]

Le systeme de newsletters et campagnes email interne au panel admin n'est **pas implemente** dans le MVP.

---

## 12. Signalements

### 12.1 Fonctionnalites [OK]

| Element | Description |
|---------|-------------|
| Qui peut signaler | Tout utilisateur connecte |
| Quoi signaler | Un projet, un avis, un utilisateur |
| Traitement | Review manuelle par admin dans le panel admin |
| Effet automatique | Aucun (pas de masquage automatique) |

### 12.2 Raisons de signalement [OK]

| Raison | Severite |
|--------|----------|
| Contenu inapproprie | Moyenne |
| Informations trompeuses | Moyenne |
| Spam | Moyenne |
| Harcelement | Haute |
| Contenu faux | Moyenne |
| Probleme de securite | Haute |
| Autre (texte libre) | Basse |

### 12.3 Suivi [OK]

- L'admin resout ou rejette avec des notes
- Historique complet accessible dans le panel admin

---

## 13. Support Multi-langue

### 13.1 Langues supportees [OK]

| Code | Langue | Statut |
|------|--------|--------|
| `en` | English | [OK] Defaut |
| `fr` | Francais | [OK] |
| `es` | Espanol | [OK] |
| `de` | Deutsch | [OK] |
| `nl` | Nederlands | [OK] |
| `pt` | Portugues | [OK] |

### 13.2 Implementation

- **Frontend :** next-intl avec fichiers de traduction par locale (`locales/{code}/translation.json`)
- **Admin :** Systeme de traduction interne (EN, FR, ES, DE, PT - pas de NL dans l'admin)
- **Backend :** Traductions des skills dans le seed (EN, FR, ES, DE)
- **Emails :** Envoyes dans la langue de communication de l'utilisateur (`notificationLanguage`)

### 13.3 Langue de l'utilisateur

- Definie a l'inscription (langue du navigateur ou selection)
- Utilisee pour :
  - Interface de l'application
  - Emails et notifications
  - Contenu traduit des skills

### 13.4 Langues des projets [OK]

- Chaque projet a une ou plusieurs langues (via `languageIds`)
- Permet de filtrer les projets par langue
- Indique les langues parlees sur place

---

## 14. Annexes

### 14.0 Infrastructure production

**Hebergement :** Serveur Hetzner (Ubuntu) avec Docker Compose

**Architecture :**
```
Internet
   |
[Caddy - TLS + reverse proxy]
   |
   +-- ecobilda.org / www.ecobilda.org  -> Next.js (port 3000)
   +-- ecobilda.org/api/storage/*       -> Convex (proxy pour images Convex Storage)
   +-- admin.ecobilda.org               -> Fichiers statiques (Vite build)
   +-- convex.ecobilda.org              -> Convex backend (port 3210)
   |
[Docker]
   +-- ecobilda-frontend  (Next.js standalone)
   +-- ecobilda-convex    (Convex self-hosted)
   +-- ecobilda-db        (PostgreSQL 15)
```

**Proxy `/api/storage/*` :** Configure dans `/etc/caddy/Caddyfile` pour que les URLs des images stockees dans Convex Storage (`/api/storage/UUID`) soient accessibles via le domaine frontend et non via le subdomain Convex.

**CI/CD :** GitHub Actions (`.github/workflows/deploy.yml`) se declenche a chaque push sur `main`. Le workflow SSHe sur le serveur et execute `scripts/deploy.sh` qui :
1. `git gc --prune=now` + `git fetch --force --prune` (evite les refs corrompues)
2. `git reset --hard origin/main`
3. Build des images Docker (frontend)
4. Deploy des fonctions Convex (`npx convex dev --once`)
5. Build du panel admin et copie dans `/opt/ecobilda/admin-dist/`

**Secrets GitHub requis :** `SERVER_IP`, `SSH_PRIVATE_KEY`

### 14.1 Systeme d'email transactionnel [OK]

**Fournisseur :** Microsoft Graph API (NOT SMTP)

**Implementation :** `convex/emails.ts`

**Types d'emails envoyes :**
- Verification d'email (inscription)
- Reinitialisation de mot de passe
- Nouveau message (avec regle anti-spam 24h)
- Nouvelle review
- Reponse a une review

**Variables d'environnement Convex (set via `npx convex env set`) :**

| Variable | Description |
|----------|-------------|
| `MS_GRAPH_TENANT_ID` | Azure AD tenant ID |
| `MS_GRAPH_CLIENT_ID` | App registration client ID |
| `MS_GRAPH_CLIENT_SECRET` | App registration secret |
| `MS_GRAPH_MAILBOX` | Mailbox reelle (`noreply@ecobilda.org` - shared mailbox) |
| `DEFAULT_FROM_EMAIL` | Adresse affichee au destinataire |
| `FRONTEND_URL` | URL pour les liens dans les emails |

**Important :** `MS_GRAPH_MAILBOX` doit etre une vraie boite Azure AD (user ou shared mailbox), pas juste un alias. L'API Graph `users/{mailbox}/sendMail` necessite une identite reelle. Les alias ne peuvent etre utilises que dans le champ `from` du payload avec permission "Send As".

**Templates multilingues :** Tous les emails sont traduits en 6 langues (EN, FR, ES, DE, NL, PT) avec templates HTML responsive definis dans `emails.ts`.

### 14.2 Modele de donnees (Convex schema)

```
users
|-- _id, email, firstName, lastName
|-- dateOfBirth, gender
|-- profilePicture (storageId), profilePictureUrl (external URL)
|-- bio, addressId (-> addresses)
|-- languageIds[] (-> languages)
|-- skillIds[] (-> skills)
|-- averageRating, reviewCount (cached)
|-- emailNotifications, newsletter, inAppNotifications
|-- notificationLanguage
|-- isProfileVisible, isActive, isStaff, isSuperuser
|-- emailVerified, emailVerificationToken
|-- legacyPasswordHash, hasPassword
|-- lastLoginAt, updatedAt, _creationTime

projects
|-- _id, ownerId (-> users)
|-- title, description, projectType (PERM/NATB)
|-- addressId (-> addresses)
|-- hoursPerDay, daysPerWeek, maxHelpers
|-- accommodationDetails, foodDetails
|-- internetProvided, familyFriendly, petsAllowed, smokingAllowed
|-- skillIds[] (-> skills)
|-- isActive, flaggedCount
|-- status (DRAFT/PENDING/ACTIVE/REJECTED)
|-- rejectionReason, validatedAt, validatedBy
|-- updatedAt, _creationTime

availability
|-- projectId (-> projects)
|-- year
|-- january..december (12 booleans)

projectImages
|-- projectId (-> projects)
|-- storageId (-> _storage)
|-- order (0 = couverture)

participationRequests
|-- volunteerId (-> users)
|-- projectId (-> projects)
|-- message
|-- requestedStartDate, requestedEndDate
|-- status (PENDING, ACCEPTED, REFUSED, CANCELLED, EXPIRED)
|-- hostMessage
|-- _creationTime

conversations
|-- participationRequestId (-> participationRequests)
|-- user1Id, user2Id (-> users)
|-- lastMessageText, lastMessageAt
|-- unreadCountUser1, unreadCountUser2
|-- lastEmailSentToUser1, lastEmailSentToUser2
|-- user1Muted, user2Muted
|-- _creationTime

messages
|-- conversationId (-> conversations)
|-- senderId (-> users)
|-- body
|-- _creationTime

reviews
|-- writerId (-> users)
|-- receiverId (-> users)
|-- rating (1-5 number)
|-- feedback (texte)
|-- response (texte, optionnel)
|-- responseDate
|-- isPublished
|-- _creationTime
|-- unique: [writerId, receiverId]

notifications
|-- recipientId (-> users)
|-- type (REVIEW, MESSAGE, ADMIN, PROJECT, SYSTEM)
|-- title, message
|-- linkUrl
|-- isRead, readAt
|-- _creationTime

reports
|-- reporterId (-> users)
|-- targetType (PROJECT, REVIEW, USER)
|-- targetId
|-- reason, details
|-- status (PENDING, RESOLVED, DISMISSED)
|-- resolvedBy, resolvedAt, resolutionNotes
|-- _creationTime

savedSearches
|-- userId (-> users)
|-- name
|-- filters (JSON string)

contactMessages
|-- name, email, subject, message
|-- status (new, read, resolved)

favorites
|-- userId (-> users)
|-- projectId (-> projects)
|-- _creationTime

addresses
|-- city, street, streetNumber, postalCode
|-- countryId (-> countries)
|-- latitude, longitude
|-- formattedAddress

countries
|-- code (ISO 3166-1 alpha-2)
|-- name

languages
|-- code (ISO 639-1)
|-- name

skills
|-- code
|-- category (PERM/NATB)
|-- displayNameEn, displayNameFr, displayNameEs, displayNameDe
|-- displayNameNl, displayNamePt
|-- icon

sessions
|-- userId (-> users)
|-- token
|-- expiresAt (timestamp)
```

### 14.3 Recapitulatif des regles metier critiques

| Regle | Description | Localisation |
|-------|-------------|-------------|
| Validation email | Obligatoire avant connexion | `convex/auth.ts` |
| Age minimum 18 ans | Date de naissance requise a l'inscription | `convex/auth.ts` |
| Profil complet | Requis pour creer un projet (bio, photo, adresse, langues) | Verification frontend |
| 5 images minimum | Pour soumettre un projet a validation | Verification frontend |
| Validation admin | Projets valides avant publication | `convex/admin/projects.ts` |
| Pas de DM libre | Contact uniquement via demande de participation | `convex/participations.ts` |
| Conversation apres acceptation | Hote doit accepter pour ouvrir le chat | `convex/participations.ts` |
| Anti-doublon participation | Une seule demande active par projet/volontaire | `convex/participations.ts` |
| Expiration demande J+14 | Expiration automatique sans reponse | `convex/crons.ts` |
| Anti-spam email 24h | Max 1 email/conversation/24h | `convex/messages.ts` |
| Eligibilite review 180 jours | Les 2 doivent avoir envoye des messages dans les 180 derniers jours | `convex/reviews.ts` |
| Delai review 30 jours | Fenetre limitee pour noter | `convex/crons.ts` |
| Publication review simultanee | Publiees ensemble ou a expiration du delai | `convex/crons.ts` |
| 16 skills fixes | Donnees de reference, pas configurable | `convex/seed.ts` |
| Max 5 recherches sauvegardees | Limite par utilisateur | `convex/savedSearches.ts` |
| PBKDF2 password hashing | 600k iterations SHA-256 | `convex/auth.ts` |

### 14.4 Taches planifiees (Convex Crons)

| Tache | Frequence | Description |
|-------|-----------|-------------|
| `expireParticipationRequests` | Quotidienne (3h UTC) | Expire les demandes PENDING de plus de 14 jours |
| `autoPublishReviews` | Quotidienne (4h UTC) | Publie les reviews apres 30 jours |
| `cleanupSessions` | Quotidienne (5h UTC) | Supprime les sessions expirees |

**Prevu V2 :**
- Rappel demande hote J+10
- Rappel review J+7
- Verification recherches sauvegardees (matching nouveaux projets)

### 14.5 Pages du frontend [OK]

**Pages publiques :**

| Page | Route | Description |
|------|-------|-------------|
| Accueil | `/` | Hero, features, FAQ, CTA |
| A propos | `/about` | Presentation de la plateforme |
| Comment ca marche | `/how-it-works` | Explication du fonctionnement |
| Pour les hotes | `/for-hosts` | Avantages pour les hotes |
| Pour les volontaires | `/for-volunteers` | Avantages pour les volontaires |
| FAQ | `/faq` | Foire aux questions |
| Contact | `/contact` | Formulaire de contact (stocke dans `contactMessages`) |
| Conditions d'utilisation | `/terms` | Mentions legales |
| Politique de confidentialite | `/privacy` | Politique RGPD |
| Projets | `/projects` | Liste + carte Mapbox |
| Detail projet | `/projects/[id]` | Page detail avec images, skills, carte |
| Recherche | `/search` | Recherche avancee |

**Pages authentifiees :**

| Page | Route | Description |
|------|-------|-------------|
| Creer un projet | `/create-project` | Formulaire multi-etapes |
| Mes favoris | `/favorites` | Projets favoris |
| Messages | `/messages` | Liste des conversations |
| Conversation | `/messages/[id]` | Chat temps reel |
| Mes projets | `/my-projects` | Projets du proprietaire |
| Notifications | `/notifications` | Centre de notifications |
| Participations | `/participations` | Demandes envoyees/recues |
| Profil | `/profile` | Visualisation/edition du profil |
| Parametres | `/settings` | Parametres du compte |

**Pages auth :**

| Page | Route | Description |
|------|-------|-------------|
| Connexion | `/login` | Email/password + Google |
| Inscription | `/register` | Formulaire d'inscription |
| Mot de passe oublie | `/forgot-password` | Demande de reinitialisation |
| Reinitialisation | `/reset-password/[uid]/[token]` | Nouveau mot de passe |
| Verification email | `/verify-email/[token]` | Confirmation email |

---

## 15. Differences avec les versions precedentes

### v3.0 (5 avril 2026) - Migration Convex

| Element | Avant (v2.0 Django) | Maintenant (v3.0 Convex) |
|---------|---------------------|--------------------------|
| Backend | Django 5.0 + DRF + PostgreSQL | Convex self-hosted (TypeScript) |
| Auth | JWT (SimpleJWT) access+refresh | Session tokens (table `sessions`, 7 jours) |
| Password hashing | SHA-256 simple | PBKDF2 (600k iterations) |
| Temps reel | Django Channels WebSocket | Convex reactive queries (natif) |
| Taches planifiees | Celery Beat (5 taches) | Convex crons (3 taches) |
| File storage | MEDIA_ROOT local | Convex File Storage (_storage) |
| Data model | snake_case | camelCase |
| Admin API | Django REST endpoints | Convex admin/ module |
| TanStack Query | Utilise pour data fetching | Remplace par Convex `useQuery` |
| Axios | HTTP client | Supprime (Convex client natif) |

### v2.0 (22 mars 2026)

Ajouts : NL+PT, panel admin separe, recherches sauvegardees, skills revises, Celery Beat.
Suppressions : Apple OAuth, PostGIS, filtre par rayon.

### v1.0 (15 janvier 2026)

Version initiale (specification de design).

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 15/01/2026 | Version initiale (specification de design) |
| 2.0 | 22/03/2026 | Mise a jour complete refletant l'etat reel du code Django |
| 3.0 | 05/04/2026 | Migration Convex : backend, auth, password hashing, storage, admin panel, data model camelCase, suppression Django/Celery/WebSocket |

---

> **Document de reference pour le developpement de la plateforme Ecobilda.**
> Toute modification significative doit etre refletee dans ce document.
