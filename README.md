# Rabt-e-Ahlebait — Ahle Bait Student Network

A responsive React website built with Vite. Pages, university listings and search results are backed by local JavaScript data. The contact form validates input and displays a local preview without sending or storing it. Reviews and suggestions use Supabase with Row Level Security.

## Run locally

```sh
npm install
npm run dev
```

Vite prints a local development URL after startup. To create and preview a production build:

```sh
npm run build
npm run preview
```

### Deploying with Vercel

This is a single-page application, so the included [`vercel.json`](./vercel.json)
rewrites direct page requests such as `/reviews` to the app entry point. Redeploy
after adding or changing routes so those URLs work when opened directly or
refreshed.

## Project structure

- `src/App.jsx` — routes, shared navigation and page components
- `src/data/universities.js` — editable university and chapter content
- `src/index.css` — responsive layout and design system
- `public/assets/hero-rabt-ahlebait.jpeg` — supplied homepage hero image
- `public/assets/` — location for future approved local logo and photography assets

University listings and logos are configurable placeholders where appropriate; listed universities are not represented as officially affiliated partners. Replace remote university image URLs with approved imagery as it becomes available. The provided Rabt-e-Ahlebait logo, hero image, founder name and portrait are stored locally in `public/assets/`.

## Reviews & Suggestions with Supabase

The page submits reviews to Supabase with an `approved` status, so new feedback appears publicly immediately after submission.

### Configure Supabase

The local [`.env.local`](./.env.local) contains the supplied project URL and publishable key. Do not add a `service_role` key to frontend files. For another environment, copy [`.env.example`](./.env.example) and set:

```text
VITE_SUPABASE_URL=https://csreqpkiyegarhwoyofj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

### Apply the database migration

Run [`supabase/migrations/001_create_reviews.sql`](./supabase/migrations/001_create_reviews.sql) in the Supabase Dashboard **SQL Editor**. This is a manual step; the frontend cannot create or secure the table. The migration uses `create table if not exists`, enables RLS, grants table access required by PostgREST plus only the needed operations (select and insert; no update/delete for visitors), permits public reads of approved rows, and permits inserts with approved status. It does not delete existing data. If `public.reviews` already exists with a different schema, stop and adapt the migration to that schema instead of overwriting it.

There is no public moderation control and no admin key in the frontend. Existing rows with `pending` status will remain hidden by the public query until their status is changed to `approved`.

### Test

Run `npm install` and `npm run dev`, then open `/reviews`. Submit a review and confirm the row appears as `approved` in Supabase and on the public list. The page also shows loading, empty, configuration, and network-error states.
