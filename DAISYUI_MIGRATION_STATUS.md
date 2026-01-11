# Migration DaisyUI - Statut des Pages

## Pages Migrées Complètement ✅

### 1. FAQ Page ([FAQ.tsx](frontend/src/pages/FAQ.tsx))
**Composants DaisyUI utilisés:**
- `hero` - Section hero avec background image
- `collapse` / `collapse-arrow` - Accordions pour Q&A
- `alert alert-success` - Message de contact
- Icons React Icons (`FaChevronRight`) au lieu d'emojis

**Avant/Après:**
- ❌ État React pour gérer les accordions
- ✅ Radio inputs natifs gérés par DaisyUI
- ❌ Emojis
- ✅ Icons React Icons

### 2. HomePage ([HomePage.tsx](frontend/src/pages/HomePage.tsx))
**Composants DaisyUI utilisés:**
- `hero` - Hero fullscreen avec background `/images/home_cover.jpeg`
- `card` - Cards pour Permaculture et Natural Building
- `btn btn-primary`, `btn btn-outline` - Boutons call-to-action
- Icons React Icons:
  - `FaSeedling`, `FaHammer` - Icons principales
  - `FaLeaf`, `FaRecycle`, `GiPlantSeed`, `FaCut` - Skills permaculture
  - `GiWoodBeam`, `FaTractor`, `GiStoneWall`, `GiBrickWall` - Skills construction

**Avant/Après:**
- ❌ Gradient backgrounds custom
- ✅ DaisyUI hero avec overlay
- ❌ Emojis 🌿 🏗️
- ✅ Icons React Icons avec couleurs thème
- ❌ Classes Tailwind custom pour cards
- ✅ Composant `card` DaisyUI

### 3. LoginPage ([LoginPage.tsx](frontend/src/pages/LoginPage.tsx))
**Composants DaisyUI utilisés:**
- `card` - Container principal
- `form-control`, `label`, `input input-bordered` - Formulaires
- `btn btn-primary` avec état `loading` - Bouton submit
- `alert alert-error` - Messages d'erreur
- `divider` - Séparateur OAuth
- `btn btn-outline` - Boutons OAuth
- `link link-primary` - Lien inscription

**Avant/Après:**
- ❌ LoadingSpinner component custom
- ✅ État `loading` natif DaisyUI sur button
- ❌ Classes Tailwind custom pour inputs
- ✅ `input input-bordered` avec validation states
- ❌ Div custom pour erreurs
- ✅ `alert alert-error` avec icon SVG

## Pages à Migrer 🔄

### 4. RegisterPage
**À faire:**
- Suivre le même pattern que LoginPage
- Utiliser `form-control`, `input`, `checkbox`
- `btn btn-primary` avec loading state
- `alert` pour erreurs

### 5. Navbar/Layout ([components/common/Layout.tsx](frontend/src/components/common/Layout.tsx))
**À faire:**
- `navbar` avec `navbar-start`, `navbar-center`, `navbar-end`
- `dropdown` pour menu utilisateur
- `drawer` pour menu mobile
- Logo Ecobilda avec `/images/logo-white.png`

### 6. ProjectsPage
**À faire:**
- Grille de `card` pour les projets
- `badge` pour project types (PERM/NATB)
- `input` avec search icon pour recherche
- `select` pour filtres

### 7. ProjectDetailPage
**À faire:**
- Hero section avec `carousel` pour images
- `tabs` pour sections (Description, Skills, Availability)
- `stats` pour infos clés
- `btn btn-primary` pour Apply

### 8. ProfilePage
**À faire:**
- `avatar` avec placeholder si pas de photo
- `tabs` pour My Projects / Reviews / Settings
- `form` avec DaisyUI components

### 9. MessagesPage / ChatPage
**À faire:**
- `chat chat-start` / `chat chat-end` pour messages
- `input` avec `btn` pour envoyer
- `avatar` pour utilisateurs

### 10. CreateProjectPage
**À faire:**
- Multi-step form avec `steps`
- `textarea`, `select`, `checkbox`, `toggle` DaisyUI
- `file-input` pour images
- `btn btn-primary` / `btn btn-ghost` pour navigation

