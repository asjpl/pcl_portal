// app/admin/leases/new/new-lease-form.client.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CustomerOption = {
  id: string;
  fullName: string;
  email: string;
  phoneE164: string;
  companyName: string | null;
};

type VehicleOption = {
  id: string;
  title: string;
  regoNumber: string;
  state: string | null;
  category: string;
  currentKms: number;
  regcheckVerifiedAt: Date | null;
};

const PLAN_OPTIONS = [
  {
    key: "silver",
    name: "Silver",
    kmsPerWeek: 280,
    priceFromWeekly: 140,
    bondFrom: 500,
  },
  {
    key: "gold",
    name: "Gold",
    kmsPerWeek: 490,
    priceFromWeekly: 161,
    bondFrom: 700,
  },
  {
    key: "platinum",
    name: "Platinum",
    kmsPerWeek: 700,
    priceFromWeekly: 182,
    bondFrom: 800,
  },
] as const;

function centsFromDollars(d: string) {
  const n = Number(d);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

function isoToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function addMonthsISO(isoDate: string, months: number) {
  // isoDate expected "YYYY-MM-DD"
  const [y, m, d] = isoDate.split("-").map((x) => Number(x));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setMonth(dt.getMonth() + months);
  // keep within valid range automatically handled by JS date
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NewLeaseForm({
  customers,
  vehicles,
}: {
  customers: CustomerOption[];
  vehicles: VehicleOption[];
}) {
  const router = useRouter();

  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [planKey, setPlanKey] = useState<(typeof PLAN_OPTIONS)[number]["key"]>("gold");

  const selectedPlan = useMemo(
    () => PLAN_OPTIONS.find((p) => p.key === planKey)!,
    [planKey]
  );

  const [kmsPerWeek, setKmsPerWeek] = useState<number>(selectedPlan.kmsPerWeek);

  const [weeklyAmount, setWeeklyAmount] = useState<string>(`${selectedPlan.priceFromWeekly}`); // dollars
  const [bondAmount, setBondAmount] = useState<string>(`${selectedPlan.bondFrom}`); // dollars

  const [startDate, setStartDate] = useState<string>(() => isoToday());

  // ✅ NEW: end date required
  const [endDate, setEndDate] = useState<string>(() => addMonthsISO(isoToday(), 2));

  // Track whether admin manually edited endDate (so we don't keep overwriting it)
  const endDateTouchedRef = useRef(false);

  // Update kms / defaults when plan changes
  function onPlanChange(next: (typeof PLAN_OPTIONS)[number]["key"]) {
    setPlanKey(next);
    const plan = PLAN_OPTIONS.find((p) => p.key === next)!;
    setKmsPerWeek(plan.kmsPerWeek);

    // Default weekly + bond from plan
    setWeeklyAmount(`${plan.priceFromWeekly}`);
    setBondAmount(`${plan.bondFrom}`);
  }

  // ✅ NEW: When startDate changes, auto-suggest endDate = start + 2 months
  // (only until admin manually edits end date)
  useEffect(() => {
    if (endDateTouchedRef.current) return;
    if (!startDate) return;
    setEndDate(addMonthsISO(startDate, 2));
  }, [startDate]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!customerId) {
      setError("Please select a customer.");
      setSubmitting(false);
      return;
    }
    if (!vehicleId) {
      setError("Please select a vehicle.");
      setSubmitting(false);
      return;
    }
    if (!startDate) {
      setError("Please choose a start date.");
      setSubmitting(false);
      return;
    }
    if (!endDate) {
      setError("Please choose an end date.");
      setSubmitting(false);
      return;
    }

    const startMs = +new Date(`${startDate}T00:00:00`);
    const endMs = +new Date(`${endDate}T00:00:00`);
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      setError("Invalid date format. Please re-select dates.");
      setSubmitting(false);
      return;
    }
    if (endMs <= startMs) {
      setError("End date must be after the start date.");
      setSubmitting(false);
      return;
    }

    const payload = {
      customerId,
      vehicleId,
      planName: selectedPlan.name,
      kmsPerWeek: Number(kmsPerWeek) || null,
      weeklyAmountCents: centsFromDollars(weeklyAmount),
      bondAmountCents: bondAmount ? centsFromDollars(bondAmount) : null,
      startDate,
      endDate, // ✅ NEW
    };

    const res = await fetch("/api/admin/leases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));

    setSubmitting(false);

    if (!res.ok) {
      setError(json?.error || "Failed to create lease.");
      return;
    }

    router.push("/admin/leases");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Create lease</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Select a customer, vehicle and plan. Kilometres per week will auto-fill from the plan.
        </p>
      </header>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Customer */}
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 space-y-3">
          <p className="text-sm font-semibold text-neutral-800">Customer</p>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} — {c.email}
                {c.companyName ? ` (${c.companyName})` : ""}
              </option>
            ))}
          </select>
        </section>

        {/* Vehicle */}
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 space-y-3">
          <p className="text-sm font-semibold text-neutral-800">Vehicle</p>
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} — {v.regoNumber}
                {v.state ? ` (${v.state})` : ""} — {v.category}
                {v.regcheckVerifiedAt ? " — Verified" : ""}
              </option>
            ))}
          </select>
        </section>

        {/* Plan */}
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 space-y-4">
          <p className="text-sm font-semibold text-neutral-800">Plan</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Plan</label>
              <select
                value={planKey}
                onChange={(e) => onPlanChange(e.target.value as any)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name} — {p.kmsPerWeek} km/wk
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-neutral-500">
                Selected: <span className="font-semibold">{selectedPlan.name}</span>
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-600">
                Included kilometres (per week)
              </label>
              <input
                type="number"
                min={0}
                value={kmsPerWeek}
                onChange={(e) => setKmsPerWeek(Number(e.target.value || 0))}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
              <p className="mt-2 text-xs text-neutral-500">
                Auto-filled from plan, but editable if needed.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <label className="text-xs font-semibold text-neutral-600">Weekly amount (AUD)</label>
              <input
                value={weeklyAmount}
                onChange={(e) => setWeeklyAmount(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                placeholder="e.g. 161"
              />
              <p className="mt-2 text-xs text-neutral-500">Stored as cents in DB.</p>
            </div>

            <div className="lg:col-span-1">
              <label className="text-xs font-semibold text-neutral-600">Bond amount (AUD)</label>
              <input
                value={bondAmount}
                onChange={(e) => setBondAmount(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                placeholder="e.g. 700"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="text-xs font-semibold text-neutral-600">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  endDateTouchedRef.current = false; // allow auto-suggest to follow start date again
                  setStartDate(e.target.value);
                }}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                required
              />
            </div>

            <div className="lg:col-span-1">
              <label className="text-xs font-semibold text-neutral-600">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  endDateTouchedRef.current = true;
                  setEndDate(e.target.value);
                }}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                required
              />
              <p className="mt-2 text-xs text-neutral-500">
                Default: start date + 2 months (editable).
              </p>
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create lease"}
          </button>

          <a
            href="/admin/leases"
            className="rounded-2xl border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-700 no-underline hover:bg-neutral-50"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
