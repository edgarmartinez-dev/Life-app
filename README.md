# Life app

One app to organize your whole life. Built as independent modules that share one
shell — starting with **To-dos**, with **Medications** and **Goals** coming next.

**Stack:** React + Vite + TypeScript · [daisyUI](https://daisyui.com) (Tailwind CSS) · [Supabase](https://supabase.com) (auth + Postgres) · Cloudflare (hosting)

## Getting started

1. **Create a Supabase project** at [supabase.com](https://supabase.com), then open the
   SQL editor and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
   This creates the `todos` table with row-level security so each user only sees
   their own data.

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
   Supabase → Project Settings → API.

3. **Run it:**

   ```bash
   npm install
   npm run dev
   ```

   Sign up with an email + password on the first screen (Supabase Auth handles it).

## Deploying to Cloudflare

Either connect this repo in the Cloudflare dashboard (Workers & Pages → import repo,
build command `npm run build`, output directory `dist`), or deploy from the CLI:

```bash
npm run build
npx wrangler deploy
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build-time environment
variables in the Cloudflare project settings (they are baked into the bundle at
build time). The anon key is safe to expose — row-level security protects the data.

## Adding a new life module

Each area of life is a self-contained module:

1. Create `src/modules/<name>/` with a `<Name>Module.tsx` component (see
   `src/modules/todos/` as the template: types + a data hook + UI components).
2. Add its table(s) to `supabase/schema.sql` using the same RLS pattern
   (rows owned by `user_id`, policies scoped to `auth.uid()`).
3. Register it in `src/modules/registry.tsx` — the sidebar picks it up automatically.

Planned modules: 💊 medication reminders, 🎯 goals.

## Scripts

| Command           | What it does                       |
| ----------------- | ---------------------------------- |
| `npm run dev`     | Start the dev server               |
| `npm run build`   | Type-check and build to `dist/`    |
| `npm run lint`    | Lint with oxlint                   |
| `npm run preview` | Preview the production build       |
