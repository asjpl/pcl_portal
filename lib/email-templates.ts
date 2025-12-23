// lib/email-templates.ts

export type SaaSEmailTemplateArgs = {
  subject: string;
  title: string;
  subtitle?: string;

  // Body should be plain text from admin textarea; we’ll convert newlines to <br/>
  bodyText: string;

  // Optional CTA button
  cta?: { label: string; href: string };

  // Optional quick links row
  quickLinks?: { label: string; href: string }[];

  // Brand/meta
  productName: string;       // "Perth Car Leasing"
  websiteUrl: string;        // "https://perthcarleasing.com.au"
  supportEmail: string;      // "support@perthcarleasing.com.au"
  footerNote?: string;       // Optional small-print note
};

export function buildGenericSaaSEmailHtml(args: SaaSEmailTemplateArgs): string {
  const preheader = escapeHtml(args.subtitle || args.subject || args.title).slice(0, 120);

  const bodyHtml = textToHtmlParagraphs(args.bodyText);
  const quickLinksHtml = (args.quickLinks || []).length
    ? renderQuickLinks(args.quickLinks || [])
    : "";

  const ctaHtml = args.cta ? renderCTA(args.cta.label, args.cta.href) : "";

  // Email clients like tables + inline CSS.
  // Keep it simple and safe for Outlook.
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(args.subject)}</title>
  </head>

  <body style="margin:0;padding:0;background:#f5f5f5;">
    <!-- Preheader (hidden) -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${preheader}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f5;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:100%;">
            <!-- Header -->
            <tr>
              <td style="padding:18px 22px;background:#111;border-radius:18px 18px 0 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="left" style="color:#fff;font-family:Arial,Helvetica,sans-serif;">
                      <div style="font-size:14px;font-weight:700;letter-spacing:.2px;">
                        ${escapeHtml(args.productName)}
                      </div>
                      <div style="font-size:12px;opacity:.85;margin-top:2px;">
                        Customer Portal
                      </div>
                    </td>
                    <td align="right" style="font-family:Arial,Helvetica,sans-serif;">
                      <a href="${escapeAttr(args.websiteUrl)}" style="color:#fff;text-decoration:none;font-size:12px;font-weight:700;">
                        Visit website →
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body card -->
            <tr>
              <td style="background:#ffffff;padding:22px;border-radius:0 0 18px 18px;">
                <div style="font-family:Arial,Helvetica,sans-serif;color:#111;">
                  <div style="font-size:20px;font-weight:800;line-height:1.25;">
                    ${escapeHtml(args.title)}
                  </div>

                  ${
                    args.subtitle
                      ? `<div style="margin-top:10px;font-size:13px;line-height:1.6;color:#555;">
                          ${escapeHtml(args.subtitle)}
                        </div>`
                      : ""
                  }

                  <div style="margin-top:18px;font-size:14px;line-height:1.75;color:#111;">
                    ${bodyHtml}
                  </div>

                  ${ctaHtml}

                  ${quickLinksHtml}

                  <div style="margin-top:20px;padding-top:16px;border-top:1px solid #eee;font-size:12px;line-height:1.6;color:#666;">
                    <div><strong>${escapeHtml(args.productName)}</strong></div>
                    <div>
                      <a href="mailto:${escapeAttr(args.supportEmail)}" style="color:#111;text-decoration:none;font-weight:700;">
                        ${escapeHtml(args.supportEmail)}
                      </a>
                      &nbsp;&nbsp;•&nbsp;&nbsp;
                      <a href="${escapeAttr(args.websiteUrl)}" style="color:#111;text-decoration:none;font-weight:700;">
                        ${escapeHtml(stripProtocol(args.websiteUrl))}
                      </a>
                    </div>
                    ${
                      args.footerNote
                        ? `<div style="margin-top:10px;color:#777;">${escapeHtml(args.footerNote)}</div>`
                        : ""
                    }
                    <div style="margin-top:10px;color:#888;">
                      Please do not reply to this email directly. Contact support using the address above.
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Outer footer spacing -->
            <tr>
              <td style="padding:14px 0 0 0;text-align:center;font-family:Arial,Helvetica,sans-serif;color:#999;font-size:11px;">
                ©${new Date().getFullYear()} ${escapeHtml(args.productName)}. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/* --------------------------
   Helpers
-------------------------- */

function renderCTA(label: string, href: string) {
  return `
    <div style="margin-top:18px;">
      <a href="${escapeAttr(href)}"
         style="display:inline-block;background:#111;color:#fff;text-decoration:none;
                padding:12px 16px;border-radius:14px;font-family:Arial,Helvetica,sans-serif;
                font-size:13px;font-weight:800;">
        ${escapeHtml(label)}
      </a>
    </div>
  `;
}

function renderQuickLinks(links: { label: string; href: string }[]) {
  const items = links
    .slice(0, 6)
    .map(
      (l) => `
      <a href="${escapeAttr(l.href)}" style="color:#111;text-decoration:none;font-weight:800;font-size:12px;">
        ${escapeHtml(l.label)}
      </a>`
    )
    .join(`<span style="color:#ddd;padding:0 10px;">|</span>`);

  return `
    <div style="margin-top:18px;padding:12px 14px;background:#f7f7f7;border-radius:14px;">
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#666;font-weight:800;margin-bottom:6px;">
        Quick links
      </div>
      <div style="font-family:Arial,Helvetica,sans-serif;">
        ${items}
      </div>
    </div>
  `;
}

function textToHtmlParagraphs(text: string) {
  const safe = escapeHtml(String(text || "").trim());
  if (!safe) return `<p style="margin:0;">&nbsp;</p>`;

  // Preserve intentional blank lines -> paragraph spacing
  const parts = safe.split(/\n{2,}/g);
  return parts
    .map((block) => {
      const withBreaks = block.replace(/\n/g, "<br/>");
      return `<p style="margin:0 0 12px 0;">${withBreaks}</p>`;
    })
    .join("");
}

function stripProtocol(url: string) {
  return String(url || "").replace(/^https?:\/\//i, "");
}

function escapeAttr(s: string) {
  // Attribute-safe escaping
  return escapeHtml(s).replace(/`/g, "&#096;");
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return c;
    }
  });
}
