// app/admin/customers/[id]/page.tsx
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/session";
import ComposePanelClient from "./compose-panel.client";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  if (!id) notFound();

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      smsMessages: { orderBy: { sentAt: "desc" }, take: 200 },
      events: { orderBy: { createdAt: "desc" }, take: 200 },
      leases: {
        orderBy: { createdAt: "desc" },
        include: { vehicle: true },
        take: 20,
      },
    },
  });

  if (!customer) notFound();

  const emailEvents = customer.events.filter((e) => e.type === "email_sent");
  const smsEvents = customer.events.filter((e) => e.type === "sms_sent" || e.type === "sms_received");

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-3xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500">CUSTOMER</p>
            <h1 className="mt-1 text-xl font-semibold">{customer.fullName}</h1>
            <p className="mt-1 text-sm text-neutral-600">
              {customer.companyName ? <span className="font-semibold">{customer.companyName}</span> : null}
              {customer.companyName ? " • " : null}
              {customer.email} • {customer.phoneE164}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700">
            Updated {fmtDate(customer.updatedAt)}
          </div>
        </div>
      </div>

      {/* Composer + leases */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold">Send message</p>
          <p className="mt-1 text-xs text-neutral-500">
            Admins can send SMS (ClickSend) or Email (SES). SMS replies are captured via webhook.
          </p>

          <ComposePanelClient
            customerId={customer.id}
            customerEmail={customer.email}
            customerPhone={customer.phoneE164}
          />

          {smsEvents.length ? (
            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
              <span className="font-semibold">Recent activity:</span>{" "}
              {smsEvents.slice(0, 3).map((e, idx) => (
                <span key={e.id}>
                  {idx ? " • " : ""}
                  {e.type === "sms_sent" ? "SMS sent" : "SMS received"} ({fmtDate(e.createdAt)})
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold">Leases</p>

          <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200">
            <div className="grid grid-cols-3 bg-neutral-50 text-xs font-semibold text-neutral-700">
              <div className="p-3">Plan</div>
              <div className="p-3">Vehicle</div>
              <div className="p-3">Status</div>
            </div>

            {customer.leases.map((l) => (
              <div key={l.id} className="grid grid-cols-3 border-t border-neutral-100 text-sm">
                <div className="p-3 text-neutral-800">{l.planName}</div>
                <div className="p-3 text-neutral-700">
                  {l.vehicle?.regoNumber} — {l.vehicle?.title}
                </div>
                <div className="p-3 text-neutral-700">{l.status}</div>
              </div>
            ))}

            {customer.leases.length === 0 ? (
              <div className="p-4 text-sm text-neutral-600">No leases yet.</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold">SMS history</p>
          <p className="mt-1 text-xs text-neutral-500">Showing latest 200.</p>

          <div className="mt-3 space-y-2">
            {customer.smsMessages.map((m) => (
              <div key={m.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-neutral-600">
                    {m.direction === "outbound" ? "Outbound" : "Inbound"} • {fmtDate(m.sentAt)}
                  </p>
                  <p className="text-[11px] font-semibold text-neutral-500">
                    {m.providerSid ? `SID: ${m.providerSid}` : m.provider}
                  </p>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{m.body}</p>

                <p className="mt-2 text-xs text-neutral-500">
                  From {m.fromE164} → To {m.toE164}
                </p>
              </div>
            ))}

            {customer.smsMessages.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                No SMS history yet. Send a message above.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold">Email history</p>
          <p className="mt-1 text-xs text-neutral-500">Tracked from Customer Events (email_sent).</p>

          <div className="mt-3 space-y-2">
            {emailEvents.map((e) => {
              const payload = (e.payload ?? {}) as any;
              const subject = String(payload?.subject || "Email");
              const body = String(payload?.body || "");
              const to = String(payload?.to || "");

              return (
                <div key={e.id} className="rounded-2xl border border-neutral-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-neutral-600">{fmtDate(e.createdAt)}</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{subject}</p>
                      {to ? <p className="mt-1 text-xs text-neutral-500">To: {to}</p> : null}
                    </div>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold text-neutral-700">
                      Email
                    </span>
                  </div>

                  {body ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">{body}</p>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-500">No body stored.</p>
                  )}
                </div>
              );
            })}

            {emailEvents.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                No emails recorded yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
