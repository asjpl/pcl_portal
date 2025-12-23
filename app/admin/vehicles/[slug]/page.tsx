// app/admin/vehicles/[slug]/page.tsx
export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/session";

function row(label: string, value: React.ReactNode) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="text-sm font-semibold text-neutral-900 text-right">
        {value}
      </div>
    </div>
  );
}

function dash(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export default async function AdminVehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireUser();
  if (user.role !== "admin") notFound();

  const { slug } = await params;
  if (!slug) notFound();

  const vehicle = await prisma.vehicle.findUnique({
    where: { slug },
    // include leases later if needed
  });

  if (!vehicle) notFound();

  const verified = Boolean(vehicle.regcheckVerifiedAt);
  const hasRegcheckRaw = Boolean(vehicle.regcheckRaw);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">{vehicle.title}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {vehicle.regoNumber}
            {vehicle.state ? ` (${vehicle.state})` : ""} • {vehicle.category}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {verified ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              ✔ Verified by RegCheck
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
              Not verified
            </span>
          )}

          <a
            href="/admin/vehicles"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 no-underline hover:bg-neutral-50"
          >
            Back
          </a>
        </div>
      </div>

      {/* Core summary */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold text-neutral-500">SUMMARY</p>
          <div className="mt-3">
            {row("Registration", dash(vehicle.regoNumber))}
            {row("State", dash(vehicle.state))}
            {row("Category", dash(vehicle.category))}
            {row("Current kms", vehicle.currentKms.toLocaleString("en-AU"))}
            {row("Slug", dash(vehicle.slug))}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold text-neutral-500">REGCHECK DETAILS</p>

          <div className="mt-3">
            {row("Make", dash(vehicle.make))}
            {row("Model", dash(vehicle.model))}
            {row("Year", vehicle.year ?? "—")}
            {row("Colour", dash(vehicle.colour))}
            {row("Body type", dash(vehicle.bodyType))}
            {row("Fuel type", dash(vehicle.fuelType))}
            {row("VIN / NVIC", dash(vehicle.vin))}
            {row("RegCheck raw", hasRegcheckRaw ? "Stored" : "—")}
            {row(
              "Verified at",
              vehicle.regcheckVerifiedAt
                ? new Date(vehicle.regcheckVerifiedAt).toLocaleString("en-AU")
                : "—"
            )}
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            Note: RegCheck AU sometimes returns NVIC rather than a full VIN.
          </p>
        </div>
      </div>

      {/* Optional: show a compact raw snippet for debugging */}
      {hasRegcheckRaw ? (
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">RegCheck raw payload</p>
              <p className="mt-1 text-xs text-neutral-500">
                Helpful for debugging when fields don’t map as expected.
              </p>
            </div>
          </div>

          <pre className="mt-4 max-h-[360px] overflow-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-800">
{JSON.stringify(vehicle.regcheckRaw, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
