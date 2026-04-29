import { integer, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { pollOptions } from "./polls";

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  pollOptionId: uuid("poll_option_id").notNull().references(() => pollOptions.id),
  weight: integer("weight").notNull(),
  castedAt: timestamp("casted_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // DB enforces uniqueness per (user, poll_option).
  // One-vote-per-poll across all options is enforced in application code — see ADR-0034.
  unique("votes_user_poll_option_unique").on(t.userId, t.pollOptionId),
]);

export type Vote = typeof votes.$inferSelect;
