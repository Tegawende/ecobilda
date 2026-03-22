# Ecobilda - Specification Fonctionnelle Complete

> **Document de reference** pour le developpement de la plateforme Ecobilda.
>
> **Version** : 2.0
> **Date** : 22 mars 2026
> **Statut** : Mise a jour refletant l'etat reel du code

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
15. [Differences avec la specification originale](#15-differences-avec-la-specification-originale)

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
| Backend | Django 5.0, Django REST Framework 3.14, PostgreSQL 15, Redis 7, Django Channels 4 (WebSocket), Celery 5 |
| Frontend | Next.js 16 + React 19 + TypeScript 5, Mantine v7, TanStack Query, next-intl, Tailwind CSS 4, Mapbox GL |
| Admin Panel | React 18 + TypeScript 5, Vite 5, Radix UI (shadcn/ui), TanStack Query, React Router 6 |
| Auth | JWT (SimpleJWT) + Google OAuth |
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
- Champ `date_of_birth` de type `DateField` dans le modele `User`

### 2.3 Validation email [OK]

- **Obligatoire** avant de pouvoir se connecter
- L'utilisateur recoit un email avec un lien de confirmation contenant un token
- Tant que l'email n'est pas valide, l'utilisateur ne peut pas acceder a son compte
- **Pas d'auto-login apres inscription** : l'utilisateur doit d'abord verifier son email

### 2.4 Flux d'authentification [OK]

```
Inscription -> Email de verification -> Clic sur le lien -> Connexion
-> JWT (access + refresh) stocke en localStorage
-> Intercepteur axios pour refresh automatique sur 401
```

### 2.5 Recuperation de mot de passe [OK]

1. L'utilisateur saisit son email
2. Un lien de reinitialisation est envoye (avec token)
3. L'utilisateur definit un nouveau mot de passe
4. Reponse identique que l'email existe ou non (securite anti-enumeration)

### 2.6 Changement de mot de passe [OK]

- Accessible depuis les parametres du compte
- Requiert l'ancien mot de passe
- Nouveaux tokens JWT generes apres changement

### 2.7 Permissions par type d'utilisateur

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

**Adresse simplifiee :** Le profil utilisateur utilise ville + pays uniquement (pas d'adresse complete). Le modele `Address` est utilise via une relation OneToOne, mais seuls la ville et le pays sont pertinents pour le profil public.

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
| Langues du projet | Oui | Langues parlees sur le projet (ManyToMany vers Language) |

#### Etape 2 - Localisation

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| Ville | Oui | Ville du projet |
| Pays | Oui | Pays du projet |
| Rue + Numero | Optionnel | Adresse exacte |
| Code postal | Optionnel | Code postal |
| Coordonnees GPS | Oui | Latitude/Longitude (saisie via carte ou geocodage) |

**Note :** Pas de geocodage automatique PostGIS. Les coordonnees sont stockees dans le modele `Address` avec des champs `DecimalField` (latitude/longitude). La recherche geographique se fait cote frontend via les limites de la carte Mapbox (viewport bounds), pas par rayon.

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
- Stockage : modele `Availability` avec une ligne par annee et un boolean par mois
- Le volontaire propose un range de dates dans sa demande de participation

**Images :**

| Contrainte | Valeur |
|------------|--------|
| Minimum | 5 images (requis pour soumettre le projet) |
| Formats acceptes | JPG, PNG, WebP |
| Taille max par image | 5 MB |
| Image de couverture | Premiere image (order=0) |
| Reordonnancement | Boutons fleches (haut/bas), pas de drag-and-drop |
| Stockage | Local (MEDIA_ROOT), pas S3 |

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

**Difference avec la spec originale :** Les skills ont ete completement revus. Les 8 skills permaculture originaux (Beekeeping, Food Forest, Seed Saving, Natural Farming, Water Management, Animal Husbandry) et eco-construction (Natural Insulation, Green Roofing, Solar Energy, Rainwater Harvesting) ont ete remplaces par des competences plus specifiques et concretes.

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
| Mots-cles | Texte libre | Recherche dans titre + description |
| Internet | Toggle | Projets avec internet |
| Animaux acceptes | Toggle | Projets acceptant les animaux |
| Familles | Toggle | Projets family-friendly |
| Non-fumeur | Toggle | Projets strictement non-fumeur |

**[SUPPRIME] Filtre par rayon (km) :** PostGIS a ete retire. Le filtrage geographique se fait via les limites de la carte Mapbox (viewport bounds) cote frontend, pas par recherche de rayon cote backend.

**[PREVU] Filtre par plage de dates :** L'API backend le supporte mais le frontend ne l'implemente pas encore.

### 5.2 Recherche textuelle [OK]

- Recherche dans : **Titre** + **Description** du projet
- Recherche insensible a la casse
- Recherche partielle (contient)

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

Pour un projet a **dates fixes**, le volontaire postule pour les dates definies par le hote.

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
| Expiree | `EXPIRED` | Aucune reponse apres 14 jours (automatique via Celery) |

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
2. **Rappel email a J+10** (via Celery Beat)
3. **Expiration automatique a J+14** (via Celery Beat)
4. Le volontaire peut annuler sa demande a tout moment

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
- Historique des messages (temps reel via WebSocket)
- Indicateur de frappe ("X est en train d'ecrire...")
- Champ de saisie + bouton envoi
- Menu : Voir profil, Muter/Demuter, Supprimer
- Fallback HTTP si WebSocket indisponible

**Canaux WebSocket :**
- `ws://host/ws/chat/?token={jwt}` - Chat temps reel
- `ws://host/ws/notifications/?token={jwt}` - Notifications temps reel

### 7.9 Anti-spam email (Regle 24h) [OK]

> **Maximum 1 email par conversation toutes les 24 heures**

Logique (implementee dans `messaging/models.py:should_send_email_to`) :
1. Verifier si l'utilisateur a les notifications email activees (`user.email_notifications`)
2. Verifier si la conversation n'est pas "muted" (`user1_muted` / `user2_muted`)
3. Verifier si le dernier email envoye date de plus de 24h (`last_email_sent_to_userX`)
4. Si toutes les conditions sont remplies, envoyer l'email et mettre a jour le timestamp

**Ne jamais contourner cette logique** - c'est une fonctionnalite centrale anti-spam.

---

## 8. Systeme de Reviews

### 8.1 Eligibilite [OK]

| Condition | Detail |
|-----------|--------|
| Participation acceptee | La demande doit avoir le statut `ACCEPTED` |
| Activite recente | Les DEUX utilisateurs doivent avoir envoye au moins 1 message dans les 180 derniers jours |

**Regle des 180 jours** (implementee dans `reviews/utils.py`) : Ceci previent les faux avis provenant de conversations inactives. Les deux parties doivent avoir ete actives recemment.

### 8.2 Delai et expiration

| Parametre | Valeur |
|-----------|--------|
| Delai pour laisser une review | 30 jours |
| Notification review disponible | J+2 apres la fin de la participation |
| Rappel review | J+7 si pas de review soumise |
| Publication automatique | Apres expiration du delai de 30 jours (via Celery) |

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
| Note globale | Oui | 1.0 a 5.0 (stocke en DecimalField) |
| Commentaire | Oui | Texte libre |

Note : Une seule note globale. Criteres multiples possibles en V2.

### 8.6 Reponse aux reviews [OK]

- Le destinataire d'un avis peut y repondre (une seule reponse)
- Champ `response` + `response_date` sur le modele `Review`
- La reponse est publique

### 8.7 Suppression d'un avis [OK]

- L'auteur peut supprimer son avis tant qu'aucune reponse n'a ete ajoutee
- La suppression est definitive

### 8.8 Affichage des reviews [OK]

- Sur le profil de l'utilisateur
- Note moyenne + nombre de reviews (valeurs cachees sur le modele `User` : `average_rating`, `review_count`)
- Liste des dernieres reviews recues
- Contrainte d'unicite : une seule review par paire writer/receiver

---

## 9. Recherches sauvegardees

### 9.1 Fonctionnement [OK]

**Action utilisateur :**
- Bouton "Sauvegarder cette recherche" sur la page de resultats
- Conditions : utilisateur connecte + au moins un filtre actif

**Donnees sauvegardees :**
- Type de projet
- Localisation (pays)
- Competences
- Langues
- Toggles (internet, animaux, familles, etc.)
- Mots-cles

### 9.2 Limites [OK]

- Maximum **5 recherches** par utilisateur
- Nom genere automatiquement (ex: "Permaculture - France")

### 9.3 Notifications intelligentes [OK]

**Declencheur :**
- Nouveau projet publie (statut ACTIVE apres validation admin)
- Matching avec une recherche sauvegardee

**Frequence :**
- Maximum 1 email par **semaine** par recherche
- Regroupement possible : "3 nouveaux projets correspondent a ta recherche"

**Logique de matching :**
- Matching strict (booleen)
- Pas d'IA, pas de scoring
- Fiable, explicable, previsible

**Verification quotidienne** via Celery Beat.

### 9.4 Interface [OK]

Menu utilisateur : "Mes recherches sauvegardees"

Chaque recherche affiche :
- Resume des filtres
- Date de derniere notification
- Actions : Voir les resultats, Supprimer, Desactiver les notifications

---

## 10. Notifications

### 10.1 Types de notifications [OK]

| Type | Destinataire | Declencheur |
|------|--------------|-------------|
| Nouvelle demande de participation | Hote | Volontaire envoie une demande |
| Demande acceptee | Volontaire | Hote accepte |
| Demande refusee | Volontaire | Hote refuse |
| Nouveau message | Destinataire | Message recu dans conversation |
| Review disponible | Les deux | J+2 apres fin participation |
| Rappel review | Les deux | J+7 si pas de review |
| Projet valide | Hote | Admin valide le projet |
| Projet refuse | Hote | Admin refuse (avec motif) |
| Nouvelle correspondance recherche | Utilisateur | Nouveau projet correspondant a une recherche sauvegardee |

### 10.2 Canaux de notification

| Canal | Statut |
|-------|--------|
| In-app (cloche + badge + compteur non-lu) | [OK] |
| Email (avec regle anti-spam 24h) | [OK] |
| Temps reel (WebSocket) | [OK] |
| Push mobile | [PREVU V2] |

### 10.3 Modele de notification

Types definis dans le backend (`NotificationType`) :

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
| Desactiver toutes les notifications email | Switch global (`email_notifications`) |
| Notifications in-app | Switch global (`in_app_notifications`) |
| Muter une conversation | Desactiver les notifs pour une conversation specifique |

---

## 11. Panel Administrateur

Application React separee (pas le Django admin) accessible a `http://localhost:5174`.

### 11.1 Authentification admin [OK]

- JWT separee (memes tokens que le backend principal)
- Requiert `is_staff=True` ou `is_superuser=True`
- API dediee sous `/api/admin/...`

### 11.2 Dashboard [OK]

- 8 cartes de statistiques : utilisateurs, projets actifs, taux de conversion, signalements en attente, messages, favoris, hotes, note moyenne
- Graphique d'activite (courbes Recharts : nouveaux utilisateurs + nouveaux projets par jour)
- Top pays (distribution des projets)
- Skills populaires
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
- Badges de severite par raison (rouge : harcelement/securite, jaune : spam/faux, gris : autre)
- Recherche par nom/email du rapporteur ou details
- Filtre par raison de signalement

### 11.6 Statistiques proposees [OK]

| Metrique | Description |
|----------|-------------|
| Utilisateurs | Total, nouveaux ce mois, par pays |
| Projets | Total actifs, en attente, par type |
| Participations | Total, acceptees, refusees, taux de conversion |
| Reviews | Total, note moyenne globale |
| Messages | Volume d'echanges |

### 11.7 Internationalisation admin [OK]

5 langues supportees dans le panel admin : EN, FR, ES, DE, PT
(NL non inclus dans l'admin)

### 11.8 Systeme de newsletters [PREVU V2]

Le systeme de newsletters et campagnes email interne au panel admin n'est **pas implemente** dans le MVP. Prevu pour une version ulterieure :

- Campagnes email avec segmentation avancee
- Editeur de contenu structure
- Templates responsive
- Previsualisation et tests
- Planification d'envoi

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

- L'utilisateur peut voir ses signalements soumis
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

**Difference avec la spec originale :** 6 langues au lieu de 4. Nederlands (NL) et Portugues (PT) ont ete ajoutes.

### 13.2 Implementation

- **Frontend :** next-intl avec fichiers de traduction par locale (`locales/{code}/translation.json`)
- **Admin :** Systeme de traduction interne (EN, FR, ES, DE, PT - pas de NL dans l'admin)
- **Backend :** Traductions des skills dans les fixtures (EN, FR, ES, DE)
- **Emails :** Envoyes dans la langue de communication de l'utilisateur (`notification_language`)

### 13.3 Langue de l'utilisateur

- Definie a l'inscription (langue du navigateur ou selection)
- Utilisee pour :
  - Interface de l'application
  - Emails et notifications
  - Contenu traduit des skills

### 13.4 Langues des projets [OK]

- Chaque projet a une ou plusieurs langues (ManyToMany vers `Language`)
- Permet de filtrer les projets par langue
- Indique les langues parlees sur place

---

## 14. Annexes

### 14.1 Modele de donnees

```
User
|-- id, email, first_name, last_name
|-- date_of_birth, gender
|-- profile_picture, bio
|-- address (FK Address -> city, country)
|-- languages[] (ManyToMany Language)
|-- skills[] (via related_name)
|-- average_rating, review_count (cached)
|-- email_notifications, newsletter, in_app_notifications
|-- notification_language
|-- is_profile_visible
|-- created_at, updated_at, last_login_at

Project
|-- id, owner (FK User)
|-- title, description, project_type (PERM/NATB)
|-- address (FK Address)
|-- hours_per_day, days_per_week, max_helpers
|-- accommodation_details, food_details
|-- internet_provided, family_friendly, pets_allowed, smoking_allowed
|-- skills[] (ManyToMany Skill)
|-- languages[] (ManyToMany Language)
|-- is_active, flagged_count
|-- availabilities[] (OneToMany Availability)
|-- images[] (OneToMany ProjectImage)
|-- created_at, updated_at

Availability
|-- project (FK Project)
|-- year
|-- january..december (12 BooleanField)

ProjectImage
|-- project (FK Project)
|-- image (ImageField -> projects/%Y/%m/)
|-- order (0 = couverture)
|-- uploaded_at

ParticipationRequest
|-- id
|-- volunteer (FK User)
|-- project (FK Project)
|-- message
|-- requested_start_date, requested_end_date
|-- status (PENDING, ACCEPTED, REFUSED, CANCELLED, EXPIRED)
|-- created_at, updated_at

Conversation
|-- id
|-- participation_request (FK ParticipationRequest)
|-- user1, user2 (FK User)
|-- last_message_text, last_message_at
|-- unread_count_user1, unread_count_user2
|-- last_email_sent_to_user1, last_email_sent_to_user2
|-- user1_muted, user2_muted
|-- created_at, updated_at

Message
|-- id
|-- conversation (FK Conversation)
|-- sender (FK User)
|-- body
|-- created_at

Review
|-- id
|-- writer (FK User, related_name=reviews_given)
|-- receiver (FK User, related_name=reviews_received)
|-- rating (DecimalField 1.0-5.0)
|-- feedback (texte)
|-- response (texte, optionnel)
|-- response_date
|-- is_published
|-- created_at, updated_at
|-- unique_together: [writer, receiver]

Notification
|-- id
|-- recipient (FK User)
|-- type (REVIEW, MESSAGE, ADMIN, PROJECT, SYSTEM)
|-- title, message
|-- link_url
|-- is_read, read_at
|-- created_at

Report (Signalement)
|-- id
|-- reporter (FK User)
|-- target_type (PROJECT, REVIEW, USER)
|-- target_id
|-- reason
|-- admin_notes, status (PENDING, RESOLVED, REJECTED)
|-- created_at

SavedSearch
|-- id
|-- user (FK User)
|-- name (genere automatiquement)
|-- filters (JSONField)
|-- notifications_enabled
|-- last_notified_at
|-- created_at

Favorite
|-- id
|-- user (FK User)
|-- project (FK Project)
|-- created_at

Address
|-- id
|-- city, street, street_number, postal_code
|-- country (FK Country)
|-- latitude, longitude (DecimalField)
|-- formatted_address
|-- created_at, updated_at

Country
|-- code (PK, ISO 3166-1 alpha-2)
|-- name

Language
|-- code (PK, ISO 639-1)
|-- name

Skill
|-- code (PK)
|-- category (PERM/NATB)
|-- display_name_en, display_name_fr, display_name_es, display_name_de
```

### 14.2 Recapitulatif des regles metier critiques

| Regle | Description | Localisation |
|-------|-------------|-------------|
| Validation email | Obligatoire avant connexion | `authentication/` |
| Age minimum 18 ans | Date de naissance requise a l'inscription | `users/models.py` |
| Profil complet | Requis pour creer un projet (bio, photo, adresse, langues) | `users/models.py:has_complete_profile` |
| 5 images minimum | Pour soumettre un projet a validation | `projects/views.py` |
| Validation admin | Projets valides avant publication | `projects/` |
| Pas de DM libre | Contact uniquement via demande de participation | `participations/` |
| Conversation apres acceptation | Hote doit accepter pour ouvrir le chat | `participations/` |
| Anti-doublon participation | Une seule demande active par projet/volontaire | `participations/` |
| Expiration demande J+14 | Expiration automatique sans reponse | Celery Beat |
| Rappel demande J+10 | Email de rappel au hote | Celery Beat |
| Anti-spam email 24h | Max 1 email/conversation/24h | `messaging/models.py:should_send_email_to` |
| Eligibilite review 180 jours | Les 2 doivent avoir envoye des messages dans les 180 derniers jours | `reviews/utils.py` |
| Delai review 30 jours | Fenetre limitee pour noter | Celery Beat |
| Publication review simultanee | Publiees ensemble ou a expiration du delai | Celery Beat |
| 16 skills fixes | Donnees de reference, pas configurable | `skills/fixtures/initial_skills.json` |
| Max 5 recherches sauvegardees | Limite par utilisateur | `searches/` |

### 14.3 Taches Celery planifiees (Celery Beat)

| Tache | Frequence | Description |
|-------|-----------|-------------|
| Expiration des demandes | Quotidienne | Expire les demandes PENDING de plus de 14 jours |
| Rappel demande hote | Quotidienne | Email de rappel a J+10 |
| Publication auto reviews | Quotidienne | Publie les reviews apres 30 jours |
| Rappel review | Quotidienne | Rappel a J+7 si pas de review soumise |
| Verification recherches sauvegardees | Quotidienne | Verifie les nouveaux projets correspondant aux recherches |

### 14.4 Pages publiques du frontend [OK]

| Page | Route | Description |
|------|-------|-------------|
| Accueil | `/` | Hero, features, FAQ, CTA |
| A propos | `/about` | Presentation de la plateforme |
| Comment ca marche | `/how-it-works` | Explication du fonctionnement |
| Pour les hotes | `/for-hosts` | Avantages pour les hotes |
| Pour les volontaires | `/for-volunteers` | Avantages pour les volontaires |
| FAQ | `/faq` | Foire aux questions |
| Contact | `/contact` | Formulaire de contact |
| Conditions d'utilisation | `/terms` | Mentions legales |
| Politique de confidentialite | `/privacy` | Politique RGPD |
| Page 404 | `/*` | Page non trouvee |

---

## 15. Differences avec la specification originale

Ce document remplace la specification v1.0 du 15 janvier 2026. Voici les differences significatives :

### Ajouts

| Element | Detail |
|---------|--------|
| Date de naissance obligatoire | Requise a l'inscription (3 selects jour/mois/annee, minimum 18 ans). Etait marquee "supprimee" dans la v1. |
| 2 langues supplementaires | NL (Nederlands) et PT (Portugues) ajoutes. 6 langues au total au lieu de 4. |
| Panel admin separe | Application React distincte au lieu d'un Django admin. Dashboard, validation projets, gestion users, moderation signalements. |
| Recherches sauvegardees | Systeme complet : max 5/utilisateur, notifications hebdomadaires, matching strict. |
| Signalement d'utilisateurs | Possibilite de signaler un utilisateur (en plus des projets et reviews). |
| Statut DRAFT des projets | Ajout d'un statut brouillon avant soumission. |
| Expiration automatique J+14 | Demandes de participation expirent automatiquement apres 14 jours sans reponse. |
| Rappels automatiques | Email de rappel a J+10 pour le hote, J+7 pour les reviews. |
| WebSocket temps reel | Chat et notifications en temps reel via Django Channels. |
| Celery Beat | 5 taches planifiees pour l'automatisation (expirations, rappels, publication reviews, matching recherches). |

### Suppressions

| Element | Detail |
|---------|--------|
| Apple OAuth | [SUPPRIME] Complexite sans valeur ajoutee pour le MVP. |
| PostGIS / Geocodage backend | [SUPPRIME] Pas de recherche par rayon. Le filtrage geographique se fait via viewport bounds Mapbox cote frontend. |
| Filtre par rayon (km) | [SUPPRIME] Consequence de la suppression de PostGIS. |
| Systeme de newsletters admin | [PREVU V2] Non implemente. Campagnes email, segmentation, editeur de contenu reportes. |

### Modifications

| Element | Avant (v1.0) | Maintenant (v2.0) |
|---------|-------------|-------------------|
| Skills Permaculture | Beekeeping, Food Forest, Seed Saving, Natural Farming, Water Management, Animal Husbandry | Grafting, Pruning, Harvesting, Weeding, Propagating, Seeds harvesting |
| Skills Eco-construction | Natural Insulation, Green Roofing, Solar Energy, Rainwater Harvesting | Strawbale building, Cob building, Lime plaster, Hempcrete, Tadelakt plaster |
| Garden maintenance | Oui (conserve) | Oui (conserve) |
| Composting | Oui (conserve) | Oui (conserve) |
| Carpentry | Oui (conserve) | Oui (conserve) |
| Stone Masonry -> Masonry | Stone Masonry | Masonry (simplifie) |
| Earthen Plaster | Oui (conserve) | Oui (conserve) |
| Natural Building (skill) | Existait comme skill | Remplace par des skills plus specifiques |
| Localisation | Adresse complete + geocodage automatique | Coordonnees GPS + ville/pays (saisie simplifiee) |
| Note review | 1 a 5 etoiles (integer) | 1.0 a 5.0 (DecimalField) |
| Commentaire review | Optionnel | Obligatoire |
| Expiration demande | Optionnelle | Automatique a J+14 |
| Texte bouton contact | "Rejoindre / S'inscrire au projet" | "Contacter l'hote" |
| Stockage images | S3 / presigned URLs (prevu) | Stockage local (MEDIA_ROOT) |

---

## Changelog

| Version | Date | Modifications |
|---------|------|---------------|
| 1.0 | 15/01/2026 | Version initiale (specification de design) |
| 2.0 | 22/03/2026 | Mise a jour complete refletant l'etat reel du code. Ajout NL+PT, suppression Apple OAuth et PostGIS, skills revises, admin panel separe, recherches sauvegardees, Celery Beat, WebSocket, signalements etendus. |

---

> **Document de reference pour le developpement de la plateforme Ecobilda.**
> Toute modification significative doit etre refletee dans ce document.
