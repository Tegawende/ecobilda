# DaisyUI - Configuration et Utilisation

## Installation Complète ✅

DaisyUI est maintenant installé et configuré dans toute l'application Ecobilda!

### Ce qui a été fait:

1. **Installation du package**
   ```bash
   npm install -D daisyui@latest
   ```

2. **Configuration Tailwind** ([tailwind.config.js](frontend/tailwind.config.js))
   - Plugin DaisyUI ajouté
   - Thème personnalisé "ecobilda" créé avec les couleurs vertes de la marque
   - Thèmes light/dark disponibles

3. **Activation du thème** ([index.html](frontend/index.html))
   - Attribut `data-theme="ecobilda"` ajouté au HTML

4. **Page FAQ refaite** ([FAQ.tsx](frontend/src/pages/FAQ.tsx))
   - Utilise les composants DaisyUI (hero, collapse, alert)
   - Plus d'état React nécessaire - DaisyUI gère tout!
   - Icons de React Icons au lieu d'emojis

## Thème Ecobilda

Couleurs personnalisées:
- **Primary**: `#22c55e` (vert écologique)
- **Secondary**: `#86efac` (vert clair)
- **Accent**: `#fbbf24` (jaune/ambre)
- **Success**: `#22c55e`
- **Error**: `#ef4444`

## Composants DaisyUI les Plus Utiles

### 1. Buttons
```tsx
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-accent">Accent</button>
<button className="btn btn-ghost">Ghost</button>
<button className="btn btn-link">Link</button>

// Tailles
<button className="btn btn-sm">Small</button>
<button className="btn btn-md">Medium</button>
<button className="btn btn-lg">Large</button>

// Loading
<button className="btn btn-primary loading">Loading</button>
```

### 2. Cards
```tsx
<div className="card w-96 bg-base-100 shadow-xl">
  <figure><img src="/images/photo.jpg" alt="Photo" /></figure>
  <div className="card-body">
    <h2 className="card-title">Titre du projet</h2>
    <p>Description du projet...</p>
    <div className="card-actions justify-end">
      <button className="btn btn-primary">Voir plus</button>
    </div>
  </div>
</div>
```

### 3. Forms
```tsx
// Input
<input type="text" placeholder="Email" className="input input-bordered w-full" />
<input type="text" placeholder="Avec icon" className="input input-primary" />

// Textarea
<textarea className="textarea textarea-bordered" placeholder="Message"></textarea>

// Select
<select className="select select-bordered w-full">
  <option disabled selected>Choisir une option</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>

// Checkbox
<input type="checkbox" className="checkbox checkbox-primary" />

// Radio
<input type="radio" name="radio-1" className="radio radio-primary" />

// Range
<input type="range" min="0" max="100" className="range range-primary" />

// Toggle
<input type="checkbox" className="toggle toggle-primary" />
```

### 4. Navbar
```tsx
<div className="navbar bg-base-100 shadow-lg">
  <div className="flex-1">
    <a className="btn btn-ghost text-xl">Ecobilda</a>
  </div>
  <div className="flex-none">
    <ul className="menu menu-horizontal px-1">
      <li><a>Projets</a></li>
      <li><a>FAQ</a></li>
      <li><a>Contact</a></li>
    </ul>
  </div>
</div>
```

### 5. Hero
```tsx
<div className="hero min-h-screen" style={{backgroundImage: 'url(/images/hero.jpg)'}}>
  <div className="hero-overlay bg-opacity-60"></div>
  <div className="hero-content text-center text-neutral-content">
    <div className="max-w-md">
      <h1 className="mb-5 text-5xl font-bold">Bienvenue sur Ecobilda</h1>
      <p className="mb-5">Connectez-vous avec des projets écologiques...</p>
      <button className="btn btn-primary">Commencer</button>
    </div>
  </div>
</div>
```

