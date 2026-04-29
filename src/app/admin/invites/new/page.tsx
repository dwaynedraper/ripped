import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { sendInvitation } from "./actions";

export default async function NewInvitePage() {
  const user = await currentUser();
  if (!user?.staffRole) redirect("/sign-in");

  // Admins can invite content_creator only; super_admin can invite either.
  const canInviteAdmin = user.staffRole === "super_admin";

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Send Staff Invitation</h1>
      <form action={sendInvitation} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="invitee@example.com"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="role" className="text-sm font-medium">
            Role
          </label>
          <select
            id="role"
            name="role"
            required
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="content_creator">Content Creator</option>
            {canInviteAdmin && <option value="admin">Admin</option>}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Send Invitation
        </button>
      </form>
    </div>
  );
}
