import { z } from "zod";
import { isKnownCountryCode } from "@/lib/countries";
import { isKnownTimezone } from "@/lib/timezones";

/**
 * Single source of truth for onboarding form validation.
 * Imported by both the Server Action (`actions.ts`) and the Client Component
 * form (`form.tsx`) so the same rules apply on both sides — no drift.
 */
export const onboardingSchema = z.object({
  // Display name: 3–30 chars, alphanumeric + underscore + hyphen + space.
  // Schema-level uniqueness is enforced by the citext UNIQUE constraint on
  // users.display_name (see drizzle/0000_dear_rattler.sql).
  displayName: z
    .string()
    .trim()
    .min(3, "At least 3 characters")
    .max(30, "At most 30 characters")
    .regex(
      /^[a-zA-Z0-9_\- ]+$/,
      "Letters, numbers, spaces, hyphens, and underscores only",
    ),

  // ISO 3166-1 alpha-2. Defense-in-depth: even if the form somehow submits
  // an unknown code, the schema rejects it before it reaches the database.
  countryCode: z
    .string()
    .length(2, "Must be a 2-letter country code")
    .toUpperCase()
    .refine(isKnownCountryCode, "Unknown country code"),

  // City name comes from Google Places — see ADR-0025.
  cityName: z
    .string()
    .trim()
    .min(1, "Please select a city from the suggestions")
    .max(100, "City name is too long"),

  // City state is legitimately null in places without administrative regions
  // (Singapore, Monaco, Vatican). Allow null; reject empty strings.
  cityState: z
    .string()
    .trim()
    .max(100, "State name is too long")
    .nullable(),

  // Google's place ID — proves the user picked from autocomplete rather than
  // free-typing. Without this we have no canonical identifier for the city.
  googlePlaceId: z
    .string()
    .trim()
    .min(1, "Please select a city from the suggestions"),

  // Timezone: validated against our curated list — see src/lib/timezones.ts.
  timezone: z.string().refine(isKnownTimezone, "Unknown timezone"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

/**
 * Result type for the `completeOnboarding` server action.
 * Discriminated union: on success, the action redirects (no payload needed);
 * on failure, the form receives field-keyed errors to render inline.
 */
export type OnboardingResult =
  | { success: true }
  | { success: false; errors: OnboardingFieldErrors };

export type OnboardingFieldErrors = Partial<
  Record<keyof OnboardingInput | "_form", string>
>;
