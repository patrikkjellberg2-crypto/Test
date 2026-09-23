import { integer, jsonb, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const playerWarHistoryTable = pgTable(
  "player_war_history",
  {
    id: serial("id").primaryKey(),
    warKey: text("war_key").notNull(),
    attackerTag: text("attacker_tag").notNull(),
    attackerName: text("attacker_name").notNull(),
    opponentName: text("opponent_name"),
    result: text("result"),
    warEndTime: text("war_end_time"),
    townhallLevel: integer("townhall_level"),
    attacks: jsonb("attacks").notNull().default([]),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    warPlayerUnique: unique("player_war_history_war_player_unique").on(table.warKey, table.attackerTag),
  }),
);

export type PlayerWarHistory = typeof playerWarHistoryTable.$inferSelect;
