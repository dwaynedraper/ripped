import "server-only";
import { db } from "@/db";
import { auditEvents } from "@/db/schema";

type LogEventParams = {
  eventType: string;
  actorUserId?: string | null;
  targetUserId?: string | null;
  payload?: Record<string, unknown>;
};

// Insert an audit event. Call this in the same transaction as the state change
// it records — see ADR-0014.
export async function logEvent({
  eventType,
  actorUserId = null,
  targetUserId = null,
  payload = {},
}: LogEventParams) {
  await db.insert(auditEvents).values({
    eventType,
    actorUserId,
    targetUserId,
    payload,
  });
}
