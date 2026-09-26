# Mecka Clash V37

- Fixed white/blank War Planner caused by `onUndo` being referenced without being destructured in `PlannerRow`.
- Kept undo/reset assignment behavior.
- Player profile now reads hero levels from Clash API's `heroes` field and pets from `pets`, instead of incorrectly trying to infer heroes from `troops`.
- Added explicit Heroes & Pets section with levels.
- Important API limitation: Clash of Clans `warlog` does not provide historical per-player attack records. V37 does not fabricate old attack statistics. Historical individual attacks can only be shown for data the app has actually archived going forward.
