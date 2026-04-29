import { requireStaff } from "@/lib/auth";

export default async function AdminDashboardPage() {
  const user = await requireStaff();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-zinc-500 text-sm">
        Signed in as <strong>{user.displayName ?? user.email}</strong>
        {" "}({user.staffRole})
      </p>
    </div>
  );
}
