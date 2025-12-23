// app/login/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "../../lib/session";
import LoginClient from "./login.client";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();

  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "customer") redirect("/account");

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* subtle background polish */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(900px 500px at 20% 10%, rgba(0,0,0,0.06), transparent 60%), radial-gradient(900px 500px at 80% 20%, rgba(0,0,0,0.04), transparent 55%), linear-gradient(to bottom, rgba(255,255,255,1), rgba(250,250,250,1))",
        }}
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2">
        {/* Left: brand + value */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-40">
              {/* Uses your existing logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/pcllogo.png" alt="Perth Car Leasing" className="h-10 w-auto object-contain" />
            </div>
            <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-600 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              Portal
            </span>
          </div>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Sign in to manage your leases, vehicles and customers
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-neutral-600">
              Perth Car Leasing Portal gives admins and customers a single place to manage vehicles, leases, payments and
              communications — securely and in real time.
            </p>
          </div>

          <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
            <Feature
              title="Secure access"
              desc="Session-based login and password reset on first sign-in."
            />
            <Feature
              title="Fast workflows"
              desc="Create leases, manage customers, and track messages in one place."
            />
            <Feature
              title="Admin + Customer"
              desc="Role-based navigation and pages for each workspace."
            />
            <Feature
              title="Modern dashboard"
              desc="Sticky sidebar, header and footer for a true SaaS experience."
            />
          </div>

          <div className="text-xs text-neutral-500">
            Need help?{" "}
            <a className="font-semibold text-neutral-700 no-underline hover:underline" href="mailto:helpdesk@hsg.it.com">
              Contact support
            </a>
          </div>
        </div>

        {/* Right: login card */}
        <div className="lg:justify-self-end">
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="mb-5">
              <p className="text-sm font-semibold text-neutral-900">Welcome back</p>
              <p className="mt-1 text-sm text-neutral-600">Please sign in to continue.</p>
            </div>

            <LoginClient />

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs font-semibold text-neutral-700">First time logging in?</p>
              <p className="mt-1 text-xs text-neutral-600">
                Use the temporary password sent to your email. You’ll be prompted to reset it after sign-in.
              </p>
            </div>

            <div className="mt-6 text-xs text-neutral-500">
              By continuing you agree to Perth Car Leasing’s internal portal access policies.
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-neutral-500">
            © {new Date().getFullYear()} Lets Perth PTY LTD.
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
      <p className="text-sm font-semibold text-neutral-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-600">{desc}</p>
    </div>
  );
}
