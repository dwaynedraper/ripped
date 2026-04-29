import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { pointAwards, users } from "@/db/schema";

/**
 * Award one contribution point for a specific action on a target.
 * Uses ON CONFLICT DO NOTHING for rate limiting — one point per (user, action, target).
 * Returns true if the point was awarded, false if it was a duplicate.
 */
export async function awardPoint(
  userId: string,
  actionId: string,
  targetId: string | null,
): Promise<boolean> {
  const result = await db
    .insert(pointAwards)
    .values({ userId, actionId, targetId })
    .onConflictDoNothing({
      target: [pointAwards.userId, pointAwards.actionId, pointAwards.targetId],
    })
    .returning({ id: pointAwards.id });

  if (result.length === 0) return false;

  await db
    .update(users)
    .set({ contributionPoints: sql`${users.contributionPoints} + 1` })
    .where(eq(users.id, userId));

  return true;
}
