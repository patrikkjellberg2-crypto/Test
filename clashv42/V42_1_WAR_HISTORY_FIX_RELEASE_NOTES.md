# Clash IQ V42.1 — War History Backfill Fix

## Problem fixed
Player Cards could show `Historical Wars: 0` even when the clan had just completed a war. The dashboard already queried ClashKing's `/war/{clan}/previous` endpoint, but the returned full previous-war object was not captured because the result was not included in the Promise destructuring. The player page also relied directly on the official war log, which may contain final war results without member-level attack detail.

## Changes
- Captures the existing ClashKing previous-war response correctly.
- Backfills the previous completed war into `war_archive` with full member/attack data.
- Uses deterministic war IDs and upsert semantics, so the same war is never duplicated.
- Recomputes player aggregate war statistics after a backfill.
- Player pages now prefer server-side archived attack history.
- If a player page is opened before the dashboard has warmed the archive, it independently backfills the previous war and retries the archive lookup.
- Official war-log fallback remains in place for installations with no archived war data.
- No database schema change is required; the existing `war_archive` and `player_war_history` structures are reused.

## Expected result
After deployment, loading the dashboard or a player profile should capture the latest completed war. The Player Card should then be able to show the previous war's attacks, stars and destruction instead of `Historical Wars 0`, provided ClashKing returns the completed war with member-level detail.

## Validation limitation
The repository does not contain installed workspace dependencies and this environment cannot reach the npm registry, so the full pnpm TypeScript/build pipeline could not be executed here. The change was reviewed against the existing types, route flow and schema; no schema migration was introduced.
