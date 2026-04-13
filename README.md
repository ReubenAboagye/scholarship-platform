# ScholarMatch — Local Setup

## Prerequisites

- Node.js 18+ (check: `node -v`)
- pnpm (check: `pnpm -v`)

**Install pnpm if needed:**
```bash
npm install -g pnpm
```

---

## Quickstart

### 1. Install dependencies
```bash
pnpm install
```
pnpm pulls from its global store — much faster than npm if you have
built Next.js projects before.

### 2. Set up environment
```bash
cp .env.local.example .env.local
```
Open `.env.local` and fill in your Supabase and OpenAI keys.
See `SUPABASE_SETUP.md` for where to find each value.

### 3. Set up Supabase
Follow `SUPABASE_SETUP.md` — run the 3 migration files in order.

### 4. Generate AI embeddings (once)
```bash
pnpm tsx scripts/generate-embeddings.ts
```

### 5. Start dev server
```bash
pnpm dev
```
Open http://localhost:3000

---

## Key Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start dev server with hot reload |
| `pnpm build` | Production build |
| `pnpm start` | Run production build locally |
| `pnpm tsx scripts/generate-embeddings.ts` | Generate AI vectors (once) |

---

## Project Structure

```
src/
  app/
    page.tsx              <- Homepage
    auth/                 <- Login, Signup, Callback
    dashboard/            <- User dashboard (overview, profile, saved, tracker)
    admin/                <- Admin panel (scholarships, users, analytics)
    scholarships/         <- Browse + detail pages
    api/                  <- API routes (scholarships, matching, auth)
  components/
    layout/               <- Navbar, Footer
    dashboard/            <- Sidebar
    admin/                <- AdminSidebar, ScholarshipForm
    scholarship/          <- SaveButton
  lib/
    supabase/             <- client.ts, server.ts, middleware.ts
    ai/                   <- matching.ts (RAG engine)
    utils/                <- helpers and formatters
  types/index.ts          <- All TypeScript types

supabase/migrations/      <- Run these in Supabase SQL Editor
scripts/                  <- generate-embeddings.ts (one-time setup)
```

---

## Deploy to Netlify

1. Push to GitHub
2. Connect repo in Netlify dashboard
3. Add all .env.local values to Netlify environment variables
4. Update Supabase Auth > Site URL to your live domain
5. Deploy

---

Developed by GenTech Solutions
