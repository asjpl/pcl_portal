// app/account/profile/page.tsx
import { redirect } from "next/navigation";
import { requireUser } from "../../../lib/session";
import { prisma } from "../../../lib/prisma";

export default async function AccountProfilePage() {
  const user = await requireUser();

  if (user.role !== "customer") {
    redirect("/admin");
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
  });

  if (!customer) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Customer profile not found. Please contact support.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <header>
        <h1 className="text-xl font-semibold">Your profile</h1>
        <p className="mt-1 text-sm text-neutral-600">
          View your account details and update your contact information.
        </p>
      </header>

      {/* Read-only legal info */}
      <section className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
        <h2 className="text-sm font-semibold text-neutral-800">
          Legal information (read-only)
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <p className="text-neutral-500">Full legal name</p>
            <p className="font-semibold">{customer.fullName}</p>
          </div>

          {customer.companyName && (
            <div>
              <p className="text-neutral-500">Company</p>
              <p className="font-semibold">{customer.companyName}</p>
            </div>
          )}

          <div>
            <p className="text-neutral-500">Residential address</p>
            <p className="font-semibold">
              {customer.addressLine1}
              {customer.addressLine2 ? `, ${customer.addressLine2}` : ""}
              <br />
              {customer.suburb} {customer.state} {customer.postcode}
            </p>
          </div>

          <div>
            <p className="text-neutral-500">Date of birth</p>
            <p className="font-semibold">
              {customer.dateOfBirth.toLocaleDateString("en-AU")}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-500">
          To change legal or address details, please contact Perth Car Leasing support.
        </p>
      </section>

      {/* Editable contact info */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-800">
          Contact details
        </h2>

        <form
          action="/api/profile"
          method="post"
          className="mt-4 space-y-4"
        >
          <div>
            <label className="text-xs font-semibold text-neutral-600">
              Email address
            </label>
            <input
              name="email"
              defaultValue={customer.email}
              type="email"
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-600">
              Phone number
            </label>
            <input
              name="phoneE164"
              defaultValue={customer.phoneE164}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              placeholder="+614XXXXXXXX"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              Save changes
            </button>
          </div>
        </form>
      </section>

      {/* Payments */}
      <section className="rounded-3xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-800">
          Payments
        </h2>

        <p className="mt-2 text-sm text-neutral-600">
          Manage your payment method securely through our billing provider.
        </p>

        <form action="/api/billing/portal" method="post" className="mt-4">
          <button
            type="submit"
            className="rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold hover:bg-neutral-50"
          >
            Manage payment method
          </button>
        </form>
      </section>
    </div>
  );
}
