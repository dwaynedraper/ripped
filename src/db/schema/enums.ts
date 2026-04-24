import { pgEnum } from "drizzle-orm/pg-core";

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "premium",
]);

export const staffRoleEnum = pgEnum("staff_role", [
  "content_creator",
  "admin",
  "super_admin",
]);
