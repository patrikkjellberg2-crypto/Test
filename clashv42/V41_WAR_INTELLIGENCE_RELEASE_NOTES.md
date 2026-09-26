# Clash IQ V41 — War Intelligence 2.0

## What changed

- Added `GET /api/clash/war-intelligence`.
- Added player performance intelligence derived entirely from the existing server-side war archive.
- Compares a player’s latest five completed live-captured wars with the preceding five when enough history exists.
- Tracks average stars, average destruction, 3-star rate, missed attacks, total attacks and wars counted.
- Adds an `improving`, `stable`, or `declining` trend. A trend is only compared when at least two previous wars are available, avoiding noisy conclusions from a single historical war.
- Added a new War Intelligence 2.0 section to War Archive with clan trend counts and player-level performance rows.

## Architecture

The Clash API ingestion path was not changed. The new intelligence layer reads the existing `war_archive` records, so it does not add extra Clash API traffic and does not require a new database table.

## Deployment

The active server remains `artifacts/api-server`. Run the normal project typecheck/build and deploy flow used by Clash IQ.
