# LogView Frontend

React + TypeScript + Vite SPA for the LogView log-inspection tool.

## Quick start

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

The app is served at `http://localhost:5173` by default.

## Environment variables

| Variable       | Default                  | Description                  |
|----------------|--------------------------|------------------------------|
| `VITE_API_URL` | `http://localhost:3000`  | Base URL of the LogView API  |

Copy `.env.example` to `.env.local` and adjust for your environment.

## Stack

- **React 19** — UI
- **React Router v7** — client-side routing
- **Axios** — HTTP client with auth interceptors
- **@fontsource/mulish** — self-hosted Mulish font (no CDN)
- **Vite 8** — dev server + build
- **TypeScript 6** — strict typing

## Project structure

```
src/
  styles/
    tokens.css        Design tokens (colors, typography, spacing, motion)
    global.css        Body reset + font import
  api/
    client.ts         Axios instance with JWT interceptors
    types.ts          TypeScript types from OpenAPI spec
    auth.ts           login(), me()
    projects.ts       listProjects(), getProject()
    logs.ts           getLogs()
  context/
    AuthContext.tsx   JWT storage, user state, login/logout
  components/
    ProtectedRoute.tsx   Redirect to /login when unauthenticated
    LoadingSkeleton.tsx  Animated shimmer skeleton cards
    ErrorState.tsx       Error message + retry button
    EmptyState.tsx       Empty list placeholder
  pages/
    LoginPage.tsx      /login — email/password auth form
    ProjectsPage.tsx   /projects — searchable project grid
    LogViewPage.tsx    /projects/:id/logs — filtered log viewer
  App.tsx             Router + providers
  main.tsx            Entry point
```

## Routes

| Path                   | Access    | Description             |
|------------------------|-----------|-------------------------|
| `/login`               | Public    | Sign-in form            |
| `/projects`            | Protected | Project grid            |
| `/projects/:id/logs`   | Protected | Log viewer for project  |
| `/`                    | —         | Redirects to /projects  |
| `*`                    | —         | Redirects to /projects  |

## Security note

The JWT access token is stored in `localStorage` (XSS-exposed). Future hardening: use `httpOnly` cookies with a `/auth/refresh` endpoint.

## Build

```bash
pnpm build
```

Output is in `dist/`. All assets are hashed for cache-busting.
