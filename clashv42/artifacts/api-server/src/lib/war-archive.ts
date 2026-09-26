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
/**
 * Backfills a completed war from a historical provider. ClashKing's
 * `/war/{clan}/previous` endpoint contains the previous completed war with
 * member-level attack detail, so it can repair history even when the app was
 * not open while the war ended.
 *
 * This is intentionally idempotent: the war key is deterministic and the
 * row is refreshed rather than duplicated.
 */
export async function snapshotHistoricalWar(
  clanTag: string,
  historicalWar: unknown,
  log?: Logger,
) {
  try {
    const war = historicalWar as Dict;
    const row = buildRow(clanTag, war, "live");
    if (!row) return;

    const completedRow = {
      ...row,
      state: "warEnded",
      source: "live" as const,
    };

    await db
      .insert(warArchiveTable)
      .values(completedRow)
      .onConflictDoUpdate({
        target: warArchiveTable.id,
        set: {
          // Refresh the identity fields too. Earlier versions could archive a
          // previous war while ClashKing had our clan on the `opponent` side.
          // The deterministic ID stayed the same, so merely updating members
          // left the row under the wrong clanTag and Player History kept
          // returning zero.
          clanTag: completedRow.clanTag,
          clanName: completedRow.clanName,
          opponentTag: completedRow.opponentTag,
          opponentName: completedRow.opponentName,
          state: "warEnded",
          result: completedRow.result,
          teamSize: completedRow.teamSize,
          attacksPerMember: completedRow.attacksPerMember,
          startTime: completedRow.startTime,
          endTime: completedRow.endTime,
          clanStars: completedRow.clanStars,
          clanDestruction: completedRow.clanDestruction,
          clanAttacksUsed: completedRow.clanAttacksUsed,
          opponentStars: completedRow.opponentStars,
          opponentDestruction: completedRow.opponentDestruction,
          members: completedRow.members,
          opponentMembers: completedRow.opponentMembers,
          source: "live",
          updatedAt: new Date(),
        },
      });

    await recomputePlayerStats(clanTag);
  } catch (error) {
    log?.warn({ err: error }, "war archive: failed to backfill previous war");
  }
}

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

export type PlayerPerformanceRow = {
  playerTag: string;
  playerName: string;
  warsCounted: number;
  attacksPossible: number;
  attacksUsed: number;
  missedAttacks: number;
  starsTotal: number;
  threeStars: number;
  avgStars: number;
  avgDestruction: number;
  threeStarRate: number;
  recentWars: number;
  recentAvgStars: number;
  previousAvgStars: number;
  recentAvgDestruction: number;
  previousAvgDestruction: number;
  trend: "improving" | "declining" | "stable";
};

/**
 * Builds player-level intelligence from the archived live wars. The latest
 * five completed wars are compared with the five immediately before them.
 * This deliberately stays derived from stored data: no extra Clash API calls
 * are needed and the existing archive ingestion remains untouched.
 */
export async function listPlayerPerformance(clanTag: string): Promise<PlayerPerformanceRow[]> {
  const tag = normalizeTag(clanTag);
  const wars = await db
    .select({
      endTime: warArchiveTable.endTime,
      members: warArchiveTable.members,
      attacksPerMember: warArchiveTable.attacksPerMember,
      source: warArchiveTable.source,
      state: warArchiveTable.state,
    })
    .from(warArchiveTable)
    .where(eq(warArchiveTable.clanTag, tag))
    .orderBy(desc(warArchiveTable.endTime));

  type AttackSample = { stars: number; destruction: number };
  type PlayerSample = { name: string; possible: number; attacks: AttackSample[] };
  const byPlayer = new Map<string, { name: string; wars: PlayerSample[] }>();

  for (const war of wars) {
    if (war.source !== "live" || war.state !== "warEnded") continue;
    const members = Array.isArray(war.members) ? (war.members as Dict[]) : [];
    const possiblePerPlayer = num(war.attacksPerMember) || 2;

    for (const member of members) {
      const playerTag = normalizeTag(str(member?.tag));
      if (!playerTag || playerTag === "#") continue;
      const attacks = Array.isArray(member?.attacks) ? member.attacks : [];
      const sample: PlayerSample = {
        name: str(member?.name),
        possible: possiblePerPlayer,
        attacks: attacks.map((attack: Dict) => ({
          stars: num(attack?.stars),
          destruction: num(attack?.destructionPercentage),
        })),
      };
      const entry = byPlayer.get(playerTag) ?? { name: sample.name, wars: [] };
      entry.name = sample.name || entry.name;
      entry.wars.push(sample);
      byPlayer.set(playerTag, entry);
    }
  }

  const round = (value: number, digits = 1) => {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  };

  const result: PlayerPerformanceRow[] = [];
  for (const [playerTag, player] of byPlayer.entries()) {
    const counted = player.wars;
    if (!counted.length) continue;

    const flatten = (items: PlayerSample[]) => items.flatMap(item => item.attacks);
    const aggregate = (items: PlayerSample[]) => {
      const attacks = flatten(items);
      const possible = items.reduce((sum, item) => sum + item.possible, 0);
      const stars = attacks.reduce((sum, attack) => sum + attack.stars, 0);
      const destruction = attacks.reduce((sum, attack) => sum + attack.destruction, 0);
      const threes = attacks.filter(attack => attack.stars === 3).length;
      return {
        possible,
        used: attacks.length,
        stars,
        destruction,
        threes,
        avgStars: attacks.length ? stars / attacks.length : 0,
        avgDestruction: attacks.length ? destruction / attacks.length : 0,
      };
    };

    const all = aggregate(counted);
    const recent = aggregate(counted.slice(0, 5));
    const previous = aggregate(counted.slice(5, 10));
    const starDelta = recent.avgStars - previous.avgStars;
    const destructionDelta = recent.avgDestruction - previous.avgDestruction;
    const comparable = previous.length >= 2 && previous.used > 0;
    const trend = !comparable
      ? "stable"
      : starDelta >= 0.2 || destructionDelta >= 5
        ? "improving"
        : starDelta <= -0.2 || destructionDelta <= -5
          ? "declining"
          : "stable";

    result.push({
      playerTag,
      playerName: player.name || playerTag,
      warsCounted: counted.length,
      attacksPossible: all.possible,
      attacksUsed: all.used,
      missedAttacks: Math.max(0, all.possible - all.used),
      starsTotal: all.stars,
      threeStars: all.threes,
      avgStars: round(all.avgStars, 2),
      avgDestruction: round(all.avgDestruction, 1),
      threeStarRate: all.used ? round((all.threes / all.used) * 100, 1) : 0,
      recentWars: Math.min(5, counted.length),
      recentAvgStars: round(recent.avgStars, 2),
      previousAvgStars: round(previous.avgStars, 2),
      recentAvgDestruction: round(recent.avgDestruction, 1),
      previousAvgDestruction: round(previous.avgDestruction, 1),
      trend,
    });
  }

  return result.sort((a, b) =>
    a.trend === b.trend
      ? b.recentAvgStars - a.recentAvgStars
      : a.trend === "improving" ? -1 : b.trend === "improving" ? 1 : a.trend === "stable" ? -1 : 1,
  );
}

