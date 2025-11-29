# PBC RED Platform – pbc-red-forge

Web platform for discovering, browsing and managing AI models.

This repository contains:

- Frontend SPA in the project root (Vite + React + TypeScript + shadcn/ui).
- Backend API in `server/` (Node.js + Express + MariaDB/MySQL).

---

## Features

- **Model catalog** – browse models with search and filtering.
- **Model details** – view rich metadata, stats and tabs per model.
- **(Planned)** Model generation UI at `/generate`.
- **Authentication** – registration, login, logout, "remember me".
- **User profiles** – editable display name and bio, profile pages.
- **Users directory** – `/users` page with list of users, groups and links to profiles.
- **User groups & rights** – MediaWiki-style groups (administrator, creator, user) and rights.
- **i18n** – 5 languages: English, French, German, Russian, Spanish.

---

## Tech stack

### Frontend

- **Framework**: React 18, Vite 5, TypeScript.
- **UI**: shadcn/ui, Radix UI primitives, Tailwind CSS, custom gradients/animations.
- **Routing**: `react-router-dom` with lazy-loaded pages.
- **State / data**: `@tanstack/react-query`, React context for auth.
- **HTTP**: shared `axios` instance with auth token interceptor.
- **i18n**: `i18next` + `react-i18next`, locale files in `src/i18n/locales/`.
- **UX**: Sonner toasts, Radix tooltips, `framer-motion` animations.

### Backend

- **Runtime**: Node.js (TypeScript).
- **Framework**: Express 4.
- **Database**: MariaDB/MySQL via `mysql2/promise`.
- **Auth**: `bcrypt` + `jsonwebtoken` with session table.
- **Validation**: `zod` for request schemas.

---

## Repository structure

- `/` – frontend SPA (this project root).
- `/src` – React application (components, pages, routing, hooks, utilities).
- `/public` – static assets.
- `/dist` – frontend production build (created by `npm run build`).
- `/server` – backend API (Express + MySQL/MariaDB).
- `/server/src` – backend source code.
- `/server/.env.example` – example backend environment configuration.

Key frontend entry points:

- `src/main.tsx` – mounts `<App />` and imports global styles.
- `src/App.tsx` – routing, providers (`QueryClientProvider`, `AuthProvider`, etc.).

Key routes:

- `/` – Home.
- `/browse` – models catalog.
- `/model/:id` – model detail page.
- `/generate` – planned generation UI.
- `/profile` and `/profile/:id` – user profile pages.
- `/users` – users directory.

---

## Prerequisites

- Node.js LTS + npm.
- MariaDB or MySQL instance.

---

## Setup & installation

Clone the repository and install dependencies for frontend and backend:

```sh
git clone <YOUR_GIT_URL>
cd pbc-red-forge

# Frontend dependencies
npm install

# Backend dependencies
cd server
npm install
```

---

## Backend configuration

1. Go to `server/` and create `.env` from example:

   ```sh
   cd server
   cp .env.example .env
   ```

2. Edit `.env` and set:

   - `DB_NAME`, `DB_USER`, `DB_PASSWORD` – database credentials.
   - Either `DB_SOCKET_PATH` **or** `DB_HOST` / `DB_PORT`.
   - `JWT_SECRET` – generate a strong secret for production.
   - `JWT_EXPIRES_IN`, `JWT_REMEMBER_EXPIRES_IN` – token lifetimes.
   - `PORT` – API port (default `3001`).
   - `FRONTEND_URL` – frontend origin for CORS (e.g. `http://localhost:5173`).

3. Initialize database schema:

   ```sh
   cd server
   npm run db:init
   ```

---

## Running locally

### 1. Start backend (API)

From `server/` directory:

```sh
cd server
npm run dev
```

By default API will be available on `http://localhost:3001`.

### 2. Start frontend (SPA)

From project root `pbc-red-forge`:

```sh
npm run dev
```

Vite dev server runs on `http://localhost:5173`.

The frontend uses a shared `axios` instance with:

- `baseURL = VITE_API_URL + '/api'` if `VITE_API_URL` is set.
- Fallback to `http://localhost:3001/api` in development.

Make sure `VITE_API_URL` in your frontend `.env` (if used) points to the API origin.

---

## Build & production

### Frontend

- Production build:

  ```sh
  npm run build
  ```

  Output is written to `dist/` in project root.

- Local preview of production build:

  ```sh
  npm run preview
  ```

Typical deployment:

- Build on the server (or CI) with `npm run build`.
- Serve static files from `dist/` via nginx or another HTTP server.
- Configure `VITE_API_URL` to the public backend origin (e.g. `https://pbc.red`).

### Backend

From `server/` directory:

```sh
cd server
npm run build
npm start
```

This runs `dist/index.js` using Node.js.

Deployment notes (current assumptions):

- API is typically run as a long-lived process (e.g. `systemd` service).
- Preferred setup: listen on Unix socket from `API_SOCKET_PATH` (e.g. `/run/pbc-red-api/api.sock`) and proxy via nginx:

  ```nginx
  location /api/ {
      proxy_pass http://unix:/run/pbc-red-api/api.sock:;
  }
  ```

---

## API overview (high level)

Auth (`/api/auth`):

- `POST /api/auth/register` – register new user.
- `POST /api/auth/login` – login with username/email and password.
- `POST /api/auth/logout` – logout from current session.
- `POST /api/auth/logout-all` – logout from all sessions.
- `GET /api/auth/me` – get current authenticated user.

Users (`/api/users`):

- `GET /api/users/:id` – public profile, with `isOwner` flag and email for self.
- `PATCH /api/users/me` – update own profile (display name, bio, avatar URL).
- `POST /api/users/me/change-password` – change own password.
- `GET /api/users` – paginated list of users with groups, sorting.
- `GET /api/users/groups/list` – list of available groups.
- `PATCH /api/users/:id/groups` – change user groups (admin only).

---

## Internationalization

The frontend uses `i18next` and `react-i18next` with language files in `src/i18n/locales/`.

Supported languages:

- English (`en`)
- French (`fr`)
- German (`de`)
- Russian (`ru`)
- Spanish (`es`)

Language can be switched via the `LanguageSelector` component in the navigation bar.

---

## Development notes

- Linting: `npm run lint` (frontend root).
- Build (development mode): `npm run build:dev`.
- All new UI strings should use i18n keys instead of hardcoded text.

