import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ONBOARDED_COOKIE } from "@/lib/onboarded-cookie";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isProfileComplete } from "@/lib/onboarding";

// Routes accessible without authentication.
// The webhook endpoint must be public — Clerk POSTs before any session exists.
// Sign-in / sign-up are public by definition.
// `/` is public so unauthenticated visitors see the landing page.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
]);

// Routes that an *authenticated but not yet onboarded* user can visit without
// being bounced back to /onboarding. Without this list the user would loop
// forever on the redirect to /onboarding.
const isOnboardingExempt = createRouteMatcher([
  "/onboarding(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // ── Auth gate ─────────────────────────────────────────────────────────────
  // Unauthenticated users get public routes only. Everything else → /sign-in.
  if (!userId) {
    if (isPublicRoute(req)) return;
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // ── Onboarding gate ──────────────────────────────────────────────────────
  // Authenticated users who haven't finished onboarding get redirected to
  // /onboarding on every route except the exempt ones. The cookie value must
  // match the current userId — see src/lib/onboarded-cookie.ts for why.
  if (!isOnboardingExempt(req)) {
    const cookie = req.cookies.get(ONBOARDED_COOKIE);
    if (cookie?.value !== userId) {
      // Optimistic check failed; verify authoritative state in DB.
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.clerkUserId, userId));

      if (!user || !isProfileComplete(user)) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }

      // User is fully onboarded but the cookie was missing/invalid.
      // Set the cookie now so subsequent requests can skip the DB query.
      const res = NextResponse.next();
      res.cookies.set(ONBOARDED_COOKIE, userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
      return res;
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
