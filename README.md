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

## Announcements

The public announcements page is available at `/announcements`. Authorized administrators manage announcements at `/admin/announcements` using Supabase Auth email/password sign-in. Announcements can contain a title, multiline text, an optional image, and an optional event date/time.

### Configure announcements in Supabase

Run [`supabase/migrations/002_create_announcements.sql`](./supabase/migrations/002_create_announcements.sql) in the Supabase Dashboard **SQL Editor** after the reviews migration. This creates the announcements table, the public `announcements` Storage bucket, RLS policies, and the `announcement_admins` authorization table. It does not create an administrator or store any credentials.

To authorize an administrator:

1. In Supabase Dashboard, open **Authentication → Users** and create or invite the administrator with email/password.
2. Copy that user's UUID.
3. Run this SQL in the SQL Editor, replacing the placeholder:

```sql
insert into public.announcement_admins (user_id)
values ('AUTH_USER_UUID');
```

Only users listed in `announcement_admins` can read drafts, create, edit, publish, unpublish, or delete announcements and upload/delete announcement images. The frontend uses only the publishable Supabase key; never put a `service_role` key in `.env` or frontend code.

If email confirmation is enabled in Supabase Auth, confirm the administrator's email before signing in. If you want to use a different Auth provider, enable it in Supabase and adapt the sign-in form before deployment.

## Community registration email

The Contact page sends all eight registration fields to
`rabteahlebayt@gmail.com` through EmailJS. EmailJS handles delivery in the
browser; no custom backend or Gmail password is placed in the React app.

### Configure EmailJS

