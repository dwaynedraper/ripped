import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { episodes } from "./episodes";

export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  benchmarkText: text("benchmark_text").notNull(),
  trapText: text("trap_text").notNull(),
  episodeId: uuid("episode_id").references(() => episodes.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Challenge = typeof challenges.$inferSelect;
