import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, episodes, polls, pollOptions, votes, pointAwards } from "@/db/schema";
import { castVote } from "@/lib/voting";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function createTestUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const [user] = await db
    .insert(users)
    .values({
      clerkUserId: `test-clerk-${crypto.randomUUID()}`,
      email: `test-${crypto.randomUUID()}@example.com`,
      ...overrides,
    })
    .returning();
  return user;
}

async function createOpenPoll() {
  const [episode] = await db
    .insert(episodes)
    .values({ title: "Test Episode", episodeNumber: Math.floor(Math.random() * 900000) + 100000 })
    .returning();

  const now = new Date();
  const [poll] = await db
    .insert(polls)
    .values({
      episodeId: episode.id,
      pollType: "paper_selection",
      opensAt: new Date(now.getTime() - 60_000),
      closesAt: new Date(now.getTime() + 60_000 * 60),
    })
    .returning();

  const [option] = await db
    .insert(pollOptions)
    .values({ pollId: poll.id, optionReferenceId: crypto.randomUUID(), label: "Test Paper" })
    .returning();

  return { episode, poll, option };
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

const createdUserIds: string[] = [];
const createdEpisodeIds: string[] = [];

afterEach(async () => {
  if (createdUserIds.length) {
    await db.delete(votes).execute();
    await db.delete(pointAwards).execute();
    for (const id of createdUserIds) {
      await db.delete(users).where(eq(users.id, id));
    }
    createdUserIds.length = 0;
  }
  if (createdEpisodeIds.length) {
    await db.delete(pollOptions).execute();
    await db.delete(polls).execute();
    for (const id of createdEpisodeIds) {
      await db.delete(episodes).where(eq(episodes.id, id));
    }
    createdEpisodeIds.length = 0;
  }
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("castVote — integration", () => {
  it("castVote as super_admin throws 403", async () => {
    const user = await createTestUser({ staffRole: "super_admin" });
    createdUserIds.push(user.id);
    const { episode, option } = await createOpenPoll();
    createdEpisodeIds.push(episode.id);

    await expect(castVote(user.id, option.id)).rejects.toMatchObject({ status: 403 });
  });

  it("castVote on closed poll throws 400", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);

    const [episode] = await db
      .insert(episodes)
      .values({ title: "Closed Episode", episodeNumber: Math.floor(Math.random() * 900000) + 100000 })
      .returning();
    createdEpisodeIds.push(episode.id);

    const now = new Date();
    const [poll] = await db
      .insert(polls)
      .values({
        episodeId: episode.id,
        pollType: "paper_selection",
        opensAt: new Date(now.getTime() - 7200_000),
        closesAt: new Date(now.getTime() - 3600_000),
      })
      .returning();

    const [option] = await db
      .insert(pollOptions)
      .values({ pollId: poll.id, optionReferenceId: crypto.randomUUID(), label: "Old Paper" })
      .returning();

    await expect(castVote(user.id, option.id)).rejects.toMatchObject({ status: 400 });
  });

  it("castVote duplicate on same poll throws 409", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    const { episode, option } = await createOpenPoll();
    createdEpisodeIds.push(episode.id);

    await castVote(user.id, option.id);
    await expect(castVote(user.id, option.id)).rejects.toMatchObject({ status: 409 });
  });
});
