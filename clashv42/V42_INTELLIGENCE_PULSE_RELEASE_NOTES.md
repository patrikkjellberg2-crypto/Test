# Clash IQ V42 — Intelligence Pulse

## Base
V41 War Intelligence

## What changed
- Added `Intelligence Pulse` to the active dashboard.
- Uses deterministic live war data; no AI call is required for the pulse itself.
- Shows current stars, destruction and remaining attacks for both sides.
- Detects unused clan attacks during an active war.
- Detects whether the clan is behind, ahead or tied on stars.
- Detects cleanup opportunities from enemy attacks that did not produce a 3-star clear.
- Links directly to War Planner for the next action.
- Keeps the existing War Center, War Planner, AI Coach and archive flows unchanged.

## Why
This is the first step toward the Clash IQ Intelligence Core: connect the existing data and features so the dashboard tells the user what matters now, instead of only displaying separate statistics.

## Safety / architecture
- No database schema change.
- No new dependency.
- No new AI spend.
- No replacement of the existing archive logic.
- Change is isolated to the active `artifacts/mecka-clash-dashboard` frontend.

## Validation
The repository has no installed workspace dependencies in the supplied environment, and external npm access is unavailable, so the full pnpm build could not be executed here. TypeScript was invoked against the dashboard project and reached the dependency/type-definition stage without reporting a syntax error in the changed file.

## Next recommended V43
1. Move the pulse calculation into a shared intelligence API so War Center and Dashboard consume the same signal engine.
2. Add historical `What changed?` events from the war archive.
3. Feed verified intelligence summaries into AI Coach and War Planner as structured context.
4. Add player-level trend signals to the dashboard.
