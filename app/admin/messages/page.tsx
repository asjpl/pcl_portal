// app/admin/messages/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { redirect } from "next/navigation";

function dateTimeAU(d: Date | string) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString("en-AU");
}

function dirLabel(dir: string) {
  return dir === "outbound" ? "Outbound" : "Inbound";
}

export default async function AdminMessagesPage() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/account");

  const messages = await prisma.smsMessage.findMany({
    orderBy: { sentAt: "desc" },
    include: {
      customer: true,
    },
    take: 300,
  });

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Messages</h1>
          <p className="mt-1 text-sm text-neutral-600">
            SMS/MMS history for customers. (Sending will be added next.)
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 no-underline hover:bg-neutral-50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
        <div className="grid grid-cols-12 bg-neutral-50 px-4 py-3 text-xs font-semibold text-neutral-700">
          <div className="col-span-3">Customer</div>
          <div className="col-span-2">Direction</div>
          <div className="col-span-2">From / To</div>
          <div className="col-span-3">Message</div>
          <div className="col-span-2">Sent</div>
        </div>

        {messages.length === 0 ? (
          <div className="p-6 text-sm text-neutral-600">No messages found.</div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className="grid grid-cols-12 items-start border-t border-neutral-100 px-4 py-4 text-sm"
            >
              <div className="col-span-3">
                <p className="font-semibold text-neutral-900">{m.customer.fullName}</p>
                <p className="mt-1 text-xs text-neutral-500">{m.customer.email}</p>
                <p className="mt-1 text-xs text-neutral-500">{m.customer.phoneE164}</p>
              </div>

              <div className="col-span-2">
                <span
                  className={
                    m.direction === "outbound"
                      ? "inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800"
                      : "inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800"
                  }
                >
                  {dirLabel(m.direction)}
                </span>

                <div className="mt-2 text-xs text-neutral-500">
                  Provider: <span className="font-semibold text-neutral-700">{m.provider}</span>
                </div>

                {m.providerSid ? (
                  <div className="mt-1 text-xs text-neutral-500">
                    SID: <span className="font-mono text-[11px] text-neutral-700">{m.providerSid}</span>
                  </div>
                ) : null}
              </div>

              <div className="col-span-2">
                <p className="text-xs text-neutral-500">From</p>
                <p className="font-semibold text-neutral-900">{m.fromE164}</p>
                <p className="mt-2 text-xs text-neutral-500">To</p>
                <p className="font-semibold text-neutral-900">{m.toE164}</p>
              </div>

              <div className="col-span-3">
                <p className="whitespace-pre-wrap text-neutral-800">{m.body}</p>

                {m.mediaUrls ? (
                  <p className="mt-2 text-xs text-neutral-500">
                    Media: <span className="font-mono text-[11px]">{m.mediaUrls}</span>
                  </p>
                ) : null}
              </div>

              <div className="col-span-2">
                <p className="font-semibold text-neutral-900">{dateTimeAU(m.sentAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note */}
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
        <p className="font-semibold">Next steps</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Add “Send SMS” for admins only (outbound number: 0427 526 002).</li>
          <li>Webhook ingestion for inbound SMS → auto-attach by customer phoneE164.</li>
          <li>Thread view per customer and per lease.</li>
        </ul>
      </div>
    </div>
  );
}
