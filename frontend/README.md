# Ecobilda Frontend - React + TypeScript + Vite

Frontend application for **Ecobilda**, a skill exchange platform for eco-construction and permaculture.

Modern React implementation with TypeScript, built with Vite.

---

## 🎯 Overview

**Tech Stack**:
- **Vite 7** (build tool)
- **React 18** + **TypeScript 5**
- **TanStack Query (React Query)** (state management)
- **React Router 6** (routing)
- **React Hook Form + Zod** (forms & validation)
- **Tailwind CSS** + **Headless UI** (styling)
- **i18next** (internationalization - EN, FR, ES, DE)
- **Axios** (HTTP client)
- **Mapbox GL JS** (maps)

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── auth/           # Login, Register, OAuth buttons
│   │   ├── projects/       # Project cards, filters, map
│   │   ├── messaging/      # Chat components
│   │   ├── reviews/        # Review forms and displays
│   │   └── common/         # Shared components (Navbar, Footer)
│   │
│   ├── pages/              # Page components (route handlers)
│   │   ├── HomePage.tsx
│   │   ├── ProjectsPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── InboxPage.tsx
│   │   └── ChatPage.tsx
│   │
│   ├── services/           # API service layer
│   │   ├── api.ts         # Axios instance with interceptors
│   │   ├── auth.ts        # Authentication API calls
│   │   ├── projects.ts    # Projects API calls
│   │   ├── messaging.ts   # Messaging API calls
│   │   └── reviews.ts     # Reviews API calls
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts     # Authentication state
│   │   ├── useProjects.ts # Projects queries (React Query)
│   │   ├── useChat.ts     # WebSocket chat
│   │   └── useNotifications.ts
│   │
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts       # All types (User, Project, etc.)
│   │
│   ├── locales/            # Translation files
│   │   ├── en/translation.json
│   │   ├── fr/translation.json
│   │   ├── es/translation.json
│   │   └── de/translation.json
│   │
│   ├── utils/              # Utility functions
│   │
│   ├── i18n.ts            # i18next configuration
│   ├── main.tsx           # App entry point
│   └── App.tsx            # Root component with routing
│
├── .env.example           # Environment variables template
├── tailwind.config.js     # Tailwind CSS configuration
└── package.json
```

---

## 🚀 Installation & Setup

### 1. Prerequisites
- Node.js 20.19+ or 22.12+
- npm 11+

### 2. Installation

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# VITE_API_BASE_URL=http://localhost:8000/api
# VITE_MAPBOX_ACCESS_TOKEN=your_token
```

### 3. Development

```bash
# Start dev server
npm run dev

# App available at http://localhost:5173
```

---

## 🌍 Multilingual Support (i18n)

### Supported Languages
- **English** (en) - Default
- **Français** (fr)
- **Español** (es)
- **Deutsch** (de)

### Usage in Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button onClick={() => i18n.changeLanguage('fr')}>
        Français
      </button>
    </div>
  );
}
```

---

## 🔐 Authentication

### Email/Password

```tsx
import { authService } from './services/auth';

// Login
const { tokens, user } = await authService.login({
  email: 'user@example.com',
  password: 'password123'
});

// Register
const { tokens, user } = await authService.register({
  email: 'user@example.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  date_of_birth: '1990-01-01'
});
```

### Google & Apple OAuth
OAuth integration ready (to be implemented with respective SDKs).

---

## 📊 State Management with React Query

```tsx
import { useQuery } from '@tanstack/react-query';
import { projectsService } from '../services/projects';

function ProjectsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsService.getProjects()
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.results.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

---

## 🎨 Styling with Tailwind CSS

Custom brand colors configured in [tailwind.config.js](tailwind.config.js):

```tsx
function Button({ children }) {
  return (
    <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded">
      {children}
    </button>
  );
}
```

---

## 🗺️ Mapbox Integration

1. Get API key from [Mapbox](https://www.mapbox.com/)
2. Add to `.env`: `VITE_MAPBOX_ACCESS_TOKEN=your_token`
3. Use in components for project map visualization

---

## 📝 Forms with React Hook Form + Zod

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters')
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    await authService.login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">Login</button>
    </form>
  );
}
```

---

## 📦 Build & Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

**Recommended platforms**: Vercel, Netlify, Cloudflare Pages

---

## 🚧 Implementation Roadmap

### Phase 1: Authentication
- [ ] Login/Register pages
- [ ] Google OAuth integration
- [ ] Apple OAuth integration
- [ ] Protected routes

### Phase 2: Projects
- [ ] Projects list with filters
- [ ] Project detail page
- [ ] Create project form
- [ ] Mapbox map integration
- [ ] Image upload (S3 presigned URLs)

### Phase 3: Messaging
- [ ] Inbox page
- [ ] Real-time chat with WebSocket
- [ ] Typing indicators
- [ ] Unread badges

### Phase 4: Reviews
- [ ] Review forms
- [ ] Display reviews on profiles
- [ ] Eligibility checking

### Phase 5: Polish
- [ ] Responsive design
- [ ] Loading states
- [ ] Error handling
- [ ] SEO & Accessibility

---

## 📚 Documentation

- [React 18](https://react.dev/)
- [Vite](https://vite.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [i18next](https://www.i18next.com/)

---

## 🤝 Backend Integration

Backend API: See [../backend/README.md](../backend/README.md)

**API Base URL**: `http://localhost:8000/api` (development)

---

## 📧 Support

For detailed migration plan: See plan file at `C:\Users\aurel\.claude\plans\wobbly-crunching-naur.md`
