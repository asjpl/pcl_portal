// app/admin/leases/[id]/page.tsx
export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/session";
import type { LeaseStatus } from "@prisma/client";

function money(cents: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function dateAU(d: Date | null | undefined) {
  if (!d) return "—";
  return d.toLocaleDateString("en-AU");
}

function yyyyMmDd(d: Date | null | undefined) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateFromInput(v: FormDataEntryValue | null) {
  const s = (typeof v === "string" ? v : "").trim();
  if (!s) return null;
  const dt = new Date(`${s}T00:00:00`);
  return Number.isNaN(+dt) ? null : dt;
}

function parseIntSafe(v: FormDataEntryValue | null) {
  const s = (typeof v === "string" ? v : "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseMoneyToCents(v: FormDataEntryValue | null) {
  const s = (typeof v === "string" ? v : "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export default async function AdminLeaseDetailPage({
  params,
}: {
  // ✅ Next.js 16.1: params can be a Promise
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/account");

  const { id: leaseId } = await params; // ✅ unwrap params
  if (!leaseId) notFound();

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      customer: true,
      vehicle: true,
      payments: { orderBy: { dueDate: "asc" } },
      fees: { orderBy: { dateApplied: "desc" } },
    },
  });

  if (!lease) notFound();

  async function endLease() {
    "use server";
    const session = await requireUser();
    if (session.role !== "admin") redirect("/account");

    await prisma.lease.update({
      where: { id: leaseId },
      data: {
        status: "completed",
        endDate: new Date(),
      },
    });

    redirect(`/admin/leases/${leaseId}`);
  }

  async function saveEdits(formData: FormData) {
    "use server";
    const session = await requireUser();
    if (session.role !== "admin") redirect("/account");

    const planName = String(formData.get("planName") || "").trim();
    const status = String(formData.get("status") || "").trim() as LeaseStatus;

    const weeklyAmountCents = parseMoneyToCents(formData.get("weeklyAmount"));
    const kmsPerWeek = parseIntSafe(formData.get("kmsPerWeek"));
    const bondAmountCents = parseMoneyToCents(formData.get("bondAmount"));

    const startDate = parseDateFromInput(formData.get("startDate"));
    const endDate = parseDateFromInput(formData.get("endDate"));

    if (!planName) throw new Error("Plan name is required.");
    if (!["active", "paused", "completed", "cancelled"].includes(status)) {
      throw new Error("Invalid status.");
    }
    if (weeklyAmountCents === null || weeklyAmountCents < 0) {
      throw new Error("Weekly amount is required and must be >= 0.");
    }
    if (kmsPerWeek !== null && kmsPerWeek < 0) {
      throw new Error("Kms per week must be >= 0.");
    }
    if (bondAmountCents !== null && bondAmountCents < 0) {
      throw new Error("Bond amount must be >= 0.");
    }
    if (!startDate) throw new Error("Start date is required.");
    if (endDate && +endDate < +startDate) {
      throw new Error("End date cannot be before start date.");
    }

    await prisma.lease.update({
      where: { id: leaseId },
      data: {
        planName,
        status,
        weeklyAmount: weeklyAmountCents,
        kmsPerWeek,
        bondAmount: bondAmountCents,
        startDate,
        endDate,
      },
    });

    redirect(`/admin/leases/${leaseId}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Lease details</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {lease.planName} • {lease.status}
          </p>
        </div>

        <div className="flex gap-2">
          {lease.status === "active" ? (
            <form action={endLease}>
              <button
                type="submit"
                className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                End lease
              </button>
            </form>
          ) : null}

          <a
            href="/admin/leases"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            Back
          </a>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold text-neutral-500">CUSTOMER</p>
          <p className="mt-2 font-semibold">{lease.customer.fullName}</p>
          <p className="mt-1 text-sm text-neutral-600">{lease.customer.email}</p>
          <p className="mt-1 text-sm text-neutral-600">{lease.customer.phoneE164}</p>
          {lease.customer.companyName ? (
            <p className="mt-1 text-sm text-neutral-600">{lease.customer.companyName}</p>
          ) : null}
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold text-neutral-500">VEHICLE</p>
          <p className="mt-2 font-semibold">{lease.vehicle.title}</p>
          <p className="mt-1 text-sm text-neutral-600">
            Rego: {lease.vehicle.regoNumber}
            {lease.vehicle.state ? ` (${lease.vehicle.state})` : ""}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Odometer: {lease.vehicle.currentKms.toLocaleString("en-AU")} km
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold text-neutral-500">CURRENT TERMS</p>
          <p className="mt-2 text-sm text-neutral-700">
            Weekly: <span className="font-semibold">{money(lease.weeklyAmount)}</span>
            <br />
            Included:{" "}
            <span className="font-semibold">
              {lease.kmsPerWeek ? `${lease.kmsPerWeek.toLocaleString("en-AU")} km/wk` : "—"}
            </span>
            <br />
            Bond:{" "}
            <span className="font-semibold">
              {lease.bondAmount ? money(lease.bondAmount) : "—"}
            </span>
            <br />
            Start: <span className="font-semibold">{dateAU(lease.startDate)}</span>
            <br />
            End: <span className="font-semibold">{dateAU(lease.endDate)}</span>
          </p>
        </div>
      </div>

      {/* Edit form */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Edit lease</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Update plan terms and status. Amounts are in AUD (we store cents).
            </p>
          </div>

          <span className="hidden rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 sm:inline-flex">
            ID: {lease.id}
          </span>
        </div>

        <form action={saveEdits} className="mt-6 grid gap-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Plan name</label>
              <input
                name="planName"
                defaultValue={lease.planName}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-600">Status</label>
              <select
                name="status"
                defaultValue={lease.status}
                className="mt-1 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm"
              >
                <option value="active">active</option>
                <option value="paused">paused</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Weekly amount (AUD)</label>
              <input
                name="weeklyAmount"
                type="number"
                step="0.01"
                min={0}
                defaultValue={(lease.weeklyAmount / 100).toFixed(2)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-600">Kms per week</label>
              <input
                name="kmsPerWeek"
                type="number"
                min={0}
                defaultValue={lease.kmsPerWeek ?? ""}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                placeholder="e.g. 490"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-600">Bond amount (AUD)</label>
              <input
                name="bondAmount"
                type="number"
                step="0.01"
                min={0}
                defaultValue={lease.bondAmount ? (lease.bondAmount / 100).toFixed(2) : ""}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                placeholder="e.g. 700.00"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Start date</label>
              <input
                name="startDate"
                type="date"
                defaultValue={yyyyMmDd(lease.startDate)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-600">End date (optional)</label>
              <input
                name="endDate"
                type="date"
                defaultValue={yyyyMmDd(lease.endDate)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="submit"
              className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Save changes
            </button>

            <a
              href={`/admin/leases/${lease.id}`}
              className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              Cancel
            </a>
          </div>

          <p className="text-xs text-neutral-500">
            Tip: if you set status to <span className="font-semibold">completed</span>, consider also setting an end
            date for reporting.
          </p>
        </form>
      </div>

      {/* Payments */}
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4">
          <p className="font-semibold">Payment schedule</p>
        </div>

        <div className="grid grid-cols-4 bg-neutral-50 px-5 py-3 text-xs font-semibold text-neutral-700">
          <div>Due date</div>
          <div>Amount</div>
          <div>Status</div>
          <div>Paid</div>
        </div>

        {lease.payments.length === 0 ? (
          <div className="p-5 text-sm text-neutral-600">No payment schedule generated yet.</div>
        ) : (
          lease.payments.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-4 border-t border-neutral-100 px-5 py-3 text-sm"
            >
              <div>{dateAU(p.dueDate)}</div>
              <div className="font-semibold">{money(p.amount)}</div>
              <div>{p.status}</div>
              <div>{dateAU(p.paidAt)}</div>
            </div>
          ))
        )}
      </div>

      {/* Fees */}
      {lease.fees.length > 0 ? (
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-4">
            <p className="font-semibold">Late fees</p>
          </div>

          {lease.fees.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 text-sm"
            >
              <span>{dateAU(f.dateApplied)}</span>
              <span className="font-semibold">{money(f.amount)}</span>
              <span className="text-xs text-neutral-500">{f.waived ? "Waived" : "Applied"}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
