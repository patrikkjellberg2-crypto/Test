import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const clanSelectionTable = pgTable("clan_selection", {
  id: integer("id").primaryKey().default(1),
  clanTag: text("clan_tag").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertClanSelectionSchema = createInsertSchema(
  clanSelectionTable,
).omit({
  updatedAt: true,
});

export type InsertClanSelection = z.infer<typeof insertClanSelectionSchema>;
export type ClanSelection = typeof clanSelectionTable.$inferSelect;