import "server-only";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import type { User } from "@/db/schema";

type RoleCheck = {
  staffRole: string | null;
  allowedRoles: string[];
};

// Pure helper — extracted so it can be unit-tested without mocking Clerk.
// requireRole() calls this internally.
export function isRoleAllowed({ staffRole, allowedRoles }: RoleCheck): boolean {
  if (!staffRole) return false;
  return allowedRoles.includes(staffRole);
}

// Returns the full DB user row for the currently authenticated Clerk user.
// Returns null if unauthenticated or if the webhook hasn't created the row yet.
export async function currentUser(): Promise<User | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, userId));

  return user ?? null;
}

export async function requireRole(
  ...allowedRoles: Array<"content_creator" | "admin" | "super_admin">
): Promise<User> {
  const user = await currentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  if (!isRoleAllowed({ staffRole: user.staffRole, allowedRoles })) {
    throw new Response("Forbidden", { status: 403 });
  }
  return user;
}

export async function requireStaff(): Promise<User> {
  return requireRole("content_creator", "admin", "super_admin");
}

export async function requireAdmin(): Promise<User> {
  return requireRole("admin", "super_admin");
}

export async function requireSuperAdmin(): Promise<User> {
  return requireRole("super_admin");
}
