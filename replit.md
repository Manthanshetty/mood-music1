# Mood to Music

A full-stack web application where users select their emotional mood and get curated YouTube music recommendations, with playlists, history tracking, search, and a video editor.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mood-to-music run dev` — run the frontend (port 20795)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Clerk auth (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, Wouter routing, TanStack Query
- API: Express 5 + Clerk auth (@clerk/express)
- DB: PostgreSQL + Drizzle ORM
- Auth: Clerk (Replit-managed)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all routes)
- `lib/db/src/schema/` — All 8 database table schemas (moods, songs, users, moodSelections, playlists, playlistSongs, history, videos)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, moods, songs, playlists, history, videos, dashboard)
- `artifacts/api-server/src/middlewares/requireAuth.ts` — Clerk auth middleware + JIT user provisioning
- `artifacts/mood-to-music/src/` — React frontend (App.tsx, pages/, components/)
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas (do not edit)

## Architecture decisions

- Cookie-based auth via Clerk (no manual JWT/Bearer token handling on web)
- JIT user provisioning in `requireAuth` middleware: creates a DB user row on first authenticated API call
- All 30 songs pre-seeded at DB setup time (5 per mood)
- YouTube iframe API used for playback controls (no streaming costs)
- OpenAPI-first: all types derived from `lib/api-spec/openapi.yaml` via Orval codegen

## Product

- **Landing page**: Public page with animated vinyl record, floating music notes, feature cards
- **Auth**: Clerk sign-in/sign-up with custom dark theme
- **Dashboard**: Greeting, stats (songs played, playlists, videos, moods), quick mood picker, recent history/playlists
- **Mood Selection**: 6 mood cards with unique gradients — Happy, Sad, Calm, Energetic, Romantic, Angry
- **Music Player**: YouTube embed, animated wave visualizer, song queue with Genre/Tempo/Language filters
- **Search**: Live debounced search across all 30 songs with mood filter pills
- **Playlists**: Create, view, and delete playlists; add/remove songs
- **Video Editor**: Attach mood-matched music metadata to uploaded videos
- **Profile**: Edit profile, change password via Clerk, mood history, account deletion

## User preferences

- College project for KLE GH BCA College Haveri (Agentify AI)
- Built with React/TypeScript stack (adapted from original Flask/Python spec)

## Gotchas

- Always re-run codegen after changing `lib/api-spec/openapi.yaml`
- Run `pnpm --filter @workspace/db run push` after schema changes
- Clerk dev keys show a warning in console — this is expected, not an error
- Do NOT add Bearer token auth to web app API calls — Clerk uses cookies

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk setup and customization
