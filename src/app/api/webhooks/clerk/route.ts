import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type {
  UserJSON,
  WebhookEvent,
  WebhookEventType,
} from "@clerk/nextjs/server";
import { count, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users, auditEvents } from "@/db/schema";
import { env } from "@/env";

export async function POST(req: NextRequest) {
  let evt: WebhookEvent;

  try {
    evt = await verifyWebhook(req, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    });
  } catch {
    return new Response("Webhook verification failed", { status: 400 });
  }

  const type = evt.type as WebhookEventType;

  if (type === "user.created" || type === "user.updated") {
    const data = evt.data as UserJSON;
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id,
    );
    if (!primaryEmail) return new Response(null, { status: 200 });

    if (type === "user.created") {
      await db.insert(users).values({
        clerkUserId: data.id,
        email: primaryEmail.email_address,
        // display_name, country_code, city_name, timezone are null until onboarding
      });

      // ── Super-admin bootstrap (runs once ever — see ADR-0029) ──────────────
      if (primaryEmail.email_address === env.SUPER_ADMIN_EMAIL) {
        const [{ count: superAdminCount }] = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.staffRole, "super_admin"));

        if (superAdminCount === 0) {
          await db
            .update(users)
            .set({ staffRole: "super_admin" })
            .where(eq(users.clerkUserId, data.id));

          const [newUser] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.clerkUserId, data.id));

          if (newUser) {
            await db.insert(auditEvents).values({
              eventType: "staff.super_admin_bootstrapped",
              targetUserId: newUser.id,
              payload: { email: primaryEmail.email_address },
            });
          }
        }
      }

      // ── Staff invitation metadata ──────────────────────────────────────────
      const metadata = data.public_metadata as {
        staffRole?: string;
        invitedByUserId?: string;
      } | undefined;

      if (metadata?.staffRole && metadata?.invitedByUserId) {
        const [inviter] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, metadata.invitedByUserId));

        if (inviter) {
          await db
            .update(users)
            .set({
              staffRole: metadata.staffRole as "content_creator" | "admin",
              invitedByUserId: inviter.id,
              invitedAt: new Date(),
            })
            .where(eq(users.clerkUserId, data.id));
        }
      }
    } else {
      await db
        .update(users)
        .set({ email: primaryEmail.email_address })
        .where(eq(users.clerkUserId, data.id));
    }
  }

  if (type === "user.deleted") {
    const id = (evt.data as { id?: string }).id;
    if (!id) return new Response(null, { status: 200 });

    // Anonymize — votes remain counted but unlinked. See identity-model.md §7.
    await db
      .update(users)
      .set({
        email: `deleted-${id}@deleted.invalid`,
        displayName: null,
        firstName: null,
        lastName: null,
        bio: null,
        avatarUrl: null,
        billingName: null,
        billingAddress: null,
        phone: null,
      })
      .where(eq(users.clerkUserId, id));
  }

  return new Response(null, { status: 200 });
}
