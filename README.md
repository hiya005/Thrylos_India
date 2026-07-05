# THRYLOS INDIA

Marketing website + client/admin dashboard for THRYLOS INDIA — web development,
mobile apps, cloud, AI integration, cybersecurity and digital strategy services.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- [React Router](https://reactrouter.com/) for routing
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
- [TanStack Query](https://tanstack.com/query) for data fetching/caching
- [Supabase](https://supabase.com/) for auth, database and storage
- [Recharts](https://recharts.org/) for analytics charts
- [jsPDF](https://github.com/parallax/jsPDF) + `html2canvas` for invoice/PDF generation

## Getting started

```sh
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your Supabase project values
cp .env.example .env

# 3. Start the dev server (http://localhost:8080)
npm run dev
```

## Available scripts

| Script            | Description                          |
| ------------------ | ------------------------------------- |
| `npm run dev`       | Start the Vite dev server             |
| `npm run build`     | Type-check and build for production   |
| `npm run build:dev` | Build in development mode             |
| `npm run preview`   | Preview the production build locally  |
| `npm run lint`      | Run ESLint                            |

## Project structure

```
public/                 Static assets served as-is (favicon, og:image)
src/
  assets/                Images, fonts
  components/
    ui/                  shadcn/ui primitives (button, dialog, table, ...)
    layout/              Navbar, Footer, MainLayout
    home/                Homepage sections (FAQ, WhyChooseUs, ...)
    admin/                Admin panel widgets (managers, analytics, ...)
    dashboard/           Client dashboard widgets
  contexts/               React context providers (Language)
  hooks/                  Custom hooks (auth, admin auth, mobile, toast)
  integrations/
    supabase/             Supabase client + generated DB types
    lovable/               Lovable cloud auth integration
  lib/                    Shared utilities (cn helper, admin API, CSV export)
  pages/                  Route-level pages (Home, About, Services, ...)
    admin/                 Admin login/dashboard
    pm/                    Project manager login/dashboard
  utils/                  One-off helpers (invoice generation)
  App.tsx                 Route definitions + global providers
  main.tsx                App entry point
  index.css               Tailwind layers, CSS variables, fonts
```

## Environment variables

This project talks to Supabase directly from the client using the public anon
key, so these are safe to expose in the frontend bundle:

| Variable                        | Description                          |
| -------------------------------- | ------------------------------------- |
| `VITE_SUPABASE_PROJECT_ID`        | Supabase project ref                  |
| `VITE_SUPABASE_URL`               | Supabase project URL                  |
| `VITE_SUPABASE_PUBLISHABLE_KEY`   | Supabase anon/public API key          |