1. Create an account at [EmailJS](https://www.emailjs.com/).
2. Add an email service connected to the destination Gmail account.
3. Create a template whose **To email** is `rabteahlebayt@gmail.com`.
4. Use these template variables:

```text
{{name}}
{{email}}
{{contactNumber}}
{{communityName}}
{{universityName}}
{{degreeName}}
{{memberCount}}
{{message}}
```

The form also sends `from_name`, `from_email`, `contact_number`, `community_name`,
`university_name`, `degree_name`, and `member_count` aliases for templates
created with snake_case variable names. It also sends `phone`, `phoneNumber`,
`phone_number`, and a complete `registrationDetails` block for templates that
use a different phone variable name.

The EmailJS template must explicitly include the contact number. For example,
set the template body to:

```text
New community registration

Name: {{name}}
Email: {{email}}
Contact number: {{contactNumber}}
Community: {{communityName}}
University: {{universityName}}
Degree: {{degreeName}}
Members: {{memberCount}}
Message:
{{message}}

Complete details:
{{registrationDetails}}
```

If the existing template uses snake_case variables, use `{{contact_number}}`
instead. Saving the React code alone cannot make a variable appear in an
EmailJS email when that variable is not included in the EmailJS template body.

5. Copy `.env.example` to `.env.local` and set:

```text
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

The EmailJS public key, service ID, and template ID are intended for browser
use. Do not put a Gmail password, app password, private API key, or service
secret in `VITE_*` variables. Configure the same three variables in the
production hosting provider and redeploy the frontend.

## Pakistan Shia Islamic Calendar and Jafari Prayer Times

The public calendar is available at `/islamic-calendar`, with administration at `/admin/islamic-calendar`. Run [`supabase/migrations/003_create_islamic_calendar.sql`](./supabase/migrations/003_create_islamic_calendar.sql) after migration 002. It creates RLS-protected occasion and confirmed-date tables and reuses the existing `is_announcement_admin()` allowlist. No administrator credentials or service-role key are stored in the frontend.

## Urdu Islamic Stories

The public Urdu-first stories library is available at `/stories`; permanent article URLs use `/stories/<slug>`. Authorized publishing is available at `/admin/stories`. The editor stores plain text with safe formatting markers (`# heading`, `> quotation`, and blank lines for paragraphs), so article content is rendered without unsafe HTML.

### Configure the stories database

Run [`supabase/migrations/004_create_stories.sql`](./supabase/migrations/004_create_stories.sql) after migration 003. It creates the `story_categories`, `stories`, and `story_sources` tables, indexes, RLS policies, the `story-covers` public bucket, and its Storage policies. It reuses the existing `announcement_admins` administrator allowlist and `is_announcement_admin()` database function. Run [`supabase/migrations/005_seed_story_samples.sql`](./supabase/migrations/005_seed_story_samples.sql) after it if you want the three reviewed sample articles. If migration 004 was already applied, run [`supabase/migrations/006_allow_existing_story_admins.sql`](./supabase/migrations/006_allow_existing_story_admins.sql) once so any existing allowlisted administrator can edit all stories. The sample references intentionally omit edition-specific page numbers where they have not been verified; the article notes distinguish historical reports and disputed details.

RLS permits anonymous and normal authenticated users to read only published stories, their categories, published cover images, and sources belonging to published stories. Drafts and draft sources are hidden at the database policy level. Only users already present in `public.announcement_admins` can create, edit, publish, unpublish, delete stories or manage covers. Do not expose a service-role key in the frontend.

### Administrator and storage setup

Use the administrator user that already exists in Supabase **Authentication → Users**. If that user is already present in the existing `public.announcement_admins` allowlist, no new user or administrator setup is required. If the existing user is not in the allowlist, add its UUID:

```sql
insert into public.announcement_admins (user_id)
values ('AUTH_USER_UUID');
```

The migration creates the `story-covers` bucket automatically. Cover paths are stored as `<story UUID>/<random filename>`. Public object reads are allowed only when the related story is published; administrator upload, update, and delete operations are protected by the same database authorization function.

### SEO and deployment

Story detail pages set Urdu document titles, descriptions, canonical URLs, and Open Graph title/description/type metadata from published story data. The static sitemap includes the library index. Add each published `/stories/<slug>` URL to a generated sitemap at deployment time if the hosting pipeline supports it; never include drafts. Vercel's existing SPA rewrite in [`vercel.json`](./vercel.json) is required for direct story and admin URL refreshes. The current client-rendered pages are crawlable after JavaScript execution; fully server-rendered article previews would require a prerendering/SSR deployment change.

### Verification

After applying migrations, verify with three Supabase sessions: an anonymous client must list published rows but receive no drafts; an ordinary authenticated user must have the same published-only view and receive permission errors for writes; a user listed in `announcement_admins` must be able to create a draft, upload a cover, publish/unpublish it, replace sources, and delete it. In the browser, test `/stories`, Urdu title search, category filtering, `/stories/<slug>`, WhatsApp sharing, `/admin/stories`, retry/empty states, and a direct URL refresh.

Shia.pk was inspected as the Pakistan-focused reference. It provides public community/prayer information but no documented public calendar API suitable for this frontend, so its pages are not scraped. Confirmed Pakistani Shia dates must be entered by an authorized administrator in the calendar admin page with a source and reason. Public visitors see only published occasions and `verified`/`confirmed` overrides; awaiting dates remain hidden from the public confirmed data.

Calculated Hijri dates use AlAdhan's `gToH` endpoint as an estimate. Prayer times use the browser directly against AlAdhan's daily timings endpoint:

```text
https://api.aladhan.com/v1/timings/{DD-MM-YYYY}?latitude={city_latitude}&longitude={city_longitude}&method=0&timezonestring=Asia/Karachi&midnight=JAFARI
```

`method=0` is Jafari/Shia Ithna-Ashari, and the UI displays the city, timezone, method, and Jafari midnight setting. Prayer results are cached in browser storage for one hour and Hijri results for twelve hours. Prayer calculations can differ from local mosque timetables. The city list currently includes Lahore, Karachi, Islamabad, Rawalpindi, Peshawar, and Quetta.

To maintain verified data, sign in at `/admin/islamic-calendar` with a Supabase Auth user already listed in `public.announcement_admins`. Add each occasion with its Hijri month/day and source, then add confirmed Gregorian overrides after reliable Pakistan/community confirmation. Do not label an AlAdhan estimate as a moon-sighting confirmation.

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
