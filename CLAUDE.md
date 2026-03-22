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
- **Backend:** Django 5.0 + Django REST Framework 3.14, PostgreSQL 15, Redis 7, Django Channels 4 (WebSocket), Celery 5
- **Frontend (active):** Next.js 16 + React 19 + TypeScript 5, Mantine v7 UI, TanStack Query, next-intl, Tailwind CSS 4, Mapbox GL (`frontend/`)
- **Frontend (legacy - DO NOT MODIFY):** React 19 + Vite 7 (`frontend-old/` - kept as reference only)
- **Admin Panel:** React 18 + TypeScript 5, Vite 5, TanStack Query, React Router 6, Radix UI + Tailwind CSS (`admin/`)
- **Auth:** Email/password + Google OAuth only (no Apple, no OTP in UI)
- **Languages:** Full i18n support for EN, FR, ES, DE, NL, PT

## Development Commands

### Quick Start (Recommended)

**Prerequisites:**
- Docker Desktop must be running (for backend services)
- Node.js 18+ installed (for frontend)

**Terminal 1 - Backend (Docker):**
```bash
# From project root - launches PostgreSQL, Redis, Django, and Celery
docker-compose up -d
```

**Terminal 2 - Frontend (Next.js):**
```bash
cd frontend
npm install  # First time only
npm run dev  # Starts Next.js dev server at http://localhost:3000
```

**Terminal 3 - Admin Panel (Optional):**
```bash
cd admin
npm run dev  # Starts admin React app
```

**Access Points:**
- Frontend (user-facing): http://localhost:3000
- Admin Panel (React): http://localhost:5174
- Backend API: http://localhost:8000/api
- Django Admin (built-in): http://localhost:8000/admin

**Stop Services:**
```bash
docker-compose down
```

---

### Backend (Django) - Detailed Setup

**Option 1: Docker (Recommended)**
```bash
# From project root - start Docker Desktop first!
docker-compose up -d  # Run in background
docker-compose up     # Run with logs visible

# Useful Docker commands
docker-compose logs -f web          # View Django logs
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py shell_plus
docker-compose exec web pytest
docker-compose down                 # Stop all services
```

**Option 2: Local Development (Advanced)**
Requires PostgreSQL 15 and Redis 7 installed locally.

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements/development.txt

# Create PostgreSQL database
createdb ecobilda

# Run migrations
python manage.py migrate

# Load initial 16 skills (REQUIRED)
python manage.py loaddata apps/skills/fixtures/initial_skills.json

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver  # http://localhost:8000
```

**Testing & Code Quality:**
```bash
# With Docker
docker-compose exec web pytest

# Locally (with venv activated)
pytest
black .
isort .
flake8
```

### Frontend (Next.js - `frontend/`)

**Setup:**
```bash
cd frontend
npm install
# Configure .env.local with NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_MAPBOX_TOKEN
```

**Development:**
```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

> **Note:** The `frontend-old/` directory is the legacy Vite+React frontend. Do NOT modify it. All frontend work goes in `frontend/`.

### Admin Panel (React + Vite)

A separate React application for platform administration (project validation, user management, reports, etc.)

**Setup:**
```bash
cd admin
npm install
# Create .env if needed for API configuration
```

**Development:**
```bash
npm run dev      # Start admin dev server at http://localhost:5174
npm run build    # Production build
npm run lint     # ESLint
npm run preview  # Preview production build
```

**Tech Stack:**
- React 18 + TypeScript
- Vite 5
- TanStack Query + TanStack Table
- React Router 6
- Radix UI components (dialogs, dropdowns, tabs, etc.)
- Tailwind CSS + shadcn/ui patterns

## Architecture & Key Concepts

### Backend Architecture

**Django Apps Structure:**
```
backend/apps/
├── core/              # Reference models (Country, Language, Address)
├── users/             # Unified User model (no Host/Helper separation)
├── authentication/    # JWT + Google OAuth
├── skills/            # 16 fixed skills with translations
├── projects/          # Projects with availability system
├── participations/    # Participation requests (host must accept before chat)
├── messaging/         # Real-time chat (after participation accepted)
├── reviews/           # Bidirectional review system
├── notifications/     # Unified notification system
├── favorites/         # User project favorites
├── emails/            # Transactional email service + templates
├── reports/           # Project/review flagging
└── searches/          # Saved searches
```

**Settings Organization:**
- `config/settings/base.py` - Shared settings
- `config/settings/development.py` - Dev-specific settings
- `config/settings/production.py` - Production settings

### Frontend Architecture (`frontend/`)

