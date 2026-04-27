/**
 * Curated IANA timezone list for the onboarding form.
 *
 * The form's default timezone is auto-detected from the user's browser via
 * `Intl.DateTimeFormat().resolvedOptions().timeZone`. This list is the backup
 * for users who travel, use a VPN, or want to set a different zone.
 *
 * Why curated (not `Intl.supportedValuesOf('timeZone')`): the runtime list has
 * ~600 entries with ugly identifiers ("Africa/Bangui"). A curated ~70-zone
 * list with friendly labels is a far better picker UX. If a user is in a zone
 * not on this list, they can pick the closest one — IANA zones with the same
 * UTC offset and DST rules are functionally equivalent.
 */

export type Timezone = {
  /** IANA identifier — what gets stored in users.timezone */
  value: string;
  /** Display label shown in the picker */
  label: string;
  /** Region grouping (for optional optgroups in the UI) */
  region: "Americas" | "Europe" | "Africa" | "Middle East" | "Asia" | "Oceania" | "UTC";
};

export const timezones: Timezone[] = [
  // ── Americas ────────────────────────────────────────────────────────────
  { value: "America/St_Johns", label: "St. John's (Newfoundland)", region: "Americas" },
  { value: "America/Halifax", label: "Halifax (Atlantic)", region: "Americas" },
  { value: "America/New_York", label: "New York (Eastern)", region: "Americas" },
  { value: "America/Toronto", label: "Toronto (Eastern)", region: "Americas" },
  { value: "America/Chicago", label: "Chicago (Central)", region: "Americas" },
  { value: "America/Mexico_City", label: "Mexico City", region: "Americas" },
  { value: "America/Denver", label: "Denver (Mountain)", region: "Americas" },
  { value: "America/Phoenix", label: "Phoenix (Arizona)", region: "Americas" },
  { value: "America/Los_Angeles", label: "Los Angeles (Pacific)", region: "Americas" },
  { value: "America/Vancouver", label: "Vancouver (Pacific)", region: "Americas" },
  { value: "America/Anchorage", label: "Anchorage (Alaska)", region: "Americas" },
  { value: "Pacific/Honolulu", label: "Honolulu (Hawaii)", region: "Americas" },
  { value: "America/Bogota", label: "Bogotá", region: "Americas" },
  { value: "America/Lima", label: "Lima", region: "Americas" },
  { value: "America/Santiago", label: "Santiago", region: "Americas" },
  { value: "America/Buenos_Aires", label: "Buenos Aires", region: "Americas" },
  { value: "America/Sao_Paulo", label: "São Paulo", region: "Americas" },

  // ── Europe ──────────────────────────────────────────────────────────────
  { value: "Europe/London", label: "London", region: "Europe" },
  { value: "Europe/Dublin", label: "Dublin", region: "Europe" },
  { value: "Europe/Lisbon", label: "Lisbon", region: "Europe" },
  { value: "Europe/Madrid", label: "Madrid", region: "Europe" },
  { value: "Europe/Paris", label: "Paris", region: "Europe" },
  { value: "Europe/Brussels", label: "Brussels", region: "Europe" },
  { value: "Europe/Amsterdam", label: "Amsterdam", region: "Europe" },
  { value: "Europe/Berlin", label: "Berlin", region: "Europe" },
  { value: "Europe/Zurich", label: "Zürich", region: "Europe" },
  { value: "Europe/Rome", label: "Rome", region: "Europe" },
  { value: "Europe/Vienna", label: "Vienna", region: "Europe" },
  { value: "Europe/Prague", label: "Prague", region: "Europe" },
  { value: "Europe/Warsaw", label: "Warsaw", region: "Europe" },
  { value: "Europe/Stockholm", label: "Stockholm", region: "Europe" },
  { value: "Europe/Oslo", label: "Oslo", region: "Europe" },
  { value: "Europe/Copenhagen", label: "Copenhagen", region: "Europe" },
  { value: "Europe/Helsinki", label: "Helsinki", region: "Europe" },
  { value: "Europe/Athens", label: "Athens", region: "Europe" },
  { value: "Europe/Istanbul", label: "Istanbul", region: "Europe" },
  { value: "Europe/Kyiv", label: "Kyiv", region: "Europe" },
  { value: "Europe/Moscow", label: "Moscow", region: "Europe" },

  // ── Africa ──────────────────────────────────────────────────────────────
  { value: "Africa/Casablanca", label: "Casablanca", region: "Africa" },
  { value: "Africa/Lagos", label: "Lagos", region: "Africa" },
  { value: "Africa/Cairo", label: "Cairo", region: "Africa" },
  { value: "Africa/Nairobi", label: "Nairobi", region: "Africa" },
  { value: "Africa/Johannesburg", label: "Johannesburg", region: "Africa" },

  // ── Middle East ─────────────────────────────────────────────────────────
  { value: "Asia/Jerusalem", label: "Jerusalem", region: "Middle East" },
  { value: "Asia/Riyadh", label: "Riyadh", region: "Middle East" },
  { value: "Asia/Dubai", label: "Dubai", region: "Middle East" },
  { value: "Asia/Tehran", label: "Tehran", region: "Middle East" },

  // ── Asia ────────────────────────────────────────────────────────────────
  { value: "Asia/Karachi", label: "Karachi", region: "Asia" },
  { value: "Asia/Kolkata", label: "Mumbai / Delhi (IST)", region: "Asia" },
  { value: "Asia/Dhaka", label: "Dhaka", region: "Asia" },
  { value: "Asia/Bangkok", label: "Bangkok", region: "Asia" },
  { value: "Asia/Jakarta", label: "Jakarta", region: "Asia" },
  { value: "Asia/Singapore", label: "Singapore", region: "Asia" },
  { value: "Asia/Manila", label: "Manila", region: "Asia" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", region: "Asia" },
  { value: "Asia/Shanghai", label: "Shanghai", region: "Asia" },
  { value: "Asia/Taipei", label: "Taipei", region: "Asia" },
  { value: "Asia/Seoul", label: "Seoul", region: "Asia" },
  { value: "Asia/Tokyo", label: "Tokyo", region: "Asia" },

  // ── Oceania ─────────────────────────────────────────────────────────────
  { value: "Australia/Perth", label: "Perth", region: "Oceania" },
  { value: "Australia/Adelaide", label: "Adelaide", region: "Oceania" },
  { value: "Australia/Brisbane", label: "Brisbane", region: "Oceania" },
  { value: "Australia/Sydney", label: "Sydney", region: "Oceania" },
  { value: "Pacific/Auckland", label: "Auckland", region: "Oceania" },
  { value: "Pacific/Fiji", label: "Fiji", region: "Oceania" },

  // ── UTC ─────────────────────────────────────────────────────────────────
  { value: "UTC", label: "UTC (Coordinated Universal Time)", region: "UTC" },
];

/**
 * Returns true if the given IANA identifier is in our curated list.
 * Used by the server action to validate that a submitted timezone is one
 * we offered — protects against form injection.
 */
export function isKnownTimezone(value: string): boolean {
  return timezones.some((tz) => tz.value === value);
}
