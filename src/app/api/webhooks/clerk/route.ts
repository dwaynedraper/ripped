import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type {
  UserJSON,
  WebhookEvent,
  WebhookEventType,
} from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
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
