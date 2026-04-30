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
  "/design(.*)",
]);

// Routes that an *authenticated but not yet onboarded* user can visit without
// being bounced back to /onboarding. Without this list the user would loop
// forever on the redirect to /onboarding.
const isOnboardingExempt = createRouteMatcher([
  "/onboarding(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
  "/design(.*)",
]);

// Detect whether the request is for the admin surface (ADR-0028).
// Reads ADMIN_HOSTNAME at request time (not module load) so the value is
// always fresh and testable without restarting the server.
function isAdminRequest(req: Request): boolean {
  const host = req.headers.get("host") ?? "";
  const adminHostname = process.env.ADMIN_HOSTNAME ?? "admin.rippedorstamped.com";
  return host === adminHostname || host.startsWith("admin.");
}

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // ── Admin surface gate ────────────────────────────────────────────────────
  // Admin requests from unauthenticated users go straight to /sign-in.
  // Staff role check is enforced per-layout/per-action inside /admin — the
  // proxy only handles the unauthenticated case here.
  if (isAdminRequest(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
    return;
  }

  // ── Auth gate (public site) ───────────────────────────────────────────────
  if (!userId) {
    if (isPublicRoute(req)) return;
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // ── Onboarding gate ───────────────────────────────────────────────────────
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
