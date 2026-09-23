# ClashIQ – player war history fix (upload pack)

Kopiera dessa filer in i ditt GitHub-repo (samma relativa sökvägar):

```
lib/db/src/schema/index.ts
lib/db/src/schema/player-war-history.ts   # oförändrad, ingår för tydlighet
artifacts/api-server/src/routes/clash.ts
docs/PLAYER_WAR_HISTORY_FIX.md
```

Om ditt repo har `packages/api-server` i stället för `artifacts/api-server`,
lägg `clash.ts` under `packages/api-server/src/routes/clash.ts`.

## Efter push

1. Se till att tabellen `player_war_history` finns (Drizzle migrate/push eller SQL i docs).
2. Deploy om API-servern.
3. Öppna dashboarden en gång, sedan en spelarsida – historiken ska fyllas på.

Se `docs/PLAYER_WAR_HISTORY_FIX.md` för detaljer.