## Composants DaisyUI les Plus Utilisés

### Déjà Implémentés:
- ✅ `hero` - 2 pages (FAQ, HomePage)
- ✅ `card` - 2 pages (HomePage, LoginPage)
- ✅ `btn` - 3 pages (FAQ, HomePage, LoginPage)
- ✅ `collapse` - 1 page (FAQ)
- ✅ `alert` - 2 pages (FAQ, LoginPage)
- ✅ `form-control` / `input` - 1 page (LoginPage)
- ✅ `divider` - 1 page (LoginPage)

### À Implémenter:
- 🔄 `navbar` - Layout
- 🔄 `drawer` - Layout mobile
- 🔄 `dropdown` - Navbar user menu
- 🔄 `badge` - Project types, tags
- 🔄 `tabs` - ProjectDetail, Profile
- 🔄 `stats` - ProjectDetail
- 🔄 `avatar` - Messages, Profile
- 🔄 `chat` - ChatPage
- 🔄 `carousel` - ProjectDetail images
- 🔄 `steps` - CreateProject
- 🔄 `file-input` - Upload images
- 🔄 `select` - Filtres, formulaires
- 🔄 `checkbox` / `toggle` - Préférences
- 🔄 `textarea` - Descriptions
- 🔄 `breadcrumbs` - Navigation

## Thème Ecobilda Appliqué

```javascript
{
  "primary": "#22c55e",      // Vert - Actions principales
  "secondary": "#86efac",    // Vert clair - Accents
  "accent": "#fbbf24",       // Jaune - Highlights
  "success": "#22c55e",      // Succès
  "error": "#ef4444",        // Erreurs
}
```

### Utilisation Cohérente:
- **Primary**: Boutons principaux, icons de navigation
- **Secondary**: Boutons secondaires, backgrounds
- **Accent**: Icons de skills, highlights
- **Success**: Icons permaculture, confirmations
- **Error**: Erreurs formulaire, alerts

## Icons React Icons Utilisés

### FontAwesome (fa):
- `FaSeedling`, `FaHammer`, `FaLeaf`, `FaRecycle`
- `FaTractor`, `FaCut`, `FaChevronRight`

### Game Icons (gi):
- `GiPlantSeed`, `GiWoodBeam`, `GiStoneWall`, `GiBrickWall`

**Principe**: Plus d'emojis! Seulement des icons React Icons.

## Pattern de Migration Standard

Pour migrer une nouvelle page:

1. **Remplacer les containers**:
   ```tsx
   // Avant
   <div className="bg-white rounded-lg shadow-md p-8">

   // Après
   <div className="card bg-base-100 shadow-xl">
     <div className="card-body">
   ```

2. **Remplacer les boutons**:
   ```tsx
   // Avant
   <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg">

   // Après
   <button className="btn btn-primary">
   ```

3. **Remplacer les inputs**:
   ```tsx
   // Avant
   <input className="w-full px-3 py-2 border border-gray-300 rounded-md" />

   // Après
   <div className="form-control">
     <label className="label"><span className="label-text">Label</span></label>
     <input className="input input-bordered w-full" />
   </div>
   ```

4. **Remplacer les emojis**:
   ```tsx
   // Avant
   <div className="text-4xl">🌿</div>

   // Après
   import { FaSeedling } from 'react-icons/fa';
   <FaSeedling className="text-4xl text-primary" />
   ```

5. **Utiliser les couleurs du thème**:
   ```tsx
   // Avant
   className="text-green-600"

   // Après
   className="text-primary"
   ```

## Prochaines Étapes

1. Migrer RegisterPage (très similaire à LoginPage)
2. Créer/migrer Navbar avec drawer pour mobile
3. Migrer ProjectsPage avec cards et filtres
4. Migrer les autres pages une par une
5. Vérifier cohérence visuelle globale

## Documentation

Référence complète: [DAISYUI_SETUP.md](DAISYUI_SETUP.md)
