import { describe, it, expect } from "vitest";
import { onboardingSchema } from "@/app/onboarding/schema";

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
  });
});
