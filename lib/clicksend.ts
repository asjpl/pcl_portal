// lib/clicksend.ts
export const PCL_OUTBOUND_E164 = "+61427526002";

export function normalizeAuPhoneToE164(input: string): string {
  const raw = String(input || "").trim();

  // Remove spaces, dashes, parentheses
  let s = raw.replace(/[^\d+]/g, "");

  // Already e164
  if (s.startsWith("+")) return s;

  // AU mobile like 04xxxxxxxx
  if (s.startsWith("04") && s.length === 10) {
    return "+61" + s.slice(1);
  }

  // 614xxxxxxxx
  if (s.startsWith("61") && s.length >= 11) {
    return "+" + s;
  }

  // 4xxxxxxxx (rare)
  if (s.startsWith("4") && s.length === 9) {
    return "+61" + s;
  }

  // fallback
  return raw.startsWith("+") ? raw : "+" + s;
}

type ClickSendSendResult = {
  ok: boolean;
  providerSid?: string | null;
  raw?: any;
  error?: string;
};

function basicAuthHeader(username: string, apiKey: string) {
  const token = Buffer.from(`${username}:${apiKey}`).toString("base64");
  return `Basic ${token}`;
}

export async function sendClickSendSms(args: {
  toE164: string;
  body: string;
  fromE164?: string; // default to PCL outbound
}): Promise<ClickSendSendResult> {
  const username = process.env.CLICKSEND_USERNAME || "";
  const apiKey = process.env.CLICKSEND_API_KEY || "";

  if (!username || !apiKey) {
    return { ok: false, error: "Missing ClickSend credentials (CLICKSEND_USERNAME / CLICKSEND_API_KEY)." };
  }

  const to = normalizeAuPhoneToE164(args.toE164);
  const from = normalizeAuPhoneToE164(args.fromE164 || PCL_OUTBOUND_E164);
  const body = String(args.body || "").trim();

  if (!to || !body) return { ok: false, error: "Missing to/body." };

  // ClickSend API: /v3/sms/send with messages collection :contentReference[oaicite:1]{index=1}
  const res = await fetch("https://rest.clicksend.com/v3/sms/send", {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(username, apiKey),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          source: "pcl-portal",
          body,
          to,
          from,
        },
      ],
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    return { ok: false, error: json?.response?.error || json?.error || "ClickSend send failed.", raw: json };
  }

  // ClickSend responses vary; keep raw and try best-effort providerSid
  const providerSid =
    json?.data?.messages?.[0]?.message_id ||
    json?.data?.messages?.[0]?.id ||
    json?.message_id ||
    null;

  return { ok: true, providerSid, raw: json };
}
