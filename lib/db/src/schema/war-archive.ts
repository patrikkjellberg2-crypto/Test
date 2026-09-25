import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * One row per war for a given clan. `warKey` identifies the war
 * (clan tag + opponent tag + end time) so the same war is never stored
 * twice, even if it is captured again while still running.
 */
export const warArchiveTable = pgTable(
  "war_archive",
  {
    id: text("id").primaryKey(), // warKey
    clanTag: text("clan_tag").notNull(),
    clanName: text("clan_name"),
    opponentTag: text("opponent_tag").notNull(),
    opponentName: text("opponent_name"),
    state: text("state").notNull(), // preparation | inWar | warEnded
    result: text("result"), // win | lose | tie | ""
    teamSize: integer("team_size").notNull().default(0),
    attacksPerMember: integer("attacks_per_member").notNull().default(2),
    startTime: text("start_time"),
    endTime: text("end_time").notNull(),
    clanStars: integer("clan_stars").notNull().default(0),
    clanDestruction: real("clan_destruction").notNull().default(0),
    clanAttacksUsed: integer("clan_attacks_used").notNull().default(0),
    opponentStars: integer("opponent_stars").notNull().default(0),
    opponentDestruction: real("opponent_destruction").notNull().default(0),
    // Full member + opponent rosters with per-attack detail, as returned by
    // the Clash API. Kept as-is so nothing is lost even as the UI evolves.
    members: jsonb("members").notNull().default([]),
    opponentMembers: jsonb("opponent_members").notNull().default([]),
    source: text("source").notNull().default("live"), // live | warlog
    firstCapturedAt: timestamp("first_captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    byClan: index("war_archive_clan_idx").on(table.clanTag, table.endTime),
  }),
);

export type WarArchiveRow = typeof warArchiveTable.$inferSelect;
export type InsertWarArchiveRow = typeof warArchiveTable.$inferInsert;

/**
 * Per-player rollup, updated whenever a war is (re)captured. Makes
 * "player performance over time" a simple indexed lookup instead of
 * scanning every war's JSON on every request.
 */
export const playerWarStatsTable = pgTable(
  "player_war_stats",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    clanTag: text("clan_tag").notNull(),
    playerTag: text("player_tag").notNull(),
    playerName: text("player_name").notNull(),
    warsCounted: integer("wars_counted").notNull().default(0),
    attacksPossible: integer("attacks_possible").notNull().default(0),
    attacksUsed: integer("attacks_used").notNull().default(0),
    starsTotal: integer("stars_total").notNull().default(0),
    threeStars: integer("three_stars").notNull().default(0),
    destructionTotal: real("destruction_total").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    clanPlayerUnique: unique("player_war_stats_clan_player_unique").on(
      table.clanTag,
      table.playerTag,
    ),
  }),
);

export type PlayerWarStatsRow = typeof playerWarStatsTable.$inferSelect;

/**
 * One row per (clan, day): how many AI calls were made. Used for the
 * per-clan half of the AI rate limiting, so limits survive a server
 * restart (the in-memory per-IP limiter does not, and that is fine for
 * short bursts, but the daily budget should).
 */
export const aiUsageTable = pgTable(
  "ai_usage",
  {
    day: text("day").notNull(), // YYYY-MM-DD (UTC)
    scope: text("scope").notNull(), // "global" or a clan tag
    count: integer("count").notNull().default(0),
  },
  (table) => ({
    dayScopeUnique: unique("ai_usage_day_scope_unique").on(table.day, table.scope),
  }),
);

export type AiUsageRow = typeof aiUsageTable.$inferSelect;
