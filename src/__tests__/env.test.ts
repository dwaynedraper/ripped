import { describe, it, expect, beforeEach, vi } from "vitest";

// The env module validates at import time, so we test the validation logic
// directly against the Zod schemas rather than re-importing the live module.
// This avoids needing a real .env.local in CI.

import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url(),
  MONGODB_URI: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  SUPER_ADMIN_EMAIL: z.string().email(),
});

const clientSchema = z.object({
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
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(1),
  NEXT_PUBLIC_E2E_TEST_MODE: z.enum(["0", "1"]).default("0"),
});

const validServer = {
  NODE_ENV: "test" as const,
  DATABASE_URL: "postgresql://user:pass@host/db",
  DATABASE_URL_UNPOOLED: "postgresql://user:pass@host-direct/db",
  MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/ripped",
  CLERK_SECRET_KEY: "sk_test_abc",
  CLERK_WEBHOOK_SECRET: "whsec_abc",
  SUPER_ADMIN_EMAIL: "dean@test.com",
};

const validClient = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_abc",
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "AIza_test_abc",
};

describe("server env schema", () => {
  it("accepts a valid config", () => {
    expect(() => serverSchema.parse(validServer)).not.toThrow();
  });

  it("rejects a missing DATABASE_URL", () => {
    const result = serverSchema.safeParse({ ...validServer, DATABASE_URL: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-URL DATABASE_URL", () => {
    const result = serverSchema.safeParse({
      ...validServer,
      DATABASE_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid NODE_ENV", () => {
    const result = serverSchema.safeParse({
      ...validServer,
      NODE_ENV: "staging",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing SUPER_ADMIN_EMAIL", () => {
    const result = serverSchema.safeParse({
      ...validServer,
      SUPER_ADMIN_EMAIL: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-email SUPER_ADMIN_EMAIL", () => {
    // A plain string would be accepted by z.string() — the email() refinement
    // prevents a misconfigured value from silently skipping the bootstrap check.
    const result = serverSchema.safeParse({
      ...validServer,
      SUPER_ADMIN_EMAIL: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("client env schema", () => {
  it("accepts a valid config", () => {
    expect(() => clientSchema.parse(validClient)).not.toThrow();
  });

  it("rejects a missing publishable key", () => {
    const result = clientSchema.safeParse({
      ...validClient,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an app URL without a protocol", () => {
    const result = clientSchema.safeParse({
      ...validClient,
      NEXT_PUBLIC_APP_URL: "localhost:3000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an ftp app URL (only http/https allowed)", () => {
    const result = clientSchema.safeParse({
      ...validClient,
      NEXT_PUBLIC_APP_URL: "ftp://example.com",
    });
    expect(result.success).toBe(false);
  });

  // Guards the silent-failure mode: without this key the city autocomplete
  // mounts but never renders suggestions, leaving the user stuck on onboarding.
  it("rejects a missing Google Maps API key", () => {
    const result = clientSchema.safeParse({
      ...validClient,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a Clerk sign-in URL that is not a relative path", () => {
    const result = clientSchema.safeParse({
      ...validClient,
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: "sign-in",
    });
    expect(result.success).toBe(false);
  });

  it("defaults E2E_TEST_MODE to '0' when omitted (production safety)", () => {
    // Catastrophe mode: a forgotten env var enables test mode in production.
    // The default keeps the flag off when the var is missing.
    const result = clientSchema.safeParse(validClient);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.NEXT_PUBLIC_E2E_TEST_MODE).toBe("0");
  });

  it("rejects E2E_TEST_MODE values other than '0' or '1'", () => {
    // Without the enum constraint, any string would be accepted and the
    // truthy/falsy check at the call site would silently flip behavior.
    const result = clientSchema.safeParse({
      ...validClient,
      NEXT_PUBLIC_E2E_TEST_MODE: "true",
    });
    expect(result.success).toBe(false);
  });
});
