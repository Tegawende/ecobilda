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
  seed.ts                # Initial data seeding
  crons.ts               # Scheduled jobs
  cronHandlers.ts        # Cron job logic
  auth.config.ts         # Auth configuration
  admin/
    dashboard.ts         # Admin stats
    projects.ts          # Project validation/rejection
    users.ts             # User management
    reports.ts           # Report management
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
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api  # Legacy, being removed
```

## Deployment

**Dev:** Docker (Convex self-hosted with SQLite) + `npm run dev`
**Prod:** Convex self-hosted on Hetzner (Docker + PostgreSQL backing) + Next.js (Node + Nginx)
