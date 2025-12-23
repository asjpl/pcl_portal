// app/account/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "../../lib/session";
import { prisma } from "../../lib/prisma";

export default async function AccountOverviewPage() {
  const user = await requireUser();

  if (user.role !== "customer") {
    redirect("/admin");
  }

  // 🔒 Block access if password reset still required
  if (user.mustResetPassword) {
    redirect("/account/reset-password");
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
    include: {
      leases: {
        where: { status: "active" },
        include: {
          vehicle: true,
          payments: {
            orderBy: { dueDate: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!customer) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Your customer profile could not be found. Please contact support.
      </div>
    );
  }

  const activeLease = customer.leases[0];
  const nextPayment = activeLease?.payments[0];

  return (
    <div className="space-y-6">
      {/* 👤 Customer summary */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Your details</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-neutral-500">Name</p>
            <p className="font-semibold">{customer.fullName}</p>
          </div>

          <div>
            <p className="text-neutral-500">Email</p>
            <p className="font-semibold">{customer.email}</p>
          </div>

          <div>
            <p className="text-neutral-500">Phone</p>
            <p className="font-semibold">{customer.phoneE164}</p>
          </div>

          {customer.companyName && (
            <div>
              <p className="text-neutral-500">Company</p>
              <p className="font-semibold">{customer.companyName}</p>
            </div>
          )}
        </div>
      </section>

      {/* 🚗 Active lease */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Active lease</h2>

        {!activeLease ? (
          <p className="mt-4 text-sm text-neutral-600">
            You do not currently have an active lease.
          </p>
        ) : (
          <div className="mt-4 space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-neutral-500">Vehicle</p>
                <p className="font-semibold">
                  {activeLease.vehicle.title}
                </p>
                <p className="text-xs text-neutral-500">
                  {activeLease.vehicle.regoNumber}
                </p>
              </div>

              <div>
                <p className="text-neutral-500">Plan</p>
                <p className="font-semibold">{activeLease.planName}</p>
              </div>

              <div>
                <p className="text-neutral-500">Weekly amount</p>
                <p className="font-semibold">
                  ${(activeLease.weeklyAmount / 100).toFixed(2)} AUD
                </p>
              </div>

              <div>
                <p className="text-neutral-500">Kilometres / week</p>
                <p className="font-semibold">
                  {activeLease.kmsPerWeek ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-neutral-500">Lease start</p>
                <p className="font-semibold">
                  {activeLease.startDate.toLocaleDateString("en-AU")}
                </p>
              </div>

              {activeLease.endDate && (
                <div>
                  <p className="text-neutral-500">Lease end</p>
                  <p className="font-semibold">
                    {activeLease.endDate.toLocaleDateString("en-AU")}
                  </p>
                </div>
              )}
            </div>

            {/* 💳 Next payment */}
            {nextPayment && (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold text-neutral-500">
                  NEXT PAYMENT
                </p>
                <p className="mt-1 font-semibold">
                  ${(nextPayment.amount / 100).toFixed(2)} due on{" "}
                  {nextPayment.dueDate.toLocaleDateString("en-AU")}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
