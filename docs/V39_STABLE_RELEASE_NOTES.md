# Mecka Clash V39 — Stable English Release

This release is focused on stability rather than adding new UI concepts.

## Fixed
- All user-facing dashboard text is English.
- Clash list endpoints are normalized from `{ items: [...] }` envelopes so War Log and Capital Raid Seasons are no longer silently treated as empty.
- Historical war capture now receives normalized war-log items and continues storing per-player attack data in PostgreSQL.
- Player historical statistics can continue to use the real Clash war log; no fabricated historical attack data is added.
- Capital Raids uses the real API member fields: `attacks`, `attackLimit`, `bonusAttackLimit`, and `capitalResourcesLooted`.
- Capital reward display uses the real `offensiveReward` + `defensiveReward` fields.
- War Planner loads and saves assignments with direct same-origin API calls, avoiding generated-query validation issues that could blank the page.
- War Planner target assignments remain undoable by clearing the target and resetting lock/completed state.
- Player tags are URL-encoded so `#` never becomes a URL fragment.

## Deliberate scope
No redesign. No new speculative stats. This release keeps the existing Mecka Clash visual system and concentrates on reliable live data, persistence, and English UI.
