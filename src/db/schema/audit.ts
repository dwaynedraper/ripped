import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

// Append-only. Rows are never updated or deleted — see ADR-0014.
// Logs: role/tier transitions, panel flag grants, challenge approvals,
// account deletions. Does NOT log logins, standard votes, or page views.
export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  // null when the action was taken by the system (e.g. Clerk webhook)
  actorUserId: uuid("actor_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  targetUserId: uuid("target_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  // Freeform payload — store whatever context makes the event self-contained
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