**Directory Structure:**
```
frontend/src/
├── app/[locale]/      # Next.js App Router (locale-aware routing)
│   ├── (auth)/       # Auth routes (login, register, forgot-password, etc.)
│   ├── (protected)/  # Authenticated routes (messages, my-projects, settings, etc.)
│   └── (public)/     # Public routes (projects, about, contact, FAQ, etc.)
├── components/        # Reusable React components organized by feature
│   ├── auth/         # Authentication forms, Google OAuth button
│   ├── common/       # Shared components (Layout, Navbar, Footer, UserAvatar)
│   ├── messaging/    # Chat UI components (WebSocket-based)
│   ├── projects/     # Project cards, filters, forms, maps
│   ├── participations/ # Participation request UI
│   ├── reports/      # Reporting modal
│   └── reviews/      # Review forms and displays
├── services/         # API service layer (axios-based, 13 service files)
├── providers/        # React providers (AuthProvider, QueryProvider)
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── locales/          # Translation files (en, fr, es, de, nl, pt)
├── i18n/             # next-intl configuration
└── theme.ts          # Mantine v7 theme customization
```

**UI Component Library:** Use **Mantine v7** components (Button, TextInput, Select, Modal, RangeSlider, etc.) for consistency. Refer to [frontend/DESIGN_SYSTEM.md](frontend/DESIGN_SYSTEM.md) for design patterns and component styling rules.

**Admin Panel Structure:**
```
admin/src/
├── components/       # Reusable admin components (tables, forms, modals)
│   └── ui/          # Radix UI base components (button, dialog, select, etc.)
├── pages/           # Admin route components (Projects, Users, Reports, etc.)
├── services/        # API service layer (axios-based)
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and helpers
└── App.tsx          # Main admin app component
```

**Admin UI Components:** Uses **Radix UI** primitives with Tailwind CSS (shadcn/ui pattern). All base UI components are in `components/ui/`.

### Critical Business Logic (MUST PRESERVE)

#### 1. Anti-Spam Email Rule (24-hour limit)
**Location:** `backend/apps/messaging/models.py:84-119`

Maximum 1 email notification per conversation every 24 hours. Logic checks:
1. User has email notifications enabled
2. Conversation is not muted
3. Last email was sent >24 hours ago

**Never bypass this logic** - it prevents spam and was a core feature of the original system.

#### 2. Messaging Flow (No Free DMs)
Users **cannot** send messages freely. The workflow is:
1. Volunteer submits a participation request (with motivation message)
2. Host reviews and accepts/refuses
3. **Only after acceptance** is a conversation created and chat becomes available
4. This prevents spam and ensures commitment

This is fundamental to the platform's trust model.

#### 3. Review Eligibility (6-month rule)
**Location:** `backend/apps/reviews/utils.py:14-39`

Both users must have sent >=1 message in the last 180 days for a review to be eligible. This prevents fake reviews from inactive conversations.

#### 4. Unified User Model
Unlike the old ASP.NET system, there's **no separation** between Host and Helper:
- One user can create multiple projects (be a host)
- The same user can participate in others' projects (be a volunteer)
- This provides Airbnb-like flexibility

#### 5. The 16 Skills (Fixed Taxonomy)
**Location:** `backend/apps/skills/fixtures/initial_skills.json`

The platform has exactly 16 skills split between:
- **Permaculture** (8): Garden maintenance, Grafting, Pruning, Harvesting, Composting, Weeding, Propagating, Seeds harvesting
- **Natural Building** (8): Carpentry, Masonry, Strawbale building, Cob building, Earthen plaster, Lime plaster, Hempcrete, Tadelakt plaster

These are **not configurable** by users - they are reference data with translations in 4 languages.

#### 6. Project Availability System
Projects use a flexible availability system:
- **Fixed dates:** Host sets start/end dates, volunteer applies for those exact dates
- **Flexible (monthly):** Host selects available months, volunteer proposes date range in their request
- Storage uses boolean fields for 12 months per year in `Availability` model

#### 7. Review Publication (Airbnb-style)
Reviews are published **only when**:
- Both users have submitted their review, OR
- The 30-day deadline expires

This prevents bias ("I'll rate you well if you rate me well").

## Common Patterns & Conventions

### Code Style Rules

**No Emojis:** Do not use emoji characters anywhere in the codebase (frontend, admin, or backend). Use icon components instead:
- **Frontend:** Use `@tabler/icons-react` (e.g., `<IconStar />`, `<IconMapPin />`)
- **Admin:** Use `lucide-react` icons (e.g., `<Star />`, `<MapPin />`)
- **Backend:** Use plain text for `__str__` methods (e.g., `"4.5/5"` not `"4.5/5 star emoji"`)

