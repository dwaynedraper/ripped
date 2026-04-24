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
});

const clientSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
      message: "Must use http or https protocol",
    }),
});

const validServer = {
  NODE_ENV: "test" as const,
  DATABASE_URL: "postgresql://user:pass@host/db",
  DATABASE_URL_UNPOOLED: "postgresql://user:pass@host-direct/db",
  MONGODB_URI: "mongodb+srv://user:pass@cluster.mongodb.net/ripped",
  CLERK_SECRET_KEY: "sk_test_abc",
  CLERK_WEBHOOK_SECRET: "whsec_abc",
};

const validClient = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_abc",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
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
});
