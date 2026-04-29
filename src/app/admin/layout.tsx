import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) redirect("/sign-in");

  if (!user.staffRole) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-bold">403 — Forbidden</h1>
        <p className="text-zinc-500">You do not have access to the admin area.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-zinc-900 text-white p-6 flex flex-col gap-2">
        <h2 className="text-lg font-bold mb-4">Admin</h2>
        <a href="/admin" className="hover:underline text-sm">Dashboard</a>
        {(user.staffRole === "admin" || user.staffRole === "super_admin") && (
          <a href="/admin/users" className="hover:underline text-sm">Users</a>
        )}
        {user.staffRole === "super_admin" && (
          <a href="/admin/admins" className="hover:underline text-sm">Admin Management</a>
        )}
        <a href="/admin/invites/new" className="hover:underline text-sm">Send Invite</a>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
