// dotenv.config() must be called before any module that reads process.env at
// evaluation time. In compiled CJS, all require() calls are hoisted above
// module body statements, so DATABASE_URL will be set by the time the fixture
// function body runs — which is when `new Pool(...)` is called.
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { test as base, type Page } from "@playwright/test";
import { clerk } from "@clerk/testing/playwright";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { eq } from "drizzle-orm";
// Relative imports — @/ aliases are Next.js/TypeScript-only and don't resolve
// in Playwright's Node.js worker without additional tsconfig setup.
import { users } from "../../src/db/schema/users";

neonConfig.webSocketConstructor = ws;

// ─── Fixtures ────────────────────────────────────────────────────────────────

type E2EFixtures = {
  /**
   * A page already signed in as the dedicated E2E test user and sitting at
   * /onboarding with all onboarding fields reset to null.
   *
   * Prerequisites (one-time setup — not automated):
   *  1. Create a user in Clerk with the email in E2E_TEST_USER_EMAIL.
   *  2. Sign up through the app once so the Clerk webhook creates the
   *     corresponding users row in Postgres.
   *  3. Set E2E_TEST_USER_EMAIL in .env.local.
   *
   * The fixture resets onboarding fields before each test, so state from a
   * previous run never bleeds through. No cleanup after the test is needed.
   */
  onboardingPage: Page;
};

export const test = base.extend<E2EFixtures>({
  onboardingPage: async ({ page }, provide) => {
    // Navigate to /sign-in so Clerk's JS is loaded in the page before we call
    // clerk.signIn(). clerk.signIn() waits for window.Clerk.loaded internally.
    await page.goto("/sign-in");

    // Programmatically sign in without touching any UI. clerk.signIn() also
    // calls setupClerkTestingToken() internally — no separate call needed.
    await clerk.signIn({
      page,
      emailAddress: process.env.E2E_TEST_USER_EMAIL!,
    });

    // Reset onboarding fields so isProfileComplete() returns false.
    // This ensures the onboarding page renders the form regardless of the state
    // left by a previous test run.
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
    const db = drizzle({ client: pool, schema: { users } });

    await db
      .update(users)
      .set({
        displayName: null,
        countryCode: null,
        cityName: null,
        cityState: null,
        googlePlaceId: null,
        timezone: null,
      })
      .where(eq(users.email, process.env.E2E_TEST_USER_EMAIL!));

    // /onboarding is in isOnboardingExempt — the proxy gate does not redirect
    // away from it. The page itself reads the DB and renders the form because
    // the fields above are now null.
    await page.goto("/onboarding");

    await provide(page);

    await pool.end();
  },
});

export { expect } from "@playwright/test";
