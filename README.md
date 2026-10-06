# Eris Tracker

React + Vite, Tailwind CSS v4, Supabase PostgreSQL and Supabase Auth.

Tracks personal Machine Learning challenges, submissions, ranks, baseline scores and earnings. Preserves the 17 colored types and status rules from the original app.

## Setup

1. Create/select a Supabase project.
2. Apply `supabase/migrations/202610060001_initial.sql` with the SQL Editor (once), or `supabase db push` with the Supabase CLI.
3. Enable Email authentication in Supabase Auth. Create an account in the app; email confirmation follows your project settings.
4. Copy `.env.example` to `.env.local` and fill in the project URL and **publishable key** (legacy anon key is also supported via `VITE_SUPABASE_ANON_KEY`). Never use a service_role/secret key in frontend code.
5. Run:

```sh
npm ci
npm run dev
```

## Verify and deploy

```sh
npm test
npm run build
npm run preview
```

Deploy the generated `dist/` directory to a static host with the two `VITE_SUPABASE_*` values configured **at build time**. Supabase schema and environment configuration must be ready before production rollout. Set Supabase Auth Site URL to the intended host for account confirmation emails. The existing Sites deployment is independent; this branch does not change it.

## Data and access

- `challenges`: owned by a Supabase Auth user, including type, tags, metric, ranks, baseline and earnings.
- `submissions`: references a challenge; cascade delete removes its submissions.
- Row Level Security restricts CRUD to the signed-in owner's challenges and submissions. Frontend uses the publishable key and the signed-in session.
- Cloud write failures stay visible; forms close only after a confirmed save.
- Challenge status: Top leaderboard when manually selected or Private rank 1–3; otherwise Pass with Pending review or Approved; Fail only when all submissions are Rejected. Empty challenges show “—”.
- Best Score uses all submissions and the configured metric direction.

## Migrate existing data

The app provides **Nhập dữ liệu trình duyệt cũ** and **Nhập tệp JSON** after signing in. The importer uses a transactional Supabase RPC and stable legacy IDs, so retrying an import does not duplicate records. It does not overwrite existing cloud records.

Browser storage is origin-specific: localStorage on the old Sites URL is not accessible from a new domain. To migrate across domains, export a JSON object with `{ "challenges": [...] }` from the old origin's `eris-tracker-v3` localStorage, then use **Nhập tệp JSON**. The old storage is left untouched. Duplicate names/versions or invalid records cause the import transaction to fail without partial writes.

## Structure

- `src/App.jsx`: authentication and workspace.
- `src/components/`: controlled forms, modal and colored badges.
- `src/lib/domain.js`: scoring and status rules.
- `src/lib/repository.js`: Supabase CRUD.
- `supabase/migrations/`: schema, RLS and legacy importer.
- `tests/`: domain regression tests and a real PostgreSQL (PGlite) check for schema, RLS isolation, import rollback/idempotency and cascade delete.

Branches: `main` holds the original snapshot; `feature/initial-setup` contains the React/Supabase migration.
