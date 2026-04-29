import { clerkSetup } from "@clerk/testing/playwright";
import dotenv from "dotenv";
import path from "path";

// Load .env.local for this main process. Workers inherit the resulting
// process.env at spawn time, so they'll have DATABASE_URL, CLERK_SECRET_KEY,
// and CLERK_TESTING_TOKEN (set by clerkSetup below) without needing their own
// dotenv call for those specific vars.
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

export default async function globalSetup() {
  // Fetches CLERK_TESTING_TOKEN from Clerk's API using CLERK_SECRET_KEY and
  // writes it to process.env so worker processes inherit it. No manual token
  // configuration in the Clerk dashboard is required.
  await clerkSetup();
}
