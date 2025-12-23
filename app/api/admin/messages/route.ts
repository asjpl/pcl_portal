// app/api/admin/messages/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/session";
import {
  sendClickSendSms,
  normalizeAuPhoneToE164,
  PCL_OUTBOUND_E164,
} from "../../../../lib/clicksend";
import { sendEmailSES } from "../../../../lib/ses";
import { buildGenericSaaSEmailHtml } from "../../../../lib/email-templates";

export async function POST(req: Request) {
  const admin = await requireAdmin();

  const body = await req.json().catch(() => ({}));

  const channel = String(body.channel || "");
  const customerId = String(body.customerId || "");
  const messageBody = String(body.body || "").trim();

  if (!customerId) {
    return NextResponse.json(
      { error: "customerId is required." },
      { status: 400 }
    );
  }
  if (!messageBody) {
    return NextResponse.json(
      { error: "Message body is required." },
      { status: 400 }
    );
  }
  if (channel !== "sms" && channel !== "email") {
    return NextResponse.json(
      { error: "channel must be 'sms' or 'email'." },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      fullName: true,
      companyName: true,
      email: true,
      phoneE164: true,
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  // -------------------------
  // SMS
  // -------------------------
  if (channel === "sms") {
    const toE164 = normalizeAuPhoneToE164(customer.phoneE164);

    const result = await sendClickSendSms({
      toE164,
      fromE164: PCL_OUTBOUND_E164,
      body: messageBody,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "SMS failed.", raw: result.raw },
        { status: 400 }
      );
    }

    const sms = await prisma.smsMessage.create({
      data: {
        customerId: customer.id,
        direction: "outbound",
        fromE164: PCL_OUTBOUND_E164,
        toE164,
        body: messageBody,
        mediaUrls: null,
        provider: "clicksend",
        providerSid: result.providerSid || null,
        sentAt: new Date(),
      },
    });

    await prisma.customerEvent.create({
      data: {
        customerId: customer.id,
        type: "sms_sent",
        payload: {
          byAdminUserId: admin.id,
          provider: "clicksend",
          smsId: sms.id,
          to: toE164,
          body: messageBody,
        },
      },
    });

    return NextResponse.json({ ok: true, smsId: sms.id });
  }

  // -------------------------
  // EMAIL (SaaS HTML)
  // -------------------------
  const subject =
    String(body.subject || "").trim() || "Message from Perth Car Leasing";

  // If you later re-add portal URLs, you can switch these easily.
  const websiteUrl =
    process.env.WEBSITE_URL || "https://perthcarleasing.com.au";
  const supportEmail =
    process.env.SUPPORT_EMAIL || "support@perthcarleasing.com.au";

  const title =
    String(body.title || "").trim() ||
    "Message from Perth Car Leasing";

  const subtitle =
    String(body.subtitle || "").trim() ||
    `Regarding: ${customer.fullName}${
      customer.companyName ? ` (${customer.companyName})` : ""
    }`;

  const ctaHref = String(body.ctaHref || "").trim(); // optional
  const ctaLabel = String(body.ctaLabel || "").trim(); // optional

  const quickLinks =
    Array.isArray(body.quickLinks) && body.quickLinks.length
      ? body.quickLinks
          .map((x: any) => ({
            label: String(x?.label || "").trim(),
            href: String(x?.href || "").trim(),
          }))
          .filter((x: any) => x.label && x.href)
          .slice(0, 6)
      : [
          { label: "Website", href: websiteUrl },
          { label: "Support", href: `mailto:${supportEmail}` },
        ];

  const html = buildGenericSaaSEmailHtml({
    subject,
    title,
    subtitle,
    bodyText: messageBody,
    cta:
      ctaHref && ctaLabel
        ? { label: ctaLabel, href: ctaHref }
        : undefined,
    quickLinks,
    productName: "Perth Car Leasing",
    websiteUrl,
    supportEmail,
    footerNote:
      "This message was sent via the Perth Car Leasing portal by an authorised administrator.",
  });

  // Provide a clean text alternative too (some clients show it)
  const text = [
    title,
    subtitle ? subtitle : "",
    "",
    messageBody,
    "",
    `Website: ${websiteUrl}`,
    `Support: ${supportEmail}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await sendEmailSES({
      to: customer.email,
      subject,
      html,
      text,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Email send failed." },
      { status: 400 }
    );
  }

  await prisma.customerEvent.create({
    data: {
      customerId: customer.id,
      type: "email_sent",
      payload: {
        byAdminUserId: admin.id,
        to: customer.email,
        subject,
        title,
        subtitle,
        body: messageBody,
        cta: ctaHref && ctaLabel ? { label: ctaLabel, href: ctaHref } : null,
      },
    },
  });

  return NextResponse.json({ ok: true });
}
