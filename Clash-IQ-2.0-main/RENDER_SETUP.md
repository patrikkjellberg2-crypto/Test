# Mecka Clash — Render deployment

This version is prepared for a single Render Web Service running the Node/Express API and serving the built Vite frontend.

## Render Web Service
- Build Command: `pnpm build`
- Start Command: `pnpm start`
- Environment: Node

## Required environment variables
- `DATABASE_URL` — use the connection string from the Render PostgreSQL database.
- `CLASH_API_TOKEN` — Clash of Clans API token. Do not commit this value.
- `CLASH_CLAN_TAG` — `#2Q0Q82C9R`
- `BASE_PATH` — `/` (optional; the app defaults to `/`).

The start command runs the Drizzle schema push before starting the API server.

## Important
Do not put secrets in GitHub or in this ZIP. Add them only in Render Environment Variables.


### Clash API proxy
This deployment uses the RoyaleAPI Clash of Clans proxy because Render Free does not provide a static outbound IP. The Clash API key must allowlist RoyaleAPI proxy IP `45.79.218.79`.
