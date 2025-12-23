// app/admin/customers/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function toISODate(value: string) {
  // expects yyyy-mm-dd (from input[type=date])
  return value ? new Date(value).toISOString() : "";
}

export default function NewCustomerPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [driversLicenceNumber, setDriversLicenceNumber] = useState("");
  const [driversLicenceState, setDriversLicenceState] = useState("WA");
  const [driversLicenceExpiry, setDriversLicenceExpiry] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("WA");
  const [postcode, setPostcode] = useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      companyName: companyName.trim() || null,
      fullName: fullName.trim(),
      driversLicenceNumber: driversLicenceNumber.trim(),
      driversLicenceState: driversLicenceState.trim(),
      driversLicenceExpiry: toISODate(driversLicenceExpiry),
      dateOfBirth: toISODate(dateOfBirth),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || null,
      suburb: suburb.trim(),
      state: state.trim(),
      postcode: postcode.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
    };

    const res = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(json?.error || "Failed to create customer.");
      return;
    }

    // ✅ This proves the API route was hit and what it returned
    // json includes emailSent/emailError/tempPassword (dev)
    const createdEmail = encodeURIComponent(payload.email);
    const temp = encodeURIComponent(json?.tempPassword || "");
    router.push(`/admin/customers?created=${createdEmail}&temp=${temp}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Add customer</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Create a portal customer and send onboarding email via SES.
        </p>
      </header>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6">
        <section className="rounded-3xl border border-neutral-200 bg-white p-5 space-y-3">
          <p className="text-sm font-semibold">Customer details</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Company name (optional)</label>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">Customer / Hirer name *</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-neutral-600">DOB *</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">Phone *</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="04xx xxx xxx"
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">Email *</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                type="email"
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-5 space-y-3">
          <p className="text-sm font-semibold">Driver licence</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Licence number *</label>
              <input
                value={driversLicenceNumber}
                onChange={(e) => setDriversLicenceNumber(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">State *</label>
              <input
                value={driversLicenceState}
                onChange={(e) => setDriversLicenceState(e.target.value.toUpperCase())}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">Expiry *</label>
              <input
                type="date"
                value={driversLicenceExpiry}
                onChange={(e) => setDriversLicenceExpiry(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-5 space-y-3">
          <p className="text-sm font-semibold">Residential address</p>

          <div>
            <label className="text-xs font-semibold text-neutral-600">Address line 1 *</label>
            <input
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              required
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-600">Address line 2 (optional)</label>
            <input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-neutral-600">Suburb *</label>
              <input
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">State *</label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600">Postcode *</label>
              <input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>
          </div>
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create customer"}
          </button>

          <a
            href="/admin/customers"
            className="rounded-2xl border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-700 no-underline hover:bg-neutral-50"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
