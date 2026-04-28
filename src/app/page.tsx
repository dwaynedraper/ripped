import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const { userId } = await auth();
  let displayName = null;

  if (userId) {
    const [user] = await db
      .select({ displayName: users.displayName })
      .from(users)
      .where(eq(users.clerkUserId, userId));
      
    if (user) {
      displayName = user.displayName;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black font-sans">
      <main className="flex flex-col items-center gap-8 bg-white dark:bg-zinc-900 p-12 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Ripped or Stamped
        </h1>
        
        <SignedIn>
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Welcome back, <span className="font-semibold text-zinc-900 dark:text-zinc-100">{displayName || "User"}</span>!
            </p>
            <UserButton />
          </div>
        </SignedIn>

        <SignedOut>
          <div className="flex flex-col gap-4 w-full sm:flex-row">
            <Link 
              href="/sign-in"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-zinc-900 px-6 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up"
              className="flex h-12 w-full items-center justify-center rounded-lg border border-zinc-200 bg-white px-6 font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 sm:w-auto"
            >
              Sign Up
            </Link>
          </div>
        </SignedOut>
      </main>
    </div>
  );
}
