# Mecka Clash — Render Free + RoyaleAPI proxy

This build preserves the V30 Mecka Clash dashboard design and uses the official Clash of Clans API through RoyaleAPI's proxy so Render Free does not need a static outbound IP.

Render environment variables:
- `DATABASE_URL` — Render Postgres Datastore URL
- `CLASH_API_TOKEN` — your official Clash of Clans API token
- `CLASH_CLAN_TAG` — `#2Q0Q82C9R`
- `CLASH_API_BASE_URL` — optional; defaults to `https://cocproxy.royaleapi.dev/v1`

RoyaleAPI documents that the official Clash API key should whitelist `45.79.218.79` when using its proxy.
