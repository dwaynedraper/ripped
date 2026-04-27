import "server-only";
import { z } from "zod";

// Validated once at startup. If any var is missing or wrong, the app throws
// immediately with a readable message rather than failing silently at runtime.
//
// Import this module anywhere server-side env vars are needed.
// Importing from a Client Component is a build error (via `server-only`).
// Client Components should use process.env.NEXT_PUBLIC_* directly.

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),

  // Postgres (Neon) — pooled for the app, direct for migrations
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url(),

  // MongoDB (Atlas)
  MONGODB_URI: z.string().url(),

  // Clerk
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().startsWith("/", {
    message: "Must be a relative path starting with /",
  }),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().startsWith("/", {
    message: "Must be a relative path starting with /",
  }),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
      message: "Must use http or https protocol",
    }),

  // Google Maps (Places Autocomplete — see ADR-0025)
  // Read from Client Components via process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
  // Validated here so a missing key fails the build, not the user's first city search.
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
});

export type Env = z.infer<typeof schema>;

const result = schema.safeParse(process.env);

if (!result.success) {
  throw new Error(
    `Invalid environment variables:\n${result.error.toString()}`,
  );
}

export const env: Env = result.data;
