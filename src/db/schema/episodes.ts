import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const episodeStatusEnum = pgEnum("episode_status", [
  "paper_selected",
  "challenge_selected",
  "in_production",
  "bar_reviewed",
  "verdict_cast",
  "archived",
]);

export const verdictEnum = pgEnum("verdict", ["stamped", "ripped"]);

export const episodes = pgTable("episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  episodeNumber: integer("episode_number").notNull().unique(),
  status: episodeStatusEnum("status").notNull().default("paper_selected"),
  verdict: verdictEnum("verdict"),
  // No FK refs to papers/challenges — avoids circular dependency (papers/challenges → episodes).
  // Application code enforces referential integrity for these two fields.
  selectedPaperId: uuid("selected_paper_id"),
  selectedChallengeId: uuid("selected_challenge_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type Episode = typeof episodes.$inferSelect;
export type NewEpisode = typeof episodes.$inferInsert;
