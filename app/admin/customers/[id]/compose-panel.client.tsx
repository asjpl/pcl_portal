// app/admin/customers/[id]/compose-panel.client.tsx
"use client";

import { useState } from "react";

function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export default function ComposePanelClient({
  customerId,
  customerEmail,
  customerPhone,
}: {
  customerId: string;
  customerEmail: string;
  customerPhone: string;
}) {
  const [tab, setTab] = useState<"sms" | "email">("sms");
  const [subject, setSubject] = useState("Message from Perth Car Leasing");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    setMsg(null);
    setSending(true);

    const res = await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: tab,
        customerId,
        subject: tab === "email" ? subject : undefined,
        body,
      }),
    });

    const json = await res.json().catch(() => ({}));
    setSending(false);

    if (!res.ok) {
      setMsg(json?.error || "Failed to send.");
      return;
    }

    setBody("");
    setMsg(tab === "sms" ? "SMS sent ✓" : "Email sent ✓");
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("sms")}
          className={cn(
            "rounded-2xl px-4 py-2 text-sm font-semibold border",
            tab === "sms" ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50"
          )}
        >
          SMS
        </button>
        <button
          type="button"
          onClick={() => setTab("email")}
          className={cn(
            "rounded-2xl px-4 py-2 text-sm font-semibold border",
            tab === "email" ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-900 border-neutral-200 hover:bg-neutral-50"
          )}
        >
          Email
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
        <div>
          <span className="font-semibold">To:</span>{" "}
          {tab === "sms" ? customerPhone : customerEmail}
        </div>
      </div>

      {tab === "email" ? (
        <div>
          <label className="text-xs font-semibold text-neutral-600">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
          />
        </div>
      ) : null}

      <div>
        <label className="text-xs font-semibold text-neutral-600">Message</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 h-32 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
          placeholder={tab === "sms" ? "Type SMS…" : "Type email…"}
        />
        <p className="mt-2 text-xs text-neutral-500">
          {tab === "sms"
            ? "Replies will appear in SMS history once ClickSend webhook is configured."
            : "Emails are logged in customer events as email_sent."}
        </p>
      </div>

      {msg ? (
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800">
          {msg}
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={send}
          disabled={sending || !body.trim()}
          className="rounded-2xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {sending ? "Sending…" : "Send"}
        </button>

        <button
          type="button"
          onClick={() => setBody("")}
          className="rounded-2xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
