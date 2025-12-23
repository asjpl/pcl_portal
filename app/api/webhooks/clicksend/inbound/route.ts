// app/api/webhooks/clicksend/inbound/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { normalizeAuPhoneToE164, PCL_OUTBOUND_E164 } from "../../../../../lib/clicksend";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Optional: add a shared secret query param check here if you want (recommended).
  // e.g. /inbound?token=...
  // const url = new URL(req.url);
  // if (url.searchParams.get("token") !== process.env.CLICKSEND_WEBHOOK_TOKEN) return NextResponse.json({ ok:false }, {status:401});

  const contentType = req.headers.get("content-type") || "";

  let payload: any = null;

  try {
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      payload = Object.fromEntries(form.entries());
    } else {
      // try json, then form
      payload = await req.json().catch(async () => {
        const form = await req.formData();
        return Object.fromEntries(form.entries());
      });
    }
  } catch {
    payload = null;
  }

  // Support common variations
  const fromRaw =
    payload?.from ||
    payload?.From ||
    payload?.source ||
    payload?.sender ||
    payload?.origin ||
    payload?.phone ||
    "";

  const toRaw =
    payload?.to ||
    payload?.To ||
    payload?.destination ||
    payload?.recipient ||
    "";

  const bodyRaw =
    payload?.body ||
    payload?.Body ||
    payload?.message ||
    payload?.Message ||
    payload?.content ||
    "";

  const providerSid =
    payload?.message_id ||
    payload?.messageId ||
    payload?.sms_id ||
    payload?.smsId ||
    payload?.id ||
    null;

  const fromE164 = normalizeAuPhoneToE164(String(fromRaw || ""));
  const toE164 = normalizeAuPhoneToE164(String(toRaw || PCL_OUTBOUND_E164));
  const body = String(bodyRaw || "").trim();

  if (!fromE164 || !body) {
    return NextResponse.json({ ok: false, error: "Missing from/body." }, { status: 400 });
  }

  // Allocate inbound message to customer by phoneE164
  const customer = await prisma.customer.findUnique({
    where: { phoneE164: fromE164 },
    select: { id: true },
  });

  if (!customer) {
    // If you want, store “unmatched inbound” somewhere later.
    return NextResponse.json({ ok: true, unmatched: true });
  }

  const sms = await prisma.smsMessage.create({
    data: {
      customerId: customer.id,
      direction: "inbound",
      fromE164,
      toE164,
      body,
      mediaUrls: null,
      provider: "clicksend",
      providerSid: providerSid ? String(providerSid) : null,
      sentAt: new Date(),
    },
  });

  await prisma.customerEvent.create({
    data: {
      customerId: customer.id,
      type: "sms_received",
      payload: { smsId: sms.id, provider: "clicksend" },
    },
  });

  return NextResponse.json({ ok: true });
}
