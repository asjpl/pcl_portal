// app/admin/users/page.tsx
export const dynamic = "force-dynamic";

import { requireUser } from "../../../lib/session";
import { prisma } from "../../../lib/prisma";

export default async function AdminUsersPage() {
  const user = await requireUser();

  if (user.role !== "admin") {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
        You don’t have access to this page.
      </div>
    );
  }

  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, createdAt: true },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-5">
        <p className="text-sm font-semibold">Add admin user</p>
        <p className="mt-1 text-xs text-neutral-500">
          Creates an additional admin login. Password will be hashed server-side.
        </p>

        <form
          action="/api/admin/users"
          method="post"
          className="mt-4 grid gap-3 sm:grid-cols-3"
        >
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-neutral-600">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              placeholder="newadmin@pcl.dev"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-600">
              Temp password
            </label>
            <input
              name="password"
              required
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              placeholder="Admin123!"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Create admin user
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5">
        <p className="text-sm font-semibold">Admin users</p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200">
          <div className="grid grid-cols-3 bg-neutral-50 text-xs font-semibold text-neutral-700">
            <div className="p-3">Email</div>
            <div className="p-3">Created</div>
            <div className="p-3">Role</div>
          </div>

          {admins.map((a) => (
            <div key={a.id} className="grid grid-cols-3 border-t border-neutral-100 text-sm">
              <div className="p-3 font-semibold text-neutral-900">{a.email}</div>
              <div className="p-3 text-neutral-700">
                {new Date(a.createdAt).toLocaleDateString("en-AU")}
              </div>
              <div className="p-3 text-neutral-700">admin</div>
            </div>
          ))}

          {admins.length === 0 ? (
            <div className="p-4 text-sm text-neutral-600">No admin users found.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
