import { describe, it, expect, afterEach, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, auditEvents } from "@/db/schema";

// Bypass Clerk's signature verification — we're testing handler logic, not Clerk's crypto.
vi.mock("@clerk/nextjs/webhooks", () => ({
  verifyWebhook: vi.fn().mockImplementation(async (req: Request) => req.json()),
}));

// Import the handler after the mock is set up.
const { POST } = await import("@/app/api/webhooks/clerk/route");

const TEST_CLERK_ID = "test_clerk_webhook_user_" + Date.now();
const TEST_EMAIL = `webhook-test-${Date.now()}@example.com`;

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/webhooks/clerk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function userCreatedPayload(overrides: Record<string, unknown> = {}) {
  return {
    type: "user.created",
    data: {
      id: TEST_CLERK_ID,
      email_addresses: [{ id: "ea_1", email_address: TEST_EMAIL }],
      primary_email_address_id: "ea_1",
      public_metadata: {},
      ...overrides,
    },
  };
}

afterEach(async () => {
  await db.delete(auditEvents).where(eq(auditEvents.payload, { email: TEST_EMAIL } as unknown as typeof auditEvents.payload));
  await db.delete(users).where(eq(users.clerkUserId, TEST_CLERK_ID));
});

describe("Clerk webhook handler", () => {
  it("user.created inserts row with clerk_user_id and email", async () => {
    const res = await POST(makeRequest(userCreatedPayload()) as never);
    expect(res.status).toBe(200);

    const [row] = await db.select().from(users).where(eq(users.clerkUserId, TEST_CLERK_ID));
    expect(row).toBeDefined();
    expect(row.email).toBe(TEST_EMAIL);
    expect(row.staffRole).toBeNull();
  });

  it("user.created with SUPER_ADMIN_EMAIL bootstraps super_admin", async () => {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL!;
    const superClerkId = "test_super_admin_bootstrap_" + Date.now();
    const superEmail = superAdminEmail;

    // Temporarily override clerk id for this test
    const payload = {
      type: "user.created",
      data: {
        id: superClerkId,
        email_addresses: [{ id: "ea_super", email_address: superEmail }],
        primary_email_address_id: "ea_super",
        public_metadata: {},
      },
    };

    const res = await POST(makeRequest(payload) as never);
    expect(res.status).toBe(200);

    const [row] = await db.select().from(users).where(eq(users.clerkUserId, superClerkId));
    expect(row?.staffRole).toBe("super_admin");

    const [event] = await db
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.eventType, "staff.super_admin_bootstrapped"));
    expect(event).toBeDefined();

    // Cleanup
    await db.delete(auditEvents).where(eq(auditEvents.eventType, "staff.super_admin_bootstrapped"));
    await db.delete(users).where(eq(users.clerkUserId, superClerkId));
  });

  it("user.created with invitation metadata sets staff_role", async () => {
    // First create an inviter user
    const [inviter] = await db
      .insert(users)
      .values({ clerkUserId: "test_inviter_" + Date.now(), email: "inviter@example.com" })
      .returning();

    const payload = userCreatedPayload({
      public_metadata: { staffRole: "content_creator", invitedByUserId: inviter.id },
    });

    const res = await POST(makeRequest(payload) as never);
    expect(res.status).toBe(200);

    const [row] = await db.select().from(users).where(eq(users.clerkUserId, TEST_CLERK_ID));
    expect(row?.staffRole).toBe("content_creator");
    expect(row?.invitedByUserId).toBe(inviter.id);

    // Cleanup inviter
    await db.delete(users).where(eq(users.id, inviter.id));
  });

  it("user.deleted anonymizes but preserves the row", async () => {
    // Insert a user to delete
    await db.insert(users).values({
      clerkUserId: TEST_CLERK_ID,
      email: TEST_EMAIL,
      displayName: "ToDelete",
    });

    const payload = { type: "user.deleted", data: { id: TEST_CLERK_ID } };
    const res = await POST(makeRequest(payload) as never);
    expect(res.status).toBe(200);

    const [row] = await db.select().from(users).where(eq(users.clerkUserId, TEST_CLERK_ID));
    expect(row).toBeDefined(); // row preserved
    expect(row.email).toMatch(/deleted/);
    expect(row.displayName).toBeNull();
  });
});
