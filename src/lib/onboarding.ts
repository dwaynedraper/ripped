import type { User } from "@/db/schema";

/**
 * The four fields that must be set for an account to be considered onboarded.
 * Per ADR-0023, these are nullable in the schema so the Clerk webhook can
 * insert a minimal row before the user has seen the onboarding screen — but
 * the proxy gate uses `isProfileComplete` to redirect partial accounts back
 * to /onboarding until these are filled in.
 *
 * `cityState` and `googlePlaceId` are NOT checked here:
 * - `cityState` is legitimately null in many countries (Singapore, Monaco).
 * - `googlePlaceId` is set whenever `cityName` is set (server action enforces
 *   this), so checking `cityName` is sufficient.
 */
type ProfileFields = Pick<
  User,
  "displayName" | "countryCode" | "cityName" | "timezone"
>;

/**
 * Returns true if every onboarding field is set to a non-empty value.
 *
 * Defends against empty strings as well as null — the DB schema only enforces
 * NOT NULL on most fields after onboarding, but an empty string would still
 * pass that check while leaving the user effectively un-onboarded.
 */
export function isProfileComplete(user: ProfileFields): boolean {
  return (
    isMeaningful(user.displayName) &&
    isMeaningful(user.countryCode) &&
    isMeaningful(user.cityName) &&
    isMeaningful(user.timezone)
  );
}

function isMeaningful(value: string | null): value is string {
  return value !== null && value.length > 0;
}
