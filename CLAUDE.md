# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment Notes

**IMPORTANT for Claude Code:**
- On Windows, use PowerShell for Docker commands (Git Bash doesn't return output correctly)
- Example: `powershell -Command "docker ps -a"` instead of `docker ps -a`
- This applies to: `docker`, `docker-compose`, `docker logs`, etc.

## Project Overview

**Ecobilda** is a skill exchange platform for eco-construction and permaculture, similar to Workaway/WWOOF but specialized. It connects project owners (hosts) with volunteers who want to learn and participate in concrete projects.

**Tech Stack:**
- **Backend:** Convex self-hosted (TypeScript, real-time reactive database)
- **Frontend:** Next.js 16 + React 19 + TypeScript 5, Mantine v7 UI, next-intl, Tailwind CSS 4, Mapbox GL (`frontend/`)
- **Admin Panel:** React 18 + TypeScript 5, Vite 5, TanStack Query, React Router 6, Radix UI + Tailwind CSS (`admin/`)
- **Auth:** Email/password + Google OAuth only (no Apple, no OTP in UI). Custom session-based auth via Convex.
- **Languages:** Full i18n support for EN, FR, ES, DE, NL, PT

## Development Commands

### Quick Start

**Prerequisites:**
- Docker Desktop must be running (for Convex self-hosted backend)
- Node.js 18+ installed (for frontend)

**Terminal 1 - Convex Backend (Docker):**
```bash
# From project root - launches Convex backend + dashboard
docker-compose up -d
```

**Terminal 2 - Convex Dev (function deployment):**
```bash
cd frontend
npx convex dev  # Watches and deploys Convex functions on change
```

**Terminal 3 - Frontend (Next.js):**
```bash
cd frontend
npm install  # First time only
npm run dev  # Starts Next.js dev server at http://localhost:3000
```

**Terminal 4 - Admin Panel (Optional):**
```bash
cd admin
npm run dev  # Starts admin React app
```

**Access Points:**
- Frontend (user-facing): http://localhost:3000
- Convex Backend: http://localhost:3210
- Convex Dashboard: http://localhost:6791
- Admin Panel (React): http://localhost:5174

**Stop Services:**
```bash
docker-compose down
```

### Convex CLI Commands

```bash
cd frontend

# Deploy functions once (no watch)
npx convex dev --once

# Run a function from CLI
npx convex run seed:seedAll        # Seed initial data
npx convex run skills:list '{}'    # Test a query

# Set environment variables for Convex
npx convex env set KEY value

# Generate admin key (first time setup)
docker compose exec convex-backend ./generate_admin_key.sh
```

### Useful CLI Utilities (already deployed functions)

These are mutations/actions you can run from CLI for direct DB ops without commit:

```bash
# Seed initial data + upload images to Convex Storage
npx convex run seed:seedAll
npx convex run seed:uploadSeedImages

# Set admin password (for admin@ecobilda.org)
npx convex run seed:setAdminPassword '{"password":"YourNewPassword!"}'

# Patch any user by email (equivalent of SQL UPDATE)
npx convex run 'admin/users:patchByEmail' '{"email":"x@y.com","fields":{"firstName":"New"}}'

# Promote a user to admin
npx convex run seed:makeAdmin
```

### Convex vs SQL — Important

Convex has NO direct SQL access. All DB operations must go through TypeScript functions:
- **query** = SELECT (reactive, auto-updates UI)
- **mutation** = INSERT/UPDATE/DELETE (transactional)
- **action** = mutation + can call external APIs (fetch, email)
- **internalMutation/internalQuery** = server-only, callable from actions via `internal.*`

For ad-hoc DB changes, either:
1. Use the **Convex Dashboard** (http://localhost:6791 in dev, http://convex.ecobilda.org in prod) — edit documents one by one
2. Use a deployed CLI utility like `admin/users:patchByEmail`
3. Create a new mutation, deploy with `npx convex dev --once`, then run it

## Architecture

### Convex Backend (`frontend/convex/`)

All backend logic lives in TypeScript functions inside `frontend/convex/`. There is no separate backend server — Convex is both the database and the API.

**Function Types:**
- **query** — Read data (reactive: auto-updates when data changes)
- **mutation** — Write data (transactional, atomic)
- **action** — Call external services (email, APIs)
- **internalMutation** — Server-only (crons, scheduled tasks)

**File Structure:**
```
frontend/convex/
  schema.ts              # Database schema (18 tables, 36 indexes)
  auth.ts                # Auth: register, login, Google OAuth, sessions
  users.ts               # User profiles, settings, stats
  projects.ts            # Project CRUD, filtering, file upload
  participations.ts      # Participation requests workflow
  conversations.ts       # Chat conversations (reactive)
  messages.ts            # Messages with anti-spam 24h email rule
  reviews.ts             # Reviews with 180-day eligibility + Airbnb publication
  notifications.ts       # In-app notifications (reactive)
  favorites.ts           # Favorite toggle
  skills.ts              # 16 fixed skills
  languages.ts           # Languages
  countries.ts           # Countries
  reports.ts             # Content reports
  seed.ts                # Initial data seeding + CLI utilities
  emails.ts              # Transactional emails (Microsoft Graph API)
  contact.ts             # Contact form submissions
  crons.ts               # Scheduled jobs
  cronHandlers.ts        # Cron job logic
  auth.config.ts         # Auth configuration
  admin/
    dashboard.ts         # Admin stats
    projects.ts          # Project validation/rejection
    users.ts             # User management + patchByEmail CLI utility
    reports.ts           # Report management
    contacts.ts          # Contact messages + unread count
```

### Frontend (`frontend/src/`)

```
frontend/src/
  app/[locale]/           # Next.js App Router (locale-aware)
    (auth)/              # Auth routes (login, register, etc.)
    (protected)/         # Authenticated routes (messages, settings, etc.)
    (public)/            # Public routes (projects, about, etc.)
  components/             # React components by feature
  services/               # API service layer (calls Convex client)
  hooks/
    useConvex.ts         # Reactive Convex hooks (useSkills, useLanguages, etc.)
  lib/
    convexClient.ts      # Convex HTTP client + session management
  providers/
    ConvexClientProvider.tsx  # Convex React provider
    AuthProvider.tsx          # Auth context (uses Convex sessions)
  locales/                # Translation files (en, fr, es, de, nl, pt)
  types/                  # TypeScript type definitions
```

**UI Component Library:** Use **Mantine v7** components for consistency.

### Admin Panel (`admin/src/`)

Separate React app for platform administration. Uses Radix UI + Tailwind CSS.

**Reactive Convex queries:** All admin pages use `useAdminQuery` (wraps `useQuery` from `convex/react`) for live data — no polling, instant updates after mutations. The `ConvexProvider` is wrapped only inside `ProtectedRoute` (not on the login page) to avoid WebSocket connections before authentication.

**API imports:** Use the `@convex/_generated/api` alias (configured in `vite.config.ts`), NOT relative paths like `../../convex/_generated/api` — relative paths break the production build.

## Critical Business Logic

### 1. Anti-Spam Email Rule (24-hour limit)
**Location:** `frontend/convex/messages.ts`

Max 1 email notification per conversation per 24 hours. Checks:
1. User has `emailNotifications` enabled
2. Conversation is not muted
3. Last email was sent >24 hours ago

### 2. Messaging Flow (No Free DMs)
Workflow: participation request → host accepts → conversation created → chat available.
**Location:** `frontend/convex/participations.ts` (accept mutation creates conversation)

### 3. Review Eligibility (180-day rule)
**Location:** `frontend/convex/reviews.ts`

Both users must have sent >=1 message in the last 180 days.

### 4. Review Publication (Airbnb-style)
**Location:** `frontend/convex/reviews.ts` + `frontend/convex/cronHandlers.ts`

Reviews published when: both users submitted OR 30-day deadline expires.

### 5. The 16 Skills (Fixed Taxonomy)
8 Permaculture + 8 Natural Building skills. Seeded via `frontend/convex/seed.ts`.

### 6. Project Validation
Admin must approve projects: PENDING -> ACTIVE/REJECTED.
**Location:** `frontend/convex/admin/projects.ts`

### 7. Email Sending (Microsoft Graph)
**Location:** `frontend/convex/emails.ts`

Uses Microsoft Graph API (NOT SMTP). Requires these env vars in Convex (set via `npx convex env set`):
- `MS_GRAPH_TENANT_ID` — Azure AD tenant
- `MS_GRAPH_CLIENT_ID` — App registration
- `MS_GRAPH_CLIENT_SECRET` — App secret
- `MS_GRAPH_MAILBOX` — The actual Azure mailbox user (e.g. `noreply@ecobilda.org`)
- `DEFAULT_FROM_EMAIL` — What recipients see (can be the same as mailbox)
- `FRONTEND_URL` — For email links (e.g. `https://ecobilda.org`)

Important: `MS_GRAPH_MAILBOX` must be a real Azure AD user or shared mailbox, NOT just an alias. The Graph API URL `users/{mailbox}/sendMail` requires an actual mailbox identity. Aliases can only be used in the `from` field of the payload (and require Send As permissions).

## Code Style Rules

**No Emojis:** Use icon components (`@tabler/icons-react` for frontend, `lucide-react` for admin).

**French Accents:** Always use proper accents in French translation files.

**Translations:** Use `useTranslations()` from next-intl. All user-facing text must be translatable (6 languages).

## Environment Variables

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<generated key>
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## Deployment

**Dev:** Docker (Convex self-hosted with SQLite) + `npm run dev`
**Prod:** Convex self-hosted on Hetzner (Docker + PostgreSQL backing) + Next.js + Caddy reverse proxy

### Production Architecture

```
Internet
   ├── ecobilda.org              → Next.js (port 3000)
   ├── ecobilda.org/api/storage/ → Convex (proxied via Caddy for image storage URLs)
   ├── admin.ecobilda.org        → Static files (Vite build in /opt/ecobilda/admin-dist/)
   └── convex.ecobilda.org       → Convex backend (port 3210)
```

The `/api/storage/*` proxy on `ecobilda.org` is configured in `/etc/caddy/Caddyfile` on the server. It routes Convex storage URLs (`/api/storage/UUID`) directly to the Convex backend so images stored in Convex Storage are accessible via the frontend domain.

### Auto-deploy

Push to `main` triggers GitHub Actions (`.github/workflows/deploy.yml`) which SSHes into the server and runs `scripts/deploy.sh`.

The CI workflow:
1. `git gc --prune=now` (clean stale refs)
2. `git fetch --force --prune` (avoid ref lock errors)
3. `git reset --hard origin/main`
4. `bash scripts/deploy.sh` (build Docker images, deploy Convex functions, build admin panel)

### Image Handling in Production

Project images are stored in **Convex Storage** (not local files). Two ways images get there:
1. **User uploads** — handled by `projects.ts` mutations using `ctx.storage.store()`
2. **Seed images** — uploaded via `seed:uploadSeedImages` action which fetches from `frontend/public/projects/` and stores them in Convex

Seed images URLs in `frontend/public/projects/N/image_X.png` are only used during initial seed upload — the actual served URLs are the Convex Storage IDs proxied via Caddy.

**Important:** `Image` from `next/image` does NOT work with Convex storage URLs (`/api/storage/UUID`) because they're not in the `remotePatterns` whitelist. Use native `<img>` tags for project images, or add the patterns to `next.config.ts`.