export async function getPlayerWarHistory(
  clanTag: string,
  playerTag: string,
  limit = 20,
) {
  const tag = normalizeTag(clanTag);
  const wantedPlayerTag = normalizeTag(playerTag);
  const wars = await db
    .select({
      endTime: warArchiveTable.endTime,
      result: warArchiveTable.result,
      opponentName: warArchiveTable.opponentName,
      opponentTag: warArchiveTable.opponentTag,
      clanStars: warArchiveTable.clanStars,
      opponentStars: warArchiveTable.opponentStars,
      members: warArchiveTable.members,
      attacksPerMember: warArchiveTable.attacksPerMember,
      source: warArchiveTable.source,
      state: warArchiveTable.state,
    })
    .from(warArchiveTable)
    .where(eq(warArchiveTable.clanTag, tag))
    .orderBy(desc(warArchiveTable.endTime))
    .limit(Math.min(100, Math.max(1, limit * 2)));

  const recentWars: Dict[] = [];
  let totalAttacks = 0;
  let totalStars = 0;
  let totalDestruction = 0;
  let threeStarAttacks = 0;
  let oneStarOrLess = 0;
  let maxDestruction = 0;
  let missedWars = 0;

  for (const war of wars) {
    if (war.source !== "live" || war.state !== "warEnded") continue;

    const members = Array.isArray(war.members) ? (war.members as Dict[]) : [];
    const member = members.find(
      (candidate) => normalizeTag(str(candidate?.tag)) === wantedPlayerTag,
    );
    if (!member) continue;

    const attacks = Array.isArray(member.attacks) ? (member.attacks as Dict[]) : [];
    const normalizedAttacks = attacks.map((attack) => ({
      stars: num(attack?.stars),
      destructionPercentage: num(attack?.destructionPercentage),
      defenderTag: str(attack?.defenderTag),
      order: num(attack?.order),
    }));

    totalAttacks += normalizedAttacks.length;
    totalStars += normalizedAttacks.reduce((sum, attack) => sum + attack.stars, 0);
    totalDestruction += normalizedAttacks.reduce(
      (sum, attack) => sum + attack.destructionPercentage,
      0,
    );
    threeStarAttacks += normalizedAttacks.filter((attack) => attack.stars >= 3).length;
    oneStarOrLess += normalizedAttacks.filter((attack) => attack.stars <= 1).length;
    maxDestruction = Math.max(
      maxDestruction,
      ...normalizedAttacks.map((attack) => attack.destructionPercentage),
      0,
    );
    if (normalizedAttacks.length === 0) missedWars += 1;

    recentWars.push({
      endTime: war.endTime ?? null,
      result: war.result ?? null,
      opponentName: war.opponentName ?? null,
      opponentTag: war.opponentTag ?? null,
      clanStars: war.clanStars ?? null,
      opponentStars: war.opponentStars ?? null,
      attacks: normalizedAttacks,
      attacksPossible: num(war.attacksPerMember) || 2,
    });

    if (recentWars.length >= limit) break;
  }

  return {
    wars: recentWars.length,
    totalAttacks,
    totalStars,
    averageStarsPerAttack: totalAttacks ? totalStars / totalAttacks : 0,
    averageDestruction: totalAttacks ? totalDestruction / totalAttacks : 0,
    maxDestruction,
    threeStarAttacks,
    oneStarOrLess,
    missedWars,
    recentWars,
  };
}

export async function listPlayerWarStats(clanTag: string) {
  const tag = normalizeTag(clanTag);
  return db
    .select()
    .from(playerWarStatsTable)
    .where(eq(playerWarStatsTable.clanTag, tag))
    .orderBy(desc(sql`${playerWarStatsTable.starsTotal}::float / GREATEST(${playerWarStatsTable.attacksUsed}, 1)`));
}
