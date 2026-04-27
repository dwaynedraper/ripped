/**
 * Cookie name shared between the onboarding server action (which sets it)
 * and the proxy (which reads it).
 *
 * The cookie's value is the user's `clerkUserId`. Why not just a boolean:
 *
 * - **Cross-user pollution self-corrects.** If user A onboards on a shared
 *   browser, signs out, and user B signs in, B's `clerkUserId` won't match
 *   A's cookie value — the proxy treats B as un-onboarded and redirects
 *   to /onboarding. /onboarding then queries the DB authoritatively.
 *
 * - **Forgery is bounded.** A bad actor can set this cookie to any value,
 *   but the worst they get is past the proxy redirect. Server actions and
 *   page-level data fetches still verify against the DB. The cookie is an
 *   optimistic hint, not a security boundary.
 *
 * The cookie is httpOnly (no JS access) and tied to the user's session
 * lifecycle. We don't bother HMAC-signing it for the reasons above and
 * because Web Crypto in Edge runtime adds plumbing for marginal benefit.
 */
export const ONBOARDED_COOKIE = "ripped_onboarded";
