# Eris Tracker

React + Vite, Tailwind CSS v4, Supabase PostgreSQL and Supabase Auth.

Track personal ML challenges directly: Difficulty, Public/Private scores and baselines, ranks, earnings, dates, types and tags.

## Database setup and rollout

For a new project, run `supabase/migrations/202610060001_initial.sql` first. For existing projects, keep the initial schema already installed.

Then run **`supabase/challenge_results.sql` once in Supabase SQL Editor before deploying this UI**. The SQL transaction:

- Renames the old baseline to Public baseline.
- Copies each old Best Score to Public score using its configured metric direction, including zero and rejected scores as before.
- Preserves existing review-derived Pass/Fail and Top leaderboard as manual challenge statuses.
- Leaves Difficulty, Private score and Private baseline empty.
- Permanently drops the submission table and its old importer. Individual submission histories are no longer retained; only the copied best score and challenge status remain.
- Keeps the existing account ownership RLS and installs a challenge-only JSON importer.

Run the SQL before deploying: the new UI requires the new columns. `supabase db push` alone does not run this separate SQL Editor conversion script.

## Local development

Copy `.env.example` to `.env.local` and fill in the Supabase project URL and publishable key. Do not use secret/service-role keys in the frontend. Enable email authentication in Supabase and configure the Auth Site URL for confirmation emails.

```sh
npm ci
npm run dev
```

## UI

Click a challenge name to edit it directly. Difficulty is optional free text (up to 80 characters). Scores, baselines, ranks and earnings can be left empty.

Dates are displayed and edited in Vietnam time. Unrelated form edits preserve the original timestamp, including seconds. The table defaults to newest first and ten rows per page, with 10/20/50/100 page-size options. Sorting supports name, date/time, type, difficulty, scores, baselines, earnings and ranks. Empty values stay last.

Status can be selected manually as Top leaderboard, Pass or Fail. Automatic status first checks Private Rank 1–3, then compares a complete Private score/baseline pair, falling back to Public. The metric direction determines whether higher or lower scores pass; equality fails. Missing pairs or direction show “—”. Converted challenges retain their prior status until the user selects automatic mode.

JSON exports contain challenges only. The transactional importer is account-scoped and retry-safe via legacy IDs; it does not overwrite existing records. Old backups containing nested submission lists are rejected so their histories are not silently discarded. Existing database data should be converted with the SQL script above.

## Verification and deployment

```sh
npm test
npm run build
npm run preview
```

Deploy `dist/` with the `VITE_SUPABASE_*` variables configured at build time. Tests cover schema conversion, preservation of old results, removal of the submission table, RLS isolation, CRUD, backup import and rollback, statuses, datetime, sorting and pagination.
