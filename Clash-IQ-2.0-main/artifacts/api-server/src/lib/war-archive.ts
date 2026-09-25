import { and, desc, eq, sql } from "drizzle-orm";
import { db, playerWarStatsTable, warArchiveTable, type InsertWarArchiveRow } from "@workspace/db";
import type { Logger } from "pino";

type Dict = Record<string, any>;

const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function normalizeTag(tag: string) {
  const value = str(tag).trim().toUpperCase().replace(/\s+/g, "");
  return value.startsWith("#") ? value : `#${value}`;
}

function warKey(clanTag: string, opponentTag: string, endTime: string) {
  return `${normalizeTag(clanTag)}__${normalizeTag(opponentTag)}__${str(endTime)}`;
}

function buildRow(clanTag: string, war: Dict, source: "live" | "warlog"): InsertWarArchiveRow | null {
  const clan = war?.clan && typeof war.clan === "object" ? war.clan : null;
  const opponent = war?.opponent && typeof war.opponent === "object" ? war.opponent : null;
  const endTime = str(war?.endTime);
  if (!clan || !opponent || !str(clan.tag) || !str(opponent.tag) || !endTime) return null;

  const members = Array.isArray(clan.members) ? clan.members : [];
  const opponentMembers = Array.isArray(opponent.members) ? opponent.members : [];

  return {
    id: warKey(clanTag, str(opponent.tag), endTime),
    clanTag: normalizeTag(str(clan.tag)),
    clanName: str(clan.name) || null,
    opponentTag: normalizeTag(str(opponent.tag)),
    opponentName: str(opponent.name) || null,
    state: str(war.state) || (source === "warlog" ? "warEnded" : "unknown"),
    result: str(war.result).toLowerCase() || null,
    teamSize: num(war.teamSize),
    attacksPerMember: num(war.attacksPerMember) || 2,
    startTime: str(war.startTime) || null,
    endTime,
    clanStars: num(clan.stars),
    clanDestruction: num(clan.destructionPercentage),
    clanAttacksUsed: num(clan.attacks),
    opponentStars: num(opponent.stars),
    opponentDestruction: num(opponent.destructionPercentage),
    members,
    opponentMembers,
    source,
  };
}

/**
 * Recomputes the rolled-up per-player stats for a clan from every stored
 * war that has member-level detail (source = "live"). Cheap enough to run
 * after every snapshot: wars per clan are a few hundred at most.
 */
async function recomputePlayerStats(clanTag: string) {
  const tag = normalizeTag(clanTag);
  const wars = await db
    .select({
      members: warArchiveTable.members,
      attacksPerMember: warArchiveTable.attacksPerMember,
      source: warArchiveTable.source,
      state: warArchiveTable.state,
    })
    .from(warArchiveTable)
    .where(eq(warArchiveTable.clanTag, tag));

  const stats = new Map<
    string,
    { name: string; wars: number; possible: number; used: number; stars: number; threes: number; destruction: number }
  >();

  for (const war of wars) {
    if (war.source !== "live") continue;
    if (war.state !== "warEnded") continue;
    const members = Array.isArray(war.members) ? (war.members as Dict[]) : [];

    for (const m of members) {
      const playerTag = normalizeTag(str(m?.tag));
      if (!playerTag || playerTag === "#") continue;
      const entry =
        stats.get(playerTag) ||
        { name: str(m?.name), wars: 0, possible: 0, used: 0, stars: 0, threes: 0, destruction: 0 };
      entry.name = str(m?.name) || entry.name;
      entry.wars += 1;
      entry.possible += num(war.attacksPerMember) || 2;

      const attacks = Array.isArray(m?.attacks) ? m.attacks : [];
      entry.used += attacks.length;
      for (const a of attacks) {
        entry.stars += num(a?.stars);
        entry.destruction += num(a?.destructionPercentage);
        if (num(a?.stars) === 3) entry.threes += 1;
      }
      stats.set(playerTag, entry);
    }
  }

  if (stats.size === 0) return;

  const rows = Array.from(stats.entries()).map(([playerTag, s]) => ({
    clanTag: tag,
    playerTag,
    playerName: s.name || playerTag,
    warsCounted: s.wars,
    attacksPossible: s.possible,
    attacksUsed: s.used,
    starsTotal: s.stars,
    threeStars: s.threes,
    destructionTotal: s.destruction,
  }));

  for (const row of rows) {
    await db
      .insert(playerWarStatsTable)
      .values(row)
      .onConflictDoUpdate({
        target: [playerWarStatsTable.clanTag, playerWarStatsTable.playerTag],
        set: {
          playerName: row.playerName,
          warsCounted: row.warsCounted,
          attacksPossible: row.attacksPossible,
          attacksUsed: row.attacksUsed,
          starsTotal: row.starsTotal,
          threeStars: row.threeStars,
          destructionTotal: row.destructionTotal,
          updatedAt: new Date(),
        },
      });
  }
}

