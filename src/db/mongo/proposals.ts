import { z } from "zod";
import { getMongoDb } from "../mongo";

export const proposalStatusEnum = z.enum(["draft", "submitted", "published", "rejected"]);
export const proposalTypeEnum = z.enum(["paper", "challenge"]);

export const proposalSchema = z.object({
  type: proposalTypeEnum,
  status: proposalStatusEnum,
  authorUserId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().max(5000),
  // Paper-specific
  paperName: z.string().optional(),
  manufacturer: z.string().optional(),
  // Challenge-specific
  benchmarkText: z.string().optional(),
  trapText: z.string().optional(),
  // Lifecycle timestamps
  submittedAt: z.date().nullable().optional(),
  publishedAt: z.date().nullable().optional(),
  publishedByUserId: z.string().uuid().nullable().optional(),
  rejectedAt: z.date().nullable().optional(),
  rejectedByUserId: z.string().uuid().nullable().optional(),
  rejectionReason: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Proposal = z.infer<typeof proposalSchema>;

export async function getProposalsCollection() {
  const db = await getMongoDb();
  return db.collection<Proposal>("proposals");
}