**French Accents (CRITICAL):** When writing French text in translation files (`locales/fr/translation.json`), ALWAYS use proper French accents and diacritics:
- Use: e with accents, a with accents, o with circumflex, i with circumflex/diaeresis, u with accents, c with cedilla, oe ligature
- Examples: "Creer" with accent on first e, "Generale" with accents, "Acces" with accent on e, "Experience" with accent on first e
- This is MANDATORY for all French content. Never write French without proper accents.

### UI Component Libraries

**Frontend (user-facing):** Uses **Mantine v7** components. Always check [frontend/DESIGN_SYSTEM.md](frontend/DESIGN_SYSTEM.md) for styling patterns and component usage.

**Admin Panel:** Uses **shadcn/ui pattern** with Radix UI primitives + Tailwind CSS. Base components are in `admin/src/components/ui/`. When adding new UI elements:
- Check if a component already exists in `components/ui/`
- If not, create it following the shadcn pattern (see existing components like `button.tsx`, `dialog.tsx`)
- Use `@radix-ui/react-*` packages for primitives
- Style with Tailwind CSS and `class-variance-authority` for variants

### Django Backend

**Model Naming:**
- Use singular names for models (`User`, `Project`, not `Users`, `Projects`)
- Use `created_at`/`updated_at` for timestamps (auto_now_add/auto_now)
- Foreign keys use related_name for reverse relations

**API Structure:**
- ViewSets with DRF for CRUD operations
- django-filter for advanced filtering
- JWT authentication with refresh tokens
- OAuth via django-allauth

**Critical Fields:**
- `User.email_notifications` - Controls whether user receives emails
- `Project.status` - DRAFT/PENDING/ACTIVE/REJECTED (admin validation required)
- `ParticipationRequest.status` - PENDING/ACCEPTED/REFUSED/CANCELLED/EXPIRED
- `Conversation.participation_request` - Links chat to the accepted request

### React Frontend

**State Management:**
- Use TanStack Query for server state (API data)
- Use React Context for global UI state (notifications, auth)
- Minimize local useState when possible

**API Services:**
- All API calls go through `services/` layer
- Use axios instance with interceptors for auth tokens
- Handle errors consistently at service layer

**Translations:**
- Use `useTranslations()` hook from next-intl (NOT react-i18next, that's the legacy frontend)
- Translation keys follow pattern: `section.key` (e.g., `auth.login`, `projects.create`)
- All user-facing text must be translatable (6 languages: EN, FR, ES, DE, NL, PT)

**Component Patterns:**
- Use Mantine components as base
- Follow design system in `DESIGN_SYSTEM.md` for custom styling
- Cards use `rounded-2xl`, buttons use `rounded-full`
- Hover effects: `hover:-translate-y-0.5` with `transition-all duration-300`

## Environment Variables

**Backend (.env):**
```bash
SECRET_KEY=your-secret-key
DEBUG=True

# Database
DB_NAME=ecobilda
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# OAuth (optional for development)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

## Testing Approach

**Backend:**
- Use pytest for all tests
- Test critical business logic (anti-spam, review eligibility, availability filtering)
- Mock external services (email) in tests

**Frontend:**
- Focus on integration tests for user flows
- Test form validation and API interactions
- Use test user `test@test.be` which always exists in development

## Important Notes

1. **Auto-publication disabled** in MVP. Projects require admin validation before becoming visible. This is different from the original system but reduces friction for MVP.

2. **Design consistency** is critical - always check `frontend/DESIGN_SYSTEM.md` before adding new UI elements. Use Mantine components first, then Tailwind for custom styling.

3. **i18n is mandatory** - all new features must support 6 languages (EN, FR, ES, DE, NL, PT). Add translation keys to all locale files.

4. **CORS configuration** - Backend allows frontend origin in development. Update for production domains.

5. **Participation requests link to conversations** - The `participation_request` field on `Conversation` is how we track which project the chat is about. This is used for reviews and context.

## Reference Documentation

- **Project Status & TODO:** [PROJECT_STATUS.md](PROJECT_STATUS.md) - Current state, features, and prioritized TODO list
- **Architecture Diagrams:** [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture with Mermaid diagrams
- **Functional Specification:** [FUNCTIONAL_SPECIFICATION.md](FUNCTIONAL_SPECIFICATION.md) - Complete feature requirements
- **API Endpoints:** [API_ENDPOINTS.md](API_ENDPOINTS.md) - API documentation
- **Backend README:** [backend/README.md](backend/README.md) - Backend-specific details
- **Design System:** [frontend/DESIGN_SYSTEM.md](frontend/DESIGN_SYSTEM.md) - UI patterns and components

## Known Issues & TODOs

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the complete TODO list with priorities.

Key items:
- **Celery Beat** not in docker-compose (scheduled tasks don't run)
- **Real-time notifications** WebSocket listener missing in frontend
- **File uploads** configured for local storage, Nginx needed to serve `/media/` in production
