# Mecka Clash V40 — Stable English

V40 is a stability-first rebuild based on the last known-good V37 application structure.

## What changed
- Kept the existing Mecka Clash design and navigation.
- English UI throughout the main dashboard, War Center, War Planner, Members and Player Card.
- Kept the working War Planner save/undo flow and URL-encoded player tags.
- Added the Capital Raids page/route without changing the core server architecture.
- Fixed Clash API list-envelope handling for `warlog` and `capitalraidseasons` (`{ items: [...] }`).
- Kept player historical war statistics calculated from the live clan war log; no persistent history capture is performed during dashboard requests.
- Removed the V39 persistent-history capture path because it added many database writes to every dashboard refresh and was not appropriate for the stability-first build.
- Removed the extra player-history database table from this release.
- Kept the Render single-service static frontend serving setup.

## Validation
- TypeScript/TSX transpile validation: 0 syntax diagnostics across 166 source files.
- Full dependency install/build was not possible in the sandbox because external package registry access is unavailable. Render should perform the authoritative dependency build.

## Stability principle
Do not add new speculative features until V40 is deployed and the five core screens are confirmed working:
1. Overview
2. War Center
3. War Planner
4. Capital Raids
5. Members / Player Card
