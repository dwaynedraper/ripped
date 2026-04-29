import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, votes, polls, pollOptions } from "@/db/schema";
import { awardPoint } from "@/lib/points";

/**
 * Compute vote weight from contribution points.
 * Stepped brackets per ADR-0021 and roles-and-ranks.md §6.
 */
export function computeVotingPower(contributionPoints: number): number {
  if (contributionPoints >= 100) return 5;
  if (contributionPoints >= 60) return 4;
  if (contributionPoints >= 30) return 3;
  if (contributionPoints >= 10) return 2;
  return 1;
}

/**
 * Cast a vote for a poll option.
 *
 * Throws:
 * - 403 if the user is super-admin (Axiom 2 — the Architect cannot vote)
 * - 409 if the user already voted in this poll
 * - 400 if the poll is not currently open
 */
export async function castVote(userId: string, pollOptionId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Response("User not found", { status: 404 });

  if (user.staffRole === "super_admin") {
    throw new Response("The Architect cannot vote", { status: 403 });
  }

  const [option] = await db
    .select()
    .from(pollOptions)
    .where(eq(pollOptions.id, pollOptionId));
  if (!option) throw new Response("Poll option not found", { status: 404 });

  const [poll] = await db
    .select()
    .from(polls)
    .where(eq(polls.id, option.pollId));
  if (!poll) throw new Response("Poll not found", { status: 404 });

  const now = new Date();
  if (now < poll.opensAt || now > poll.closesAt || poll.closedAt) {
    throw new Response("Poll is not open", { status: 400 });
  }

  const existingVote = await db
    .select({ id: votes.id })
    .from(votes)
    .innerJoin(pollOptions, eq(votes.pollOptionId, pollOptions.id))
    .where(
      and(
        eq(votes.userId, userId),
        eq(pollOptions.pollId, poll.id),
      ),
    )
    .limit(1);

  if (existingVote.length > 0) {
    throw new Response("Already voted in this poll", { status: 409 });
  }

  const weight = computeVotingPower(user.contributionPoints);

  const [vote] = await db
    .insert(votes)
    .values({ userId, pollOptionId, weight })
    .returning();

  const actionId =
    poll.pollType === "paper_selection"
      ? "vote.paper_selection"
      : "vote.challenge_selection";
  await awardPoint(userId, actionId, poll.id);

  return vote;
}

/**
 * Tally a poll's results, sorted by weighted total desc.
 * Ties broken by earliest createdAt per ADR-0022.
 */
export async function tallyPoll(pollId: string) {
  return db
    .select({
      optionId: pollOptions.id,
      label: pollOptions.label,
      createdAt: pollOptions.createdAt,
      weightedTotal: sql<number>`COALESCE(SUM(${votes.weight}), 0)`.as("weighted_total"),
      voteCount: sql<number>`COUNT(${votes.id})`.as("vote_count"),
    })
    .from(pollOptions)
    .leftJoin(votes, eq(votes.pollOptionId, pollOptions.id))
    .where(eq(pollOptions.pollId, pollId))
    .groupBy(pollOptions.id, pollOptions.label, pollOptions.createdAt)
    .orderBy(
      sql`COALESCE(SUM(${votes.weight}), 0) DESC`,
      sql`${pollOptions.createdAt} ASC`,
    );
}

/**
 * Close a poll and return the tally with the winner.
 */
export async function closePoll(pollId: string) {
  await db
    .update(polls)
    .set({ closedAt: new Date() })
    .where(eq(polls.id, pollId));

  const results = await tallyPoll(pollId);
  const winner = results[0];

  return { results, winner };
}
