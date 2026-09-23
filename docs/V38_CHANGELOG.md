# Mecka Clash V38

## Historical player statistics
- Added persistent `player_war_history` table.
- Active wars and available completed war-log members are captured whenever the dashboard refreshes.
- Player profiles read the stored history endpoint for cumulative attack statistics.
- Tracks attacks, stars, average stars, average destruction, 3-star attacks and missed wars.
- No historical attack results are invented; only attack data actually returned by Clash API is stored.

## Capital Raids
- Added a dedicated `/capital-raids` page.
- Added a working Huvudstadsräder navigation item across the dashboard shell.
- Shows available raid seasons, loot, medals, raid count and participant statistics when supplied by Clash API.
- Season selector lets leadership inspect the last five seasons already fetched by the backend.
