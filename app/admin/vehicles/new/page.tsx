// app/admin/vehicles/new/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function val(v: any): string {
  if (!v) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  if (typeof v === "object") {
    return v.CurrentTextValue ?? v.Value ?? v.Text ?? "";
  }
  return "";
}

function toInt(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function fuelCodeToLabel(code: string) {
  const c = (code || "").toUpperCase().trim();
  if (!c) return "";
  // RegCheck "extended.fuelType" often uses AU codes
  if (c === "P") return "Petrol";
  if (c === "D") return "Diesel";
  if (c === "E") return "Electric";
  if (c === "H") return "Hybrid";
  if (c === "L") return "LPG";
  return c;
}

export default function NewVehiclePage() {
  const router = useRouter();

  const [rego, setRego] = useState("");
  const [state, setState] = useState("WA");
  const [category, setCategory] = useState("");
  const [currentKms, setCurrentKms] = useState<number>(0);

  const [loadingLookup, setLoadingLookup] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<string | null>(null);
  const [lastRegcheck, setLastRegcheck] = useState<any | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [fields, setFields] = useState({
    title: "",
    make: "",
    model: "",
    year: "",
    colour: "",
    bodyType: "",
    fuelType: "",
    vin: "",
  });

  const canLookup = useMemo(() => rego.trim().length >= 3, [rego]);

  function setField(key: keyof typeof fields, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  // Real-time lookup (debounced)
  useEffect(() => {
    if (!canLookup) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoadingLookup(true);
      setLookupMsg(null);
      setLastRegcheck(null);

      try {
        const res = await fetch("/api/rego-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rego, state }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok) {
          setLookupMsg(json?.error || "Lookup failed.");
          setLoadingLookup(false);
          return;
        }

        if (!json?.found) {
          setLookupMsg("No vehicle data found for that rego.");
          setLoadingLookup(false);
          return;
        }

        const d = json.data;
        setLastRegcheck(d);

        const make = val(d.CarMake) || val(d.MakeDescription);
        const model = val(d.ModelDescription);
        const year = val(d.RegistrationYear);
        const bodyType = val(d.BodyStyle);
        const colour = val(d.Colour);
        const fuelType = fuelCodeToLabel(val(d.extended?.fuelType));
        const variant = val(d.extended?.variant);

        setFields((prev) => ({
          ...prev,
          make: make || prev.make,
          model: model || prev.model,
          year: year || prev.year,
          bodyType: bodyType || prev.bodyType,
          colour: colour || prev.colour,
          fuelType: fuelType || prev.fuelType,

          // RegCheck AU typically doesn't provide a real VIN (NVIC != VIN)
          vin: prev.vin,

          title:
            prev.title ||
            [year, make, model, variant].filter(Boolean).join(" "),
        }));

        setLookupMsg("RegCheck verified ✓");
      } catch {
        setLookupMsg("Lookup failed.");
      } finally {
        setLoadingLookup(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rego, state, canLookup]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const regoNumber = rego.toUpperCase().trim();
    const st = state.toUpperCase().trim() || "WA";

    if (!regoNumber) {
      setSubmitError("Rego is required.");
      setSubmitting(false);
      return;
    }
    if (!category.trim()) {
      setSubmitError("Category is required.");
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/admin/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        regoNumber,
        state: st,
        category: category.trim(),
        currentKms: Number(currentKms) || 0,

        title: fields.title.trim() || null,
        make: fields.make.trim() || null,
        model: fields.model.trim() || null,
        year: toInt(fields.year),
        colour: fields.colour.trim() || null,
        bodyType: fields.bodyType.trim() || null,
        fuelType: fields.fuelType.trim() || null,
        vin: fields.vin.trim() || null,

        regcheckRaw: lastRegcheck ?? null,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setSubmitError(data?.error || "Failed to add vehicle.");
      setSubmitting(false);
      return;
    }

    router.push(`/admin/vehicles/${data.slug}`);
  }

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="text-xl font-semibold">Add vehicle</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Type the rego to auto-populate from RegCheck. You can override any field before saving.
        </p>
      </header>

      {submitError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Lookup */}
        <section className="space-y-3 rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold text-neutral-800">Registration lookup</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-neutral-600">Rego</label>
              <input
                name="regoNumber"
                value={rego}
                onChange={(e) => setRego(e.target.value.toUpperCase())}
                placeholder="e.g. 1ABC123"
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-600">State</label>
              <input
                name="state"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="WA"
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Category</label>
              <input
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="SUV / Ute / Van / Sedan"
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-600">Current kms</label>
              <input
                name="currentKms"
                type="number"
                min={0}
                value={currentKms}
                onChange={(e) => setCurrentKms(Number(e.target.value || 0))}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="text-xs text-neutral-600">
            {loadingLookup ? "Looking up vehicle…" : lookupMsg ? lookupMsg : " "}
          </div>
        </section>

        {/* Details */}
        <section className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold text-neutral-800">Vehicle details</p>

          <div>
            <label className="text-xs font-semibold text-neutral-600">Title</label>
            <input
              name="title"
              value={fields.title}
              onChange={(e) => setField("title", e.target.value)}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              placeholder="Auto-generated if blank"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Make</label>
              <input
                name="make"
                value={fields.make}
                onChange={(e) => setField("make", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">Model</label>
              <input
                name="model"
                value={fields.model}
                onChange={(e) => setField("model", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">Year</label>
              <input
                name="year"
                value={fields.year}
                onChange={(e) => setField("year", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Body type</label>
              <input
                name="bodyType"
                value={fields.bodyType}
                onChange={(e) => setField("bodyType", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">Fuel type</label>
              <input
                name="fuelType"
                value={fields.fuelType}
                onChange={(e) => setField("fuelType", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Colour</label>
              <input
                name="colour"
                value={fields.colour}
                onChange={(e) => setField("colour", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">VIN (manual)</label>
              <input
                name="vin"
                value={fields.vin}
                onChange={(e) => setField("vin", e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <p className="text-xs text-neutral-500">
            Note: RegCheck AU often returns NVIC, not a full VIN. Keep VIN manual if required.
          </p>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Adding…" : "Add vehicle"}
          </button>
          <a
            href="/admin/vehicles"
            className="rounded-2xl border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-700 no-underline hover:bg-neutral-50"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
