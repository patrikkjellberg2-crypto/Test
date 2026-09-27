import { index, integer, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const capitalRaidArchiveTable = pgTable(
  "capital_raid_archive",
  {
    id: text("id").primaryKey(),
    clanTag: text("clan_tag").notNull(),
    clanName: text("clan_name"),
    leagueName: text("league_name"),
    startTime: text("start_time"),
    endTime: text("end_time").notNull(),
    state: text("state"),
    capitalTotalLoot: integer("capital_total_loot").notNull().default(0),
    raidsCompleted: integer("raids_completed").notNull().default(0),
    offensiveReward: integer("offensive_reward").notNull().default(0),
    defensiveReward: integer("defensive_reward").notNull().default(0),
    members: jsonb("members").notNull().default([]),
    raw: jsonb("raw").notNull().default({}),
    firstCapturedAt: timestamp("first_captured_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => ({
    clanTimeIdx: index("capital_raid_archive_clan_time_idx").on(table.clanTag, table.endTime),
    clanSeasonUnique: unique("capital_raid_archive_clan_season_unique").on(table.clanTag, table.endTime),
  }),
);

export type CapitalRaidArchiveRow = typeof capitalRaidArchiveTable.$inferSelect;
export type InsertCapitalRaidArchiveRow = typeof capitalRaidArchiveTable.$inferInsert;
