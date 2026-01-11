# Lancer le Frontend

## Commande simple

```bash
cd frontend
npm run dev
```

Puis ouvre: **http://localhost:5173**

---

## ✅ Correction appliquée

Le problème `InternalAxiosRequestConfig` est corrigé!

**Avant**:
```typescript
import axios, { InternalAxiosRequestConfig } from 'axios';  // ❌ Export problématique

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => { ... }  // ❌ Type qui pose problème
);
```

**Après**:
```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';  // ✅ Imports standards

api.interceptors.request.use(
  (config) => { ... }  // ✅ TypeScript infère automatiquement le type
);
```

---

## En cas de problème

### Erreur de cache Vite

```bash
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Réinstallation complète

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Vérification

Une fois lancé, tu devrais voir dans le terminal:

```
VITE v7.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Et dans le navigateur: **Aucune erreur dans la console!** ✅

---

## Tester l'API

Le frontend va se connecter automatiquement au backend Django sur `http://localhost:8000/api/`

Tu peux vérifier dans la console du navigateur (F12) que les requêtes passent bien.

---

**Tout est prêt! Lance `npm run dev` et c'est parti! 🚀**