### 6. Modal
```tsx
{/* Bouton pour ouvrir */}
<label htmlFor="my-modal" className="btn">Ouvrir Modal</label>

{/* Modal */}
<input type="checkbox" id="my-modal" className="modal-toggle" />
<div className="modal">
  <div className="modal-box">
    <h3 className="font-bold text-lg">Titre du Modal</h3>
    <p className="py-4">Contenu du modal...</p>
    <div className="modal-action">
      <label htmlFor="my-modal" className="btn">Fermer</label>
    </div>
  </div>
</div>
```

### 7. Collapse/Accordion (comme dans FAQ)
```tsx
<div className="collapse collapse-arrow bg-base-100">
  <input type="radio" name="my-accordion" />
  <div className="collapse-title text-xl font-medium">
    Question ici
  </div>
  <div className="collapse-content">
    <p>Réponse ici</p>
  </div>
</div>
```

### 8. Alert
```tsx
<div className="alert alert-info">
  <svg>...</svg>
  <span>Information importante</span>
</div>

<div className="alert alert-success">
  <span>Succès!</span>
</div>

<div className="alert alert-warning">
  <span>Attention!</span>
</div>

<div className="alert alert-error">
  <span>Erreur!</span>
</div>
```

### 9. Badge
```tsx
<div className="badge badge-primary">Primary</div>
<div className="badge badge-secondary">Secondary</div>
<div className="badge badge-accent">Accent</div>
<div className="badge badge-ghost">Ghost</div>

// Avec outline
<div className="badge badge-outline">Default</div>
```

### 10. Avatar
```tsx
<div className="avatar">
  <div className="w-24 rounded-full">
    <img src="/images/avatar.jpg" />
  </div>
</div>

// Avatar avec placeholder
<div className="avatar placeholder">
  <div className="bg-neutral text-neutral-content rounded-full w-24">
    <span className="text-3xl">AB</span>
  </div>
</div>
```

### 11. Dropdown
```tsx
<div className="dropdown">
  <label tabIndex={0} className="btn m-1">Menu</label>
  <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
  </ul>
</div>
```

### 12. Stats
```tsx
<div className="stats shadow">
  <div className="stat">
    <div className="stat-title">Total Projets</div>
    <div className="stat-value">145</div>
    <div className="stat-desc">+12% ce mois</div>
  </div>

  <div className="stat">
    <div className="stat-title">Volontaires Actifs</div>
    <div className="stat-value">892</div>
    <div className="stat-desc">En ligne maintenant</div>
  </div>
</div>
```

### 13. Progress
```tsx
<progress className="progress w-56"></progress>
<progress className="progress progress-primary w-56" value="70" max="100"></progress>
<progress className="progress progress-secondary w-56" value="40" max="100"></progress>
```

### 14. Breadcrumbs
```tsx
<div className="text-sm breadcrumbs">
  <ul>
    <li><a>Accueil</a></li>
    <li><a>Projets</a></li>
    <li>Détails</li>
  </ul>
</div>
```

### 15. Tabs
```tsx
<div className="tabs">
  <a className="tab tab-lifted">Tab 1</a>
  <a className="tab tab-lifted tab-active">Tab 2</a>
  <a className="tab tab-lifted">Tab 3</a>
</div>
```

## Classes Utilitaires DaisyUI

### Spacing/Layout
- `container` - Container centré responsive
- `divider` - Ligne de séparation
- `join` - Grouper des éléments
- `stack` - Empiler des éléments

### Glass Effect
```tsx
<div className="glass">Contenu avec effet de verre</div>
```

### Skeleton Loading
```tsx
<div className="skeleton h-32 w-full"></div>
<div className="skeleton h-4 w-28"></div>
<div className="skeleton h-4 w-full"></div>
```

## Documentation Complète

Consulter la documentation officielle: https://daisyui.com/components/

## Prochaines Étapes

Pour appliquer DaisyUI partout dans l'app:

1. **HomePage** - Hero section, cards pour features
2. **LoginPage/RegisterPage** - Forms avec input/button DaisyUI
3. **ProjectsPage** - Cards pour liste de projets, filters
4. **ProjectDetailPage** - Hero, tabs, stats
5. **Navbar** - Navbar component DaisyUI
6. **Footer** - Footer component DaisyUI

Tous les composants existants peuvent être progressivement remplacés par leurs équivalents DaisyUI!
