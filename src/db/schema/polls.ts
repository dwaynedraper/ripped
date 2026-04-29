import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { episodes } from "./episodes";

export const pollTypeEnum = pgEnum("poll_type", [
  "paper_selection",
  "challenge_selection",
]);

export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  episodeId: uuid("episode_id").notNull().references(() => episodes.id),
  pollType: pollTypeEnum("poll_type").notNull(),
  opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pollOptions = pgTable("poll_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id").notNull().references(() => polls.id),
  optionReferenceId: uuid("option_reference_id").notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Poll = typeof polls.$inferSelect;
export type PollOption = typeof pollOptions.$inferSelect;
