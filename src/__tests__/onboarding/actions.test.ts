import { describe, it, expect } from "vitest";
import { onboardingSchema } from "@/app/onboarding/schema";
import { isUniqueViolation } from "@/lib/db-errors";

const validBase = {
  displayName: "Test_User 123",
  countryCode: "US",
  cityName: "New York",
  cityState: "NY",
  googlePlaceId: "ChIJOwg_06VPwokRYv534QaPC8g",
  timezone: "America/New_York",
};

describe("onboardingSchema validation", () => {
  it("passes with valid input", () => {
    const result = onboardingSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects when fields are missing", () => {
    const result = onboardingSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid country code", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      countryCode: "USA", // Must be 2 letters
    });
    expect(result.success).toBe(false);

    const result2 = onboardingSchema.safeParse({
      ...validBase,
      countryCode: "XX", // Not in our list
    });
    expect(result2.success).toBe(false);
  });

  it("rejects invalid timezone", () => {
    const result = onboardingSchema.safeParse({
      ...validBase,
      timezone: "Mars/New_York",
    });
    expect(result.success).toBe(false);
  });

  describe("display name validation logic", () => {
    it("rejects display name less than 3 characters", () => {
      const result = onboardingSchema.safeParse({
        ...validBase,
        displayName: "ab",
      });
      expect(result.success).toBe(false);
    });

    it("rejects display name more than 30 characters", () => {
      const result = onboardingSchema.safeParse({
        ...validBase,
        displayName: "a".repeat(31),
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid characters in display name", () => {
      const result = onboardingSchema.safeParse({
        ...validBase,
        displayName: "Test@User",
      });
      expect(result.success).toBe(false);
    });

    it("trims surrounding whitespace", () => {
      // Proves .trim() runs before .min(3) — important because the form
      // could send "  ab  " which would slip past length validation
      // without the trim.
      const result = onboardingSchema.safeParse({
        ...validBase,
        displayName: "  TestUser  ",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.displayName).toBe("TestUser");
    });

    it("rejects a display name that is only whitespace", () => {
      // After .trim() this becomes "" and fails .min(3).
      const result = onboardingSchema.safeParse({
        ...validBase,
        displayName: "    ",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("country code normalization", () => {
    it("normalizes lowercase country codes to uppercase", () => {
      // Proves .toUpperCase() runs before .refine(isKnownCountryCode) —
      // without it, "us" would be rejected as unknown even though it's
      // semantically the same as "US".
      const result = onboardingSchema.safeParse({
        ...validBase,
        countryCode: "us",
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.countryCode).toBe("US");
    });
  });

  describe("googlePlaceId — free-typed city guard", () => {
    it("rejects empty googlePlaceId", () => {
      // Catastrophe mode: user free-types a city without picking from
      // Google Places suggestions. We'd store unverified text. The
      // empty-placeId rejection forces a real selection.
      const result = onboardingSchema.safeParse({
        ...validBase,
        googlePlaceId: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("cityState nullability", () => {
    it("accepts null cityState (countries without administrative regions)", () => {
      // Singapore, Monaco, Vatican, etc. — no state/region field.
      const result = onboardingSchema.safeParse({
        ...validBase,
        cityState: null,
      });
      expect(result.success).toBe(true);
    });
  });
});

// The catastrophe this guards: when a user picks a taken display name,
// they should see a clean inline error. If isUniqueViolation falsely
// returns false, they get a 500 instead. If it falsely returns true on
// an unrelated error, we mask the real problem and confuse debugging.
describe("isUniqueViolation — display name conflict gate", () => {
  it("returns true for SQLSTATE 23505 with matching constraint name", () => {
    const err = { code: "23505", constraint: "users_display_name_unique" };
    expect(isUniqueViolation(err, "users_display_name_unique")).toBe(true);
  });

  it("returns true for SQLSTATE 23505 when no constraint filter is given", () => {
    const err = { code: "23505", constraint: "users_clerk_user_id_unique" };
    expect(isUniqueViolation(err)).toBe(true);
  });

  it("returns false when the constraint name does not match", () => {
    // A clerk_user_id collision (which the action would never expect)
    // must NOT surface as "display name taken".
    const err = { code: "23505", constraint: "users_clerk_user_id_unique" };
    expect(isUniqueViolation(err, "users_display_name_unique")).toBe(false);
  });

  it("returns false for non-23505 SQLSTATE codes", () => {
    // 23502 = not_null_violation. Should fall through to the generic
    // re-throw, not be mis-reported as a name collision.
    const err = { code: "23502", constraint: "users_display_name_unique" };
    expect(isUniqueViolation(err, "users_display_name_unique")).toBe(false);
  });

  it("returns false for non-object inputs", () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
    expect(isUniqueViolation("not an error")).toBe(false);
    expect(isUniqueViolation(42)).toBe(false);
  });
});
