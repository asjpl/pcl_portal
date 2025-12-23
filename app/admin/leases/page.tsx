// app/admin/leases/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { redirect } from "next/navigation";

function money(cents: number | null | undefined) {
  const v = Number(cents || 0) / 100;
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(v);
}

function dateAU(d: Date | string | null | undefined) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-AU");
}

export default async function AdminLeasesPage() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/account");

  const leases = await prisma.lease.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      vehicle: true,
      payments: {
        orderBy: { dueDate: "asc" },
        take: 50,
      },
      fees: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
    take: 200,
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Leases</h1>
          <p className="mt-1 text-sm text-neutral-600">
            View active and historical leases. Payments show the next unpaid item.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/leases/new"
            className="rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-neutral-800"
          >
            Create lease
          </Link>

          <Link
            href="/admin"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 no-underline hover:bg-neutral-50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
        <div className="grid grid-cols-12 bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-700">
          <div className="col-span-3">Customer</div>
          <div className="col-span-3">Vehicle</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-2">Next payment</div>
          <div className="col-span-2">Status</div>
        </div>

        {leases.length === 0 ? (
          <div className="p-6 text-sm text-neutral-600">No leases found.</div>
        ) : (
          leases.map((lease) => {
            const schedule = lease.payments || [];
            const next =
              schedule
                .filter((p) => p.status !== "paid" && p.status !== "waived")
                .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))[0] ?? null;

            const isLate =
              next
                ? new Date(next.dueDate) < now &&
                  next.status !== "paid" &&
                  next.status !== "waived"
                : false;

            return (
              <div
                key={lease.id}
                className="grid grid-cols-12 items-center border-t border-neutral-100 px-4 py-4 text-sm"
              >
                <div className="col-span-3">
                  <p className="font-semibold text-neutral-900">{lease.customer.fullName}</p>
                  <p className="mt-1 text-xs text-neutral-500">{lease.customer.email}</p>
                </div>

                <div className="col-span-3">
                  <p className="font-semibold text-neutral-900">{lease.vehicle.title}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Rego: {lease.vehicle.regoNumber}
                    {lease.vehicle.state ? ` (${lease.vehicle.state})` : ""} • {lease.vehicle.category}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="font-semibold text-neutral-900">{lease.planName}</p>
                  <p className="mt-1 text-xs text-neutral-500">Weekly: {money(lease.weeklyAmount)}</p>
                  {lease.kmsPerWeek ? (
                    <p className="mt-1 text-xs text-neutral-500">
                      Included: {lease.kmsPerWeek.toLocaleString("en-AU")} km/wk
                    </p>
                  ) : null}
                </div>

                <div className="col-span-2">
                  {next ? (
                    <>
                      <p className="font-semibold text-neutral-900">{money(next.amount)}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Due {dateAU(next.dueDate)}
                        {isLate ? (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            Late
                          </span>
                        ) : null}
                      </p>
                    </>
                  ) : (
                    <p className="text-neutral-600">—</p>
                  )}
                </div>

                <div className="col-span-2 flex flex-col gap-2">
                    <span className="inline-flex w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-800">
                        {lease.status}
                    </span>

                    <Link
                        href={`/admin/leases/${lease.id}`}
                        className="text-xs font-semibold text-neutral-900 underline-offset-2 hover:underline"
                    >
                        View lease →
                    </Link>

                    <div className="mt-1 text-xs text-neutral-500">
                        <span>Start: {dateAU(lease.startDate)}</span>
                        {lease.endDate ? <span className="block">End: {dateAU(lease.endDate)}</span> : null}
                    </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Hint block */}
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
        <p className="font-semibold">Next steps</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Generate PaymentSchedule rows per lease (weekly cadence).</li>
          <li>Late fee automation: $60/day when overdue.</li>
          <li>Manual payment enabled only for failed/overdue items.</li>
        </ul>
      </div>
    </div>
  );
}
