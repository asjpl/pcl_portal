// app/account/reset-password/reset-password.client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (password.length < 10) {
      setErr("Please use at least 10 characters.");
      return;
    }
    if (password !== password2) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: password }),
    });

    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setErr(json?.error || "Reset failed.");
      return;
    }

    setMsg("Password updated. Please log in again.");
    // safest: force re-login with new token
    setTimeout(() => router.replace("/login"), 800);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4">
      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}
      {msg ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {msg}
        </div>
      ) : null}

      <div>
        <label className="text-xs font-semibold text-neutral-600">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
          placeholder="At least 10 characters"
          required
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-neutral-600">Confirm new password</label>
        <input
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
