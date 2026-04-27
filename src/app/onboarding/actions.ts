"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { auditEvents, users } from "@/db/schema";
import {
  onboardingSchema,
  type OnboardingFieldErrors,
  type OnboardingInput,
  type OnboardingResult,
} from "./schema";

/**
 * Completes the second phase of sign-up (see ADR-0023).
 *
 * Flow:
 *   1. Auth check — Clerk session must exist.
 *   2. Validate against `onboardingSchema`.
 *   3. Transactionally: update the users row + insert audit event.
 *   4. Catch unique-constraint violations on display_name → field error.
 *   5. Redirect to / on success.
 *
 * Errors are returned as a discriminated union (`OnboardingResult`) so the
 * form can render them inline. The form itself lives in form.tsx (Step 4).
 */
export async function completeOnboarding(
  input: OnboardingInput,
): Promise<OnboardingResult> {
  const { userId } = await auth();
  if (!userId) {
    // The proxy gates /onboarding to authenticated users, so this branch
    // should be unreachable in practice. Defense-in-depth: server actions
    // can be called directly, never trust upstream protection alone.
    return { success: false, errors: { _form: "Not authenticated" } };
  }

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errors: flattenZodErrors(parsed.error.flatten().fieldErrors),
    };
  }

  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(users)
        .set({
          displayName: parsed.data.displayName,
          countryCode: parsed.data.countryCode,
          cityName: parsed.data.cityName,
          cityState: parsed.data.cityState,
          googlePlaceId: parsed.data.googlePlaceId,
          timezone: parsed.data.timezone,
        })
        .where(eq(users.clerkUserId, userId))
        .returning({ id: users.id });

      if (updated.length === 0) {
        // No row matched — the Clerk webhook hasn't created the user record
        // yet (race) or the row was deleted. Roll back; surface to the user.
        throw new MissingUserRowError();
      }

      await tx.insert(auditEvents).values({
        eventType: "profile.onboarded",
        actorUserId: updated[0].id,
        targetUserId: updated[0].id,
        // Payload intentionally minimal — audit logs the *fact* of the
        // transition, not the data (see ADR-0014, identity-model.md §6).
        payload: null,
      });
    });
  } catch (error) {
    if (error instanceof MissingUserRowError) {
      return {
        success: false,
        errors: {
          _form:
            "We couldn't find your account record. Please refresh and try again.",
        },
      };
    }
    if (isDisplayNameConflict(error)) {
      return {
        success: false,
        errors: { displayName: "This display name is already taken" },
      };
    }
    throw error;
  }

  // redirect() throws — must be outside the try/catch so the redirect
  // exception isn't swallowed.
  redirect("/");
}

// ─── Internals ────────────────────────────────────────────────────────────────

class MissingUserRowError extends Error {}

/**
 * Detects Postgres unique-constraint violations on `users_display_name_unique`.
 * The error shape comes from @neondatabase/serverless (which mirrors `pg`):
 * - `code` is SQLSTATE; '23505' = unique_violation.
 * - `constraint` is the name of the violated constraint.
 */
function isDisplayNameConflict(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const err = error as { code?: unknown; constraint?: unknown };
  return err.code === "23505" && err.constraint === "users_display_name_unique";
}

/**
 * Zod's flatten() returns `{ field: string[] | undefined }`. Our form renders
 * one message per field — flatten to the first message.
 */
function flattenZodErrors(
  fieldErrors: Record<string, string[] | undefined>,
): OnboardingFieldErrors {
  const result: OnboardingFieldErrors = {};
  for (const [key, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) {
      result[key as keyof OnboardingFieldErrors] = messages[0];
    }
  }
  return result;
}
