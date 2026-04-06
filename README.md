# Ecobilda

**Ecobilda** is a skill exchange platform for eco-construction and permaculture — similar to Workaway/WWOOF but specialized. It connects project owners (hosts) with volunteers who want to learn and participate in hands-on ecological projects.

Live at [ecobilda.org](https://ecobilda.org)

---

## What it is

- **Hosts** post eco-construction or permaculture projects and welcome volunteers
- **Volunteers** browse projects, apply to participate, and exchange skills for accommodation/learning
- **Unified user model** — anyone can be both host and volunteer, like Airbnb

Skills covered: natural building, cob/adobe, timber framing, lime plastering, permaculture design, composting, grafting, market gardening, and more.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | [Convex](https://convex.dev) self-hosted — TypeScript, real-time reactive database |
| Frontend | Next.js 16 · React 19 · TypeScript 5 · Mantine v7 · Tailwind CSS 4 · Mapbox GL |
| Admin Panel | React 18 · Vite 5 · Radix UI (shadcn/ui) · TanStack Query · React Router 6 |
| Auth | Email/password + Google OAuth — custom session-based via Convex |
| File Storage | Convex File Storage |
| Reverse Proxy | Caddy (auto SSL via Let's Encrypt) |
| Database | PostgreSQL 15 (Convex backing store in production) |
| CI/CD | GitHub Actions → SSH deploy |
| Languages | EN · FR · ES · DE · NL · PT |

---

## Project Structure

```
ecobilda/
├── frontend/              # Next.js app (user-facing)
│   ├── convex/            # Backend: Convex functions, schema, auth
│   └── src/
│       ├── app/[locale]/  # App Router — auth, protected, public routes
│       ├── components/    # React components by feature
│       ├── services/      # Convex client calls
│       └── locales/       # i18n translations (6 languages)
├── admin/                 # React admin panel (separate Vite app)
├── scripts/
│   ├── deploy.sh          # Production deploy script
│   └── backup.sh          # PostgreSQL backup script
├── docker-compose.yml     # Dev environment (SQLite-backed Convex)
└── docker-compose.prod.yml # Production (PostgreSQL-backed Convex)
```

---

## Local Development

**Prerequisites:** Docker Desktop, Node.js 18+

```bash
# Terminal 1 — Convex backend (Docker)
docker-compose up -d

# Terminal 2 — Deploy Convex functions (watch mode)
cd frontend && npx convex dev

# Terminal 3 — Next.js frontend
cd frontend && npm install && npm run dev

# Terminal 4 — Admin panel (optional)
cd admin && npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Convex backend | http://localhost:3210 |
| Convex dashboard | http://localhost:6791 |
| Admin panel | http://localhost:5174 |

**Environment variables** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=<generated via generate_admin_key.sh>
NEXT_PUBLIC_MAPBOX_TOKEN=<your token>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your client id>
```

---

## Production Architecture

```
Internet
   │
   ├── ecobilda.org / www.ecobilda.org  ──► Next.js (port 3000)
   ├── admin.ecobilda.org               ──► Static files (Vite build)
   ├── convex.ecobilda.org              ──► Convex backend (port 3210)
   └── ecobilda.com                     ──► 301 redirect → ecobilda.org
         │
      [Caddy — TLS termination + reverse proxy]
         │
      [Docker]
         ├── ecobilda-frontend   (Next.js)
         ├── ecobilda-convex     (Convex self-hosted)
         └── ecobilda-db         (PostgreSQL 15)
```

**Deploy on push to `main`:** GitHub Actions SSHes into the server and runs `scripts/deploy.sh` — git pull, docker build, Convex function deploy, admin panel build.

---

## Key Features

- **Project listings** with map view (Mapbox), photo galleries, skill tags, availability calendar
- **Participation workflow** — request → host accepts → conversation unlocked
- **Real-time messaging** with anti-spam email notifications (24h rule)
- **Review system** — Airbnb-style bilateral reviews, published after both parties submit or 30-day deadline
- **Favorites**, saved searches, in-app notifications
- **Admin panel** — project validation (PENDING → ACTIVE/REJECTED), user management, reports
- **Full i18n** — 6 languages (EN, FR, ES, DE, NL, PT)
- **Google OAuth** + email/password authentication

---

## Convex Backend

All business logic lives in `frontend/convex/` as TypeScript functions:

```
convex/
├── schema.ts          # Database schema (18 tables, 36 indexes)
├── auth.ts            # Registration, login, Google OAuth, sessions
├── projects.ts        # Project CRUD, file upload, filtering
├── participations.ts  # Participation request workflow
├── conversations.ts   # Messaging (real-time)
├── messages.ts        # Messages + anti-spam email rule
├── reviews.ts         # Review eligibility + Airbnb publication logic
├── notifications.ts   # In-app notifications
├── users.ts           # Profiles, settings, stats
├── emails.ts          # Transactional emails (Microsoft Graph)
└── admin/             # Admin-only functions
```

---

## Deployment

**Server:** Hetzner (Ubuntu 24.04) · Caddy · Docker Compose · PostgreSQL

```bash
# Manual deploy
ssh ecobilda
/opt/ecobilda/scripts/deploy.sh

# Automatic deploy
git push origin main  # → triggers GitHub Actions
```

**Required GitHub secrets:** `SERVER_IP`, `SSH_PRIVATE_KEY`

---

## License

Private — all rights reserved.
