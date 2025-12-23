// app/admin/profile/page.tsx
export const dynamic = "force-dynamic";

import { requireUser } from "../../../lib/session";
import { prisma } from "../../../lib/prisma";

export default async function AdminProfilePage() {
  const user = await requireUser();

  if (user.role !== "admin") {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
        You don’t have access to this page.
      </div>
    );
  }

  const adminProfile = await prisma.adminProfile.findUnique({
    where: { userId: user.id },
    select: { fullName: true },
  });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-5">
        <p className="text-sm font-semibold">Admin profile</p>
        <p className="mt-1 text-sm text-neutral-600">
          View your admin account details.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-neutral-500">Email</p>
            <p className="mt-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900">
              {user.email}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-500">Name</p>
            <p className="mt-1 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-900">
              {adminProfile?.fullName ?? "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5">
        <p className="text-sm font-semibold">Security</p>
        <p className="mt-1 text-sm text-neutral-600">
          Password reset / change flow can be added next.
        </p>

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          Coming soon: password reset link, audit logs, and MFA.
        </div>
      </section>
    </div>
  );
}
