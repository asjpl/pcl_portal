// app/login/login.client.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function LoginClient() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(json?.error || "Login failed.");
      return;
    }

    // Your /api/auth/login returns { ok: true, role: "admin"|"customer" }
    const role = json?.role;
    if (role === "admin") router.push("/admin");
    else router.push("/account");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-700">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
          className={cn(
            "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none",
            "transition focus:border-neutral-300 focus:ring-2 focus:ring-neutral-900/10"
          )}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-700">Password</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          type="password"
          autoComplete="current-password"
          className={cn(
            "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none",
            "transition focus:border-neutral-300 focus:ring-2 focus:ring-neutral-900/10"
          )}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white",
          "transition-all hover:-translate-y-[1px] hover:bg-neutral-800 hover:shadow active:translate-y-0",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        )}
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>

      <div className="pt-1 text-center text-xs text-neutral-500">
        Having trouble?{" "}
        <a className="font-semibold text-neutral-700 no-underline hover:underline" href="mailto:helpdesk@hsg.it.com">
          Contact support
        </a>
      </div>
    </form>
  );
}
