# Player war history fix

## Problem
The player page showed `0` wars / "No historical war records" because
`GET /api/clash/player/:tag` only read Supercell's `/clans/{tag}/warlog`.
That endpoint does **not** include per-member attack details, so no rows matched.

## Solution (both approaches)

1. **ClashKing + ended current war**  
   When loading a player (and when loading the dashboard), we fetch full war
   objects that include `members[].attacks` and use them for stats.

2. **Durable DB storage (`player_war_history`)**  
   Those full wars are upserted into Postgres so history accumulates over time
   even if external APIs later omit details.

## Files changed

| Path | Change |
|------|--------|
| `lib/db/src/schema/index.ts` | Export `playerWarHistoryTable` |
| `lib/db/src/schema/player-war-history.ts` | Unchanged schema (already present) |
| `artifacts/api-server/src/routes/clash.ts` | History helpers + player/dashboard logic |

> If your repo uses `packages/api-server/...` instead of `artifacts/api-server/...`,
> copy the same `clash.ts` changes into that path.

## Database

Table is defined by Drizzle schema `player_war_history`.

If the table does not exist yet, run your usual Drizzle migrate/push, or:

```sql
CREATE TABLE IF NOT EXISTS player_war_history (
  id SERIAL PRIMARY KEY,
  war_key TEXT NOT NULL,
  attacker_tag TEXT NOT NULL,
  attacker_name TEXT NOT NULL,
  opponent_name TEXT,
  result TEXT,
  war_end_time TEXT,
  townhall_level INTEGER,
  attacks JSONB NOT NULL DEFAULT '[]'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT player_war_history_war_player_unique UNIQUE (war_key, attacker_tag)
);
```

## Behaviour after deploy

1. Open the **dashboard** once (persists ClashKing previous war + ended current war for the whole roster).
2. Open a **player** page — stats are built from DB first, then live ClashKing/official sources.
3. Each new finished war that is seen with member data grows the history.

## Limits

- ClashKing `/war/{clan}/previous` typically returns **one** previous war. Older wars appear after they have been seen (and persisted) while the app is running.
- History is scoped to the **active clan** (`clan_selection` / dashboard clan). Players who left the clan only keep rows already stored.
- Official warlog remains a fallback but usually still has no member attacks.

## Optional next step

Add a small cron/job that walks ClashKing previous wars by `endTime`
(`/v2/war/{clan}/previous/{endTime}`) to backfill older seasons into
`player_war_history`.
