import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import React from "react";

// Mocked at the top level so it remains active after vi.resetModules().
// The real loader makes network calls that are unavailable in jsdom.
vi.mock("@googlemaps/js-api-loader", () => ({
  importLibrary: vi.fn().mockResolvedValue(undefined),
  setOptions: vi.fn(),
}));

// ─── E2E test mode (NEXT_PUBLIC_E2E_TEST_MODE === "1") ───────────────────────

describe("CityAutocomplete — E2E test mode", () => {
  // CityAutocomplete is reimported after stubbing the env var so the
  // module-level `isE2ETestMode` constant is re-evaluated with the new value.
  let CityAutocomplete: (typeof import("@/components/city-autocomplete"))["CityAutocomplete"];

  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_E2E_TEST_MODE", "1");
    vi.resetModules();
    const mod = await import("@/components/city-autocomplete");
    CityAutocomplete = mod.CityAutocomplete;
  });

  afterEach(cleanup);

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("renders the 'Use this city' button", () => {
    render(<CityAutocomplete countryCode="US" onSelect={() => {}} />);
    expect(screen.getByTestId("city-use-this")).toBeDefined();
  });

  it("calls onSelect with typed city name, null cityState, and stub place id", () => {
    const onSelect = vi.fn();
    render(<CityAutocomplete countryCode="AU" onSelect={onSelect} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Melbourne" },
    });
    fireEvent.click(screen.getByTestId("city-use-this"));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith({
      cityName: "Melbourne",
      cityState: null,
      countryCode: "AU",
      googlePlaceId: "test-place-id",
    });
  });
});

// ─── Normal mode (NEXT_PUBLIC_E2E_TEST_MODE === "0" / unset) ─────────────────

describe("CityAutocomplete — normal mode", () => {
  let CityAutocomplete: (typeof import("@/components/city-autocomplete"))["CityAutocomplete"];

  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_E2E_TEST_MODE", "0");
    vi.resetModules();
    const mod = await import("@/components/city-autocomplete");
    CityAutocomplete = mod.CityAutocomplete;
  });

  afterEach(cleanup);

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("does not render the 'Use this city' button", () => {
    render(<CityAutocomplete countryCode="US" onSelect={() => {}} />);
    expect(screen.queryByTestId("city-use-this")).toBeNull();
  });
});
