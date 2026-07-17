# Life app

One app to organize your whole life. Built as independent modules that share one
shell — starting with **To-dos**, with **Medications** and **Goals** coming next.

**Stack:** React + Vite + TypeScript · [daisyUI](https://daisyui.com) (Tailwind CSS) · Cloudflare Workers + D1 (API, storage, hosting)

Everything runs on Cloudflare — no external database service. Data lives in a
[D1](https://developers.cloudflare.com/d1/) (SQLite) database with automatic
point-in-time backups via Time Travel.

## Getting started

```bash
npm install
npx wrangler d1 migrations apply life-app-db --local
npm run dev
```

The Cloudflare Vite plugin runs the Worker API (`worker/index.js`) and a local
D1 database inside the dev server — one command, no other services.

## Deploying

```bash
npm run build
npx wrangler deploy
```

First time on a new Cloudflare account: `npx wrangler d1 create life-app-db`,
put the new `database_id` in `wrangler.jsonc`, then
`npx wrangler d1 migrations apply life-app-db --remote`.

**Auth:** the app has no login code. To keep it private, add a Cloudflare Access
policy (dashboard → Zero Trust → Access → Applications) on the app's URL that
allows only your email. Free for personal use.

**Backups:** D1 Time Travel restores the database to any point in the last 7
days (free plan) — `npx wrangler d1 time-travel restore life-app-db --timestamp=...`.
For long-term copies: `npx wrangler d1 export life-app-db --remote --output=backup.sql`.

## Adding a new life module

Each area of life is a self-contained module:

1. Create `src/modules/<name>/` with a `<Name>Module.tsx` component (see
   `src/modules/todos/` as the template: types + a data hook + UI components).
2. Add a numbered migration in `migrations/` for its table(s) and apply it.
3. Add its `/api/<name>` routes to `worker/index.js`.
4. Register it in `src/modules/registry.tsx` — the sidebar picks it up automatically.

Planned modules: 💊 medication reminders, 🎯 goals.

## Scripts

| Command           | What it does                            |
| ----------------- | --------------------------------------- |
| `npm run dev`     | Dev server (frontend + API + local D1)  |
| `npm run build`   | Type-check and build                    |
| `npm run lint`    | Lint with oxlint                        |
| `npm run preview` | Preview the production build locally    |
