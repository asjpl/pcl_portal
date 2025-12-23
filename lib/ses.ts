// lib/ses.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { buildGenericSaaSEmailHtml } from "./email-templates";

type WelcomeEmailInput = {
  to: string;
  loginEmail: string;
  tempPassword: string;
};

function sesClient() {
  const region = process.env.AWS_REGION || "ap-southeast-2";
  return new SESClient({ region });
}

function fromEmail() {
  // You can set: "Perth Car Leasing <emails@pcl.net.au>"
  return process.env.SES_FROM_EMAIL || "Perth Car Leasing <emails@pcl.net.au>";
}

function replyToEmail() {
  return process.env.SES_REPLY_TO || "support@perthcarleasing.com.au";
}

export async function sendEmailSES(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  htmlOnly?: boolean; // ✅ if true, omit text part entirely
}) {
  const body = args.htmlOnly
    ? {
        Html: { Data: args.html, Charset: "UTF-8" as const },
      }
    : {
        Text: { Data: args.text || "", Charset: "UTF-8" as const },
        Html: { Data: args.html, Charset: "UTF-8" as const },
      };

  const cmd = new SendEmailCommand({
    Source: fromEmail(),
    Destination: { ToAddresses: [args.to] },
    ReplyToAddresses: [replyToEmail()],
    Message: {
      Subject: { Data: args.subject, Charset: "UTF-8" },
      Body: body,
    },
    // Optional but helps with deliverability / threading in some clients
    Tags: [{ Name: "app", Value: "pcl-portal" }],
  });

  return sesClient().send(cmd);
}

export async function sendWelcomeEmailSES(input: WelcomeEmailInput) {
  const subject = "Welcome to Perth Car Leasing — Portal Access";

  const portalUrl =
    process.env.PORTAL_URL ||
    process.env.NEXT_PUBLIC_PORTAL_URL ||
    "https://my.perthcarleasing.com.au";

  const title = "Welcome — your portal access is ready";
  const subtitle = "Use the details below to sign in. You’ll be prompted to reset your password.";

  const bodyText = [
    "Hi,",
    "",
    "Your Perth Car Leasing portal account has been created.",
    "",
    `Login email: ${input.loginEmail}`,
    `Temporary password: ${input.tempPassword}`,
    "",
    "For security, you will be required to reset your password on first login.",
  ].join("\n");

  const html = buildGenericSaaSEmailHtml({
    subject,
    title,
    subtitle,
    bodyText,
    cta: { label: "Open portal", href: portalUrl },
    quickLinks: [
      { label: "Visit website", href: "https://perthcarleasing.com.au" },
      { label: "Support", href: "mailto:support@perthcarleasing.com.au" },
    ],
    productName: "Perth Car Leasing",
    websiteUrl: "https://perthcarleasing.com.au",
    supportEmail: "support@perthcarleasing.com.au",
    footerNote: "If you did not request this account, please contact support.",
  });

  // ✅ Send HTML-only to prove HTML is actually being delivered
  return sendEmailSES({
    to: input.to,
    subject,
    html,
    htmlOnly: true,
  });
}

export async function sendAdminGenericEmailSES(args: {
  to: string;
  subject: string;
  title: string;
  subtitle?: string;
  bodyText: string;
  cta?: { label: string; href: string };
  quickLinks?: { label: string; href: string }[];
}) {
  const html = buildGenericSaaSEmailHtml({
    subject: args.subject,
    title: args.title,
    subtitle: args.subtitle,
    bodyText: args.bodyText,
    cta: args.cta,
    quickLinks:
      args.quickLinks?.length
        ? args.quickLinks
        : [
            { label: "Visit website", href: "https://perthcarleasing.com.au" },
            { label: "Support", href: "mailto:support@perthcarleasing.com.au" },
          ],
    productName: "Perth Car Leasing",
    websiteUrl: "https://perthcarleasing.com.au",
    supportEmail: "support@perthcarleasing.com.au",
  });

  // HTML-only here too (until verified)
  return sendEmailSES({
    to: args.to,
    subject: args.subject,
    html,
    htmlOnly: true,
  });
}
