import { describe, it, expect, afterEach } from "vitest";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, pointAwards } from "@/db/schema";
import { awardPoint } from "@/lib/points";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createTestUser() {
  const [user] = await db
    .insert(users)
    .values({
      clerkUserId: `test-clerk-${crypto.randomUUID()}`,
      email: `test-${crypto.randomUUID()}@example.com`,
    })
    .returning();
  return user;
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

const createdUserIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length) {
    await db.delete(pointAwards).execute();
    for (const id of createdUserIds) {
      await db.delete(users).where(eq(users.id, id));
    }
    createdUserIds.length = 0;
  }
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("awardPoint — integration", () => {
  it("awardPoint increments contribution_points by 1", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);

    await awardPoint(user.id, "vote.paper_selection", "poll-abc");

    const [updated] = await db
      .select({ contributionPoints: users.contributionPoints })
      .from(users)
      .where(eq(users.id, user.id));

    expect(updated.contributionPoints).toBe(1);
  });

  it("awardPoint returns false on duplicate (rate-limited)", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);

    await awardPoint(user.id, "vote.paper_selection", "poll-abc");
    const second = await awardPoint(user.id, "vote.paper_selection", "poll-abc");

    expect(second).toBe(false);
  });

  it("duplicate awardPoint does NOT increment contribution_points", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);

    await awardPoint(user.id, "vote.paper_selection", "poll-abc");
    await awardPoint(user.id, "vote.paper_selection", "poll-abc");

    const [updated] = await db
      .select({ contributionPoints: users.contributionPoints })
      .from(users)
      .where(eq(users.id, user.id));

    expect(updated.contributionPoints).toBe(1);
  });

  it("contribution_points can never go below zero (CHECK constraint)", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);

    await expect(
      db
        .update(users)
        .set({ contributionPoints: sql`${users.contributionPoints} - 1` })
        .where(eq(users.id, user.id)),
    ).rejects.toThrow();
  });
});
