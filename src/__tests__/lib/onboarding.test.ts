import { describe, it, expect } from "vitest";
import { isProfileComplete } from "@/lib/onboarding";

const base = {
  displayName: "TestUser",
  countryCode: "US",
  cityName: "New York",
  timezone: "America/New_York",
};

describe("isProfileComplete", () => {
  it("returns true when all four fields are set", () => {
    expect(isProfileComplete(base)).toBe(true);
  });

  it("returns false when displayName is null", () => {
    expect(isProfileComplete({ ...base, displayName: null })).toBe(false);
  });

  it("returns false when countryCode is null", () => {
    expect(isProfileComplete({ ...base, countryCode: null })).toBe(false);
  });

  it("returns false when cityName is null", () => {
    expect(isProfileComplete({ ...base, cityName: null })).toBe(false);
  });

  it("returns false when timezone is null", () => {
    expect(isProfileComplete({ ...base, timezone: null })).toBe(false);
  });

  it("returns false when all four are null", () => {
    expect(
      isProfileComplete({
        displayName: null,
        countryCode: null,
        cityName: null,
        timezone: null,
      }),
    ).toBe(false);
  });

  // Empty-string defense — the DB schema only enforces NOT NULL after
  // onboarding. An empty string would slip past that check but leave the
  // user effectively un-onboarded. Catching it here keeps the proxy gate
  // honest.
  it("returns false when displayName is an empty string", () => {
    expect(isProfileComplete({ ...base, displayName: "" })).toBe(false);
  });

  it("returns false when cityName is an empty string", () => {
    expect(isProfileComplete({ ...base, cityName: "" })).toBe(false);
  });
});
