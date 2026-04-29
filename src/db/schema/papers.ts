import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { episodes } from "./episodes";

export const papers = pgTable("papers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  manufacturer: text("manufacturer"),
  description: text("description"),
  episodeId: uuid("episode_id").references(() => episodes.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Paper = typeof papers.$inferSelect;
