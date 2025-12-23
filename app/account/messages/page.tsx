// app/account/messages/page.tsx
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
}

export default async function AccountMessagesPage() {
  const user = await requireUser();
  if (user.role !== "customer") redirect("/admin");

  // Load customer profile for this user
  const customer = await prisma.customer.findUnique({
    where: { userId: user.id },
    include: {
      smsMessages: { orderBy: { sentAt: "desc" }, take: 200 },
      events: { orderBy: { createdAt: "desc" }, take: 200 },
    },
  });

  if (!customer) {
    return (
      <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
        Your account isn’t linked to a customer profile yet. Please contact support.
      </div>
    );
  }

  const emailEvents = customer.events.filter((e) => e.type === "email_sent");

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-neutral-200 bg-white p-5">
        <h1 className="text-xl font-semibold">Messages</h1>
        <p className="mt-1 text-sm text-neutral-600">
          View your SMS/MMS history with Perth Car Leasing.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold">SMS history</p>
          <p className="mt-1 text-xs text-neutral-500">Latest 200 messages.</p>

          <div className="mt-3 space-y-2">
            {customer.smsMessages.map((m) => (
              <div key={m.id} className="rounded-2xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-neutral-600">
                    {m.direction === "outbound" ? "PCL → You" : "You → PCL"} • {fmtDate(m.sentAt)}
                  </p>
                  <p className="text-[11px] font-semibold text-neutral-500">
                    {m.providerSid ? `SID: ${m.providerSid}` : m.provider}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-800">{m.body}</p>
              </div>
            ))}

            {customer.smsMessages.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                No SMS history yet.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5">
          <p className="text-sm font-semibold">Email history</p>
          <p className="mt-1 text-xs text-neutral-500">Recorded emails (sent to you).</p>

          <div className="mt-3 space-y-2">
            {emailEvents.map((e) => (
              <div key={e.id} className="rounded-2xl border border-neutral-200 p-4">
                <p className="text-xs font-semibold text-neutral-600">{fmtDate(e.createdAt)}</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {String((e.payload as any)?.subject || "Email")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
                  {String((e.payload as any)?.body || "")}
                </p>
              </div>
            ))}

            {emailEvents.length === 0 ? (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                No email history recorded.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
