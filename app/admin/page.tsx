// apps/portal/app/admin/page.tsx

export const runtime = "nodejs";

export default async function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Welcome to the Admin Dashboard
        </h2>
        <p className="mt-2 text-sm text-neutral-600 max-w-2xl">
          From here you can manage customers, vehicles, leases, and portal
          communications for Perth Car Leasing.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold text-neutral-500">CUSTOMERS</p>
          <p className="mt-2 text-sm text-neutral-700">
            Create and manage customer accounts, driver details, and contact
            information.
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold text-neutral-500">VEHICLES</p>
          <p className="mt-2 text-sm text-neutral-700">
            Add vehicles, update registrations and kilometres, and manage
            availability.
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold text-neutral-500">LEASES</p>
          <p className="mt-2 text-sm text-neutral-700">
            Assign vehicles to customers, manage plans, and monitor lease
            status.
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold text-neutral-500">PAYMENTS</p>
          <p className="mt-2 text-sm text-neutral-700">
            Review payment schedules, failed payments, and late fees.
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-xs font-semibold text-neutral-500">MESSAGES</p>
          <p className="mt-2 text-sm text-neutral-700">
            View SMS history and customer communication activity.
          </p>
        </div>
      </div>
    </div>
  );
}
