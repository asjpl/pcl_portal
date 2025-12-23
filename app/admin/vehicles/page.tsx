// apps/portal/app/admin/vehicles/page.tsx

import Link from "next/link";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export default async function AdminVehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Vehicles</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Manage vehicle inventory, registrations and kilometre readings.
          </p>
        </div>

        <Link
          href="/admin/vehicles/new"
          className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-neutral-800"
        >
          Add vehicle
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-neutral-50">
            <tr className="text-left text-xs font-semibold text-neutral-600">
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Rego</th>
              <th className="px-4 py-3">KMs</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {vehicles.map((vehicle) => (
              <tr
                key={vehicle.id}
                className="border-t border-neutral-100 text-sm text-neutral-800"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold">{vehicle.title}</div>
                  {vehicle.make || vehicle.model ? (
                    <div className="text-xs text-neutral-500">
                      {[vehicle.make, vehicle.model].filter(Boolean).join(" ")}
                    </div>
                  ) : null}
                </td>

                <td className="px-4 py-3">{vehicle.category}</td>

                <td className="px-4 py-3">
                  <span className="font-semibold">{vehicle.regoNumber}</span>
                  {vehicle.state ? (
                    <span className="text-xs text-neutral-500">
                      {" "}
                      ({vehicle.state})
                    </span>
                  ) : null}
                </td>

                <td className="px-4 py-3">
                  {vehicle.currentKms.toLocaleString("en-AU")}
                </td>

                <td className="px-4 py-3">
                  {new Date(vehicle.createdAt).toLocaleDateString("en-AU")}
                </td>

                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/vehicles/${vehicle.slug}`}
                    className="font-semibold text-neutral-900 no-underline hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {vehicles.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-neutral-600"
                >
                  No vehicles found. Add your first vehicle to get started.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
