import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isProfileComplete } from "@/lib/onboarding";

/**
 * Onboarding page — Phase 2 of sign-up (see ADR-0023).
 *
 * Loads after Clerk creates the account and routes:
 *   - Unauthenticated → /sign-in (defense-in-depth; the proxy already does this)
 *   - Already onboarded → / (don't make completed users see the form again)
 *   - Webhook hasn't fired yet → render a "still setting up" message
 *   - Otherwise → render the onboarding form
 *
 * Step 4 will replace the placeholder below with the real <OnboardingForm />.
 */
export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const [user] = await db
    .select({
      displayName: users.displayName,
      countryCode: users.countryCode,
      cityName: users.cityName,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.clerkUserId, userId));

  if (!user) {
    // The Clerk webhook hasn't created our row yet. Rare but possible —
    // sign-up redirects to /onboarding fast enough to occasionally beat
    // the webhook. Show a polite message; the user can refresh.
    return (
      <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">Just a moment…</h1>
          <p className="text-zinc-400">
            We&rsquo;re finishing setting up your account. Refresh the page in
            a few seconds.
          </p>
        </div>
      </main>
    );
  }

  if (isProfileComplete(user)) {
    redirect("/");
  }

  // TODO (Step 4): replace placeholder with <OnboardingForm />.
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold">Welcome.</h1>
        <p className="text-zinc-400">
          The onboarding form will appear here in the next step.
        </p>
      </div>
    </main>
  );
}
