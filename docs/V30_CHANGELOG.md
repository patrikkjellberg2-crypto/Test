# Mecka Clash V30

Built from the full Replit project ZIP.

- Fixed the missing `i` in `war-planner.tsx` if present in the imported snapshot.
- Only `preparation`, `inWar`, and `matchmaking` count as an active war.
- Backend converts `notInWar` and ended current-war responses to `currentWar: null`.
- War Planner shows real attack count and attacks remaining for each member.
- War Planner flags a selected target when a real attack exists against that target.
- Available-target metric counts opponent bases without a registered attack.
- Removed two stray root files from the project.
- Removed the local Clash token memory file from the distributable copy.

No fake clan/member/opponent/target/strategy data was added.
