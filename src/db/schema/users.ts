import { sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  customType,
  foreignKey,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { cities } from "./cities";
import { staffRoleEnum, subscriptionTierEnum } from "./enums";

// citext is a Postgres extension for case-insensitive text.
// It makes display_name uniqueness case-insensitive without extra logic.
// The extension is enabled in migration 0000.
const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

// Structured billing address — only populated at purchase time.
type BillingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
};

export const users = pgTable(
  "users",
  {
    // ── Core identity ──────────────────────────────────────────────────────
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: text("clerk_user_id").notNull().unique(),
    email: text("email").notNull(),
    // Nullable until onboarding is complete — see ADR-0023.
    displayName: citext("display_name").unique(),

    // ── Geography (collected at sign-up with explanatory notice) ───────────
    // Nullable until onboarding is complete — see ADR-0023.
    countryCode: char("country_code", { length: 2 }),
    cityId: integer("city_id").references(() => cities.id),
    timezone: text("timezone"),

    // ── Rank axes (strictly non-mingling — see ADR-0019) ───────────────────
    subscriptionTier: subscriptionTierEnum("subscription_tier")
      .notNull()
      .default("free"),
    // Monotonic: only ever increases. CHECK constraint enforces >= 0.
    // Application layer enforces it never decreases (see roles-and-ranks.md).
    contributionPoints: integer("contribution_points").notNull().default(0),

    // ── Profile ────────────────────────────────────────────────────────────
    publicProfile: boolean("public_profile").notNull().default(false),
    firstName: text("first_name"),
    lastName: text("last_name"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),

    // ── Timestamps ─────────────────────────────────────────────────────────
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    bannedAt: timestamp("banned_at", { withTimezone: true }),

    // ── Payment-triggered (only populated at purchase — never at sign-up) ──
    billingName: text("billing_name"),
    billingAddress: jsonb("billing_address").$type<BillingAddress>(),
    phone: text("phone"),
    stripeCustomerId: text("stripe_customer_id"),

    // ── Staff-only (populated via invitation flow) ──────────────────────────
    staffRole: staffRoleEnum("staff_role"),
    legalName: text("legal_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    invitedByUserId: uuid("invited_by_user_id"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    removedAt: timestamp("removed_at", { withTimezone: true }),

    // ── Panel / committee flags (orthogonal to role — see ADR-0015) ─────────
    isBarMember: boolean("is_bar_member").notNull().default(false),
    isPlanningCommittee: boolean("is_planning_committee").notNull().default(false),
    barGrantedAt: timestamp("bar_granted_at", { withTimezone: true }),
    planningCommitteeGrantedAt: timestamp("planning_committee_granted_at", {
      withTimezone: true,
    }),
  },
  (t) => [
    // contribution_points can never go below zero
    check(
      "contribution_points_non_negative",
      sql`${t.contributionPoints} >= 0`,
    ),
    // self-referential FK: who invited this staff member
    foreignKey({
      columns: [t.invitedByUserId],
      foreignColumns: [t.id],
      name: "users_invited_by_user_id_fkey",
    }).onDelete("set null"),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
