import { boolean, integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const warPlannerAssignmentsTable = pgTable(
  "war_planner_assignments",
  {
    id: serial("id").primaryKey(),
    warKey: text("war_key").notNull(),
    attackerTag: text("attacker_tag").notNull(),
    assignedTargetMapPosition: integer("assigned_target_map_position"),
    locked: boolean("locked").notNull().default(false),
    completed: boolean("completed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    warAttackerUnique: unique("war_planner_war_attacker_unique").on(
      table.warKey,
      table.attackerTag,
    ),
  }),
);

export const insertWarPlannerAssignmentSchema = createInsertSchema(
  warPlannerAssignmentsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWarPlannerAssignment = z.infer<
  typeof insertWarPlannerAssignmentSchema
>;
export type WarPlannerAssignment =
  typeof warPlannerAssignmentsTable.$inferSelect;