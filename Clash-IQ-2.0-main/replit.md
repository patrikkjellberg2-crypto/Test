# Mecka Clash Dashboard

Responsive Swedish Clash of Clans clan dashboard for clan `#2Q0Q82C9R`, powered by the official Clash API.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/mecka-clash-dashboard run dev` — run the dashboard frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secret: `CLASH_API_TOKEN` — official Clash of Clans API token, server-side only

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/routes/clash.ts` — server-side Clash API client and dashboard route
- `artifacts/mecka-clash-dashboard/src/pages/dashboard.tsx` — responsive dashboard UI
- `lib/api-spec/openapi.yaml` — source of truth for the `/api/clash/dashboard` contract
- `lib/api-client-react` — generated React Query client

## Architecture decisions

- Clash API calls stay in Express so the API token is never shipped to the browser.
- The frontend consumes one aggregate dashboard response to keep the mobile view consistent across clan, war, and Capital sections.
- Missing tokens and rejected tokens are distinct states; the app does not substitute fake clan data.

## Product

- Swedish dark/light war-room dashboard with responsive desktop, tablet, and mobile layouts.
- Live clan summary, member roster, current war, warlog, and Capital Raid pulse.
- Explicit loading, setup-needed, empty, retry, and API rejection states.

## User preferences

- Keep the Clash API token server-side in `CLASH_API_TOKEN`.

## Gotchas

- Clash developer tokens can be restricted by IP; a token that works locally may return HTTP 403 from the hosted server until its allowlist is updated.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
