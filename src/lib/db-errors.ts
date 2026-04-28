/**
 * Database error helpers.
 *
 * Postgres errors propagate from `@neondatabase/serverless` (which mirrors
 * `pg`) with two relevant fields: `code` (SQLSTATE) and `constraint` (the
 * name of the violated constraint, when applicable).
 *
 * Reference: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */

/** SQLSTATE for `unique_violation`. */
export const PG_UNIQUE_VIOLATION = "23505";

/**
 * Detects Postgres unique-constraint violations.
 *
 * Pass `constraintName` to scope to a specific constraint — useful when a
 * caller wants to translate one specific conflict into a user-facing error
 * (e.g., "display name is taken") without accidentally swallowing other
 * unique-violation paths it doesn't know how to handle.
 *
 * @example
 * try {
 *   await db.update(...).set(...);
 * } catch (e) {
 *   if (isUniqueViolation(e, "users_display_name_unique")) {
 *     return { error: "That display name is already taken" };
 *   }
 *   throw e;
 * }
 */
export function isUniqueViolation(
  error: unknown,
  constraintName?: string,
): boolean {
  if (typeof error !== "object" || error === null) return false;
  const err = error as { code?: unknown; constraint?: unknown };
  if (err.code !== PG_UNIQUE_VIOLATION) return false;
  if (constraintName !== undefined && err.constraint !== constraintName) {
    return false;
  }
  return true;
}
