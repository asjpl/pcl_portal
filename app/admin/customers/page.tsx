// apps/portal/app/admin/customers/page.tsx

import Link from "next/link";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Customers</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Manage customer accounts, contact details and driver information.
          </p>
        </div>

        <Link
          href="/admin/customers/new"
          className="inline-flex items-center justify-center rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-neutral-800"
        >
          Add customer
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full border-collapse">
          <thead className="bg-neutral-50">
            <tr className="text-left text-xs font-semibold text-neutral-600">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                className="border-t border-neutral-100 text-sm text-neutral-800"
              >
                <td className="px-4 py-3">
                  <div className="font-semibold">{customer.fullName}</div>
                  <div className="text-xs text-neutral-500">
                    DOB:{" "}
                    {new Date(customer.dateOfBirth).toLocaleDateString("en-AU")}
                  </div>
                </td>

                <td className="px-4 py-3">
                  {customer.email || customer.user.email}
                </td>

                <td className="px-4 py-3">{customer.phoneE164}</td>

                <td className="px-4 py-3">
                  {customer.companyName || "—"}
                </td>

                <td className="px-4 py-3">
                  {new Date(customer.createdAt).toLocaleDateString("en-AU")}
                </td>

                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="font-semibold text-neutral-900 no-underline hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {customers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-neutral-600"
                >
                  No customers found. Add your first customer to get started.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