/**
 * Saves the war that is currently running (with full member attack detail).
 * Safe to call on every dashboard load: it upserts by warKey, so a war is
 * only ever stored once and simply refreshed as it progresses.
 */
export async function snapshotCurrentWar(clanTag: string, currentWar: unknown, log?: Logger) {
  try {
    const war = currentWar as Dict;
    const state = str(war?.state);
    if (!["inWar", "warEnded"].includes(state)) return;

    const row = buildRow(clanTag, war, "live");
    if (!row) return;

    await db
      .insert(warArchiveTable)
      .values(row)
      .onConflictDoUpdate({
        target: warArchiveTable.id,
        set: {
          state: row.state,
          result: row.result,
          clanStars: row.clanStars,
          clanDestruction: row.clanDestruction,
          clanAttacksUsed: row.clanAttacksUsed,
          opponentStars: row.opponentStars,
          opponentDestruction: row.opponentDestruction,
          members: row.members,
          opponentMembers: row.opponentMembers,
          updatedAt: new Date(),
        },
      });

    if (state === "warEnded") await recomputePlayerStats(clanTag);
  } catch (error) {
    log?.warn({ err: error }, "war archive: failed to snapshot current war");
  }
}

/**
 * Merges the official war log (final results only, no per-attack detail).
 * Never overwrites a "live" row that already has full member detail.
 */
export async function snapshotWarlog(clanTag: string, warlog: unknown, log?: Logger) {
  try {
    const items = Array.isArray(warlog) ? warlog : [];
    if (!items.length) return;

    for (const war of items) {
      const row = buildRow(clanTag, war as Dict, "warlog");
      if (!row) continue;

      await db
        .insert(warArchiveTable)
        .values(row)
        .onConflictDoUpdate({
          target: warArchiveTable.id,
          // Only fill in the result if we do not already have richer data.
          set: {
            result: row.result,
            updatedAt: new Date(),
          },
        });
    }
  } catch (error) {
    log?.warn({ err: error }, "war archive: failed to snapshot war log");
  }
}

export async function listArchivedWars(clanTag: string, limit = 60) {
  const tag = normalizeTag(clanTag);
  return db
    .select()
    .from(warArchiveTable)
    .where(eq(warArchiveTable.clanTag, tag))
    .orderBy(desc(warArchiveTable.endTime))
    .limit(Math.min(200, Math.max(1, limit)));
}

export async function getArchivedWar(clanTag: string, id: string) {
  const tag = normalizeTag(clanTag);
  const [row] = await db
    .select()
    .from(warArchiveTable)
    .where(and(eq(warArchiveTable.clanTag, tag), eq(warArchiveTable.id, id)))
    .limit(1);
  return row ?? null;
}

export async function listPlayerWarStats(clanTag: string) {
  const tag = normalizeTag(clanTag);
  return db
    .select()
    .from(playerWarStatsTable)
    .where(eq(playerWarStatsTable.clanTag, tag))
    .orderBy(desc(sql`${playerWarStatsTable.starsTotal}::float / GREATEST(${playerWarStatsTable.attacksUsed}, 1)`));
}
