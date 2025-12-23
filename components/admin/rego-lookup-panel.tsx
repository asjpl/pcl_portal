"use client";

import { useState } from "react";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type ApplyData = {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  colour?: string | null;
  bodyType?: string | null;
  fuelType?: string | null;
  vin?: string | null;
  raw?: any;
};

function pickText(obj: any, keys: string[]) {
  for (const k of keys) {
    const v = obj?.[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    const nested = obj?.[k]?.CurrentTextValue;
    if (typeof nested === "string" && nested.trim()) return nested.trim();
  }
  return null;
}

function pickNumber(obj: any, keys: string[]) {
  const t = pickText(obj, keys);
  if (!t) return null;
  const n = Number(String(t).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function RegoLookupPanel({
  regoNumber,
  state,
  onApply,
}: {
  regoNumber: string;
  state: string;
  onApply: (data: ApplyData) => Promise<void>;
}) {
  const [rego, setRego] = useState(regoNumber);
  const [st, setSt] = useState(state || "WA");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  async function runLookup() {
    setError(null);
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/admin/regcheck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regoNumber: rego, state: st }),
    });

    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok || !json?.ok) {
      setError(json?.error || "Lookup failed.");
      return;
    }

    setResult(json.data);
  }

  async function apply() {
    if (!result) return;

    // These keys are based on common RegCheck structures (some are nested objects with CurrentTextValue).
    const make = pickText(result, ["MakeDescription", "CarMake", "Make"]);
    const model = pickText(result, ["ModelDescription", "CarModel", "Model"]);
    const colour = pickText(result, ["Colour", "Color", "VehicleColour"]);
    const bodyType = pickText(result, ["Body", "BodyType"]);
    const fuelType = pickText(result, ["FuelType", "Fuel"]);
    const vin = pickText(result, ["VehicleIdentificationNumber", "VIN", "Vin"]);
    const year = pickNumber(result, ["RegistrationYear", "Year"]);

    setApplying(true);
    try {
      await onApply({ make, model, colour, bodyType, fuelType, vin, year, raw: result });
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold">RegCheck lookup</p>
          <p className="mt-1 text-xs text-neutral-600">
            Lookup Australian registration details and apply fields to this vehicle.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={runLookup}
            disabled={loading}
            className={cn(
              "rounded-2xl px-4 py-3 text-sm font-semibold",
              loading ? "bg-neutral-300 text-neutral-700" : "bg-neutral-900 text-white hover:bg-neutral-800"
            )}
          >
            {loading ? "Looking up…" : "Run lookup"}
          </button>

          <button
            type="button"
            onClick={apply}
            disabled={!result || applying}
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-semibold",
              !result || applying
                ? "border-neutral-200 bg-white text-neutral-400"
                : "border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50"
            )}
          >
            {applying ? "Applying…" : "Apply to vehicle"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-neutral-700">Rego</label>
          <input
            value={rego}
            onChange={(e) => setRego(e.target.value.toUpperCase())}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-700">State</label>
          <input
            value={st}
            onChange={(e) => setSt(e.target.value.toUpperCase())}
            placeholder="WA"
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100"
          />
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold text-neutral-600">Lookup result (preview)</p>
          <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap text-xs text-neutral-800">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
