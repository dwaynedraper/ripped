import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const pointAwards = pgTable("point_awards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  actionId: text("action_id").notNull(),
  targetId: text("target_id"),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Rate limit: one point per user per action per target — see ADR-0033.
  unique("point_awards_rate_limit").on(t.userId, t.actionId, t.targetId),
]);

export type PointAward = typeof pointAwards.$inferSelect;
