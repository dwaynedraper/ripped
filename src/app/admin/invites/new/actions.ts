"use server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin, requireSuperAdmin, currentUser } from "@/lib/auth";
import { logEvent } from "@/lib/audit";

export async function sendInvitation(formData: FormData) {
  const email = formData.get("email") as string;
  const role = formData.get("role") as "content_creator" | "admin";

  if (!email || !role) throw new Error("Email and role are required");

  // Permission: admins can invite content_creator; super_admin can invite either.
  if (role === "admin") {
    await requireSuperAdmin();
  } else {
    await requireAdmin();
  }

  const actor = await currentUser();
  if (!actor) throw new Error("Not authenticated");

  const client = await clerkClient();
  await client.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: {
      staffRole: role,
      invitedByUserId: actor.id,
    },
  });

  await logEvent({
    eventType: "staff.invitation_sent",
    actorUserId: actor.id,
    payload: { email, role },
  });
}
