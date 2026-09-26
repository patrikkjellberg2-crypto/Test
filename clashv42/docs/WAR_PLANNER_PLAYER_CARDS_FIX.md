# Mecka Clash — War Planner + Player Cards Fix

## Fixed
- War Planner PUT requests now URL-encode Clash player tags. Tags begin with `#`, which otherwise becomes a browser URL fragment and never reaches Express.
- Server normalizes attacker tags before saving, keeping stored tags consistent.
- War Center member rows now open the Player Card.
- War Planner attacker names/avatars now open the Player Card.
- Player Cards merge live war member data with the richer clan member profile so the card can show league, trophies, donations, Builder Base and current-war stats.

## Deployment
Keep the existing Render environment variables. The Clash API base defaults to the RoyaleAPI proxy already used by the live deployment.
