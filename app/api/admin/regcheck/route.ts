import { NextResponse } from "next/server";

function extractJsonFromXml(xml: string) {
  // Many ASMX endpoints return <string>...JSON...</string> inside XML.
  const first = xml.indexOf("{");
  const last = xml.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;

  const jsonText = xml.slice(first, last + 1);

  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { regoNumber, state } = (await req.json()) as {
    regoNumber?: string;
    state?: string;
  };

  const username = process.env.REGCHECK_USERNAME;

  if (!username) {
    return NextResponse.json({ error: "Missing REGCHECK_USERNAME" }, { status: 500 });
  }

  const rego = String(regoNumber || "").trim().toUpperCase();
  const st = String(state || "").trim().toUpperCase();

  if (!rego || !st) {
    return NextResponse.json({ error: "regoNumber and state are required" }, { status: 400 });
  }

  // RegCheck CheckAustralia ASMX endpoint (returns XML) :contentReference[oaicite:3]{index=3}
  const url = new URL("https://www.regcheck.org.uk/api/reg.asmx/CheckAustralia");
  url.searchParams.set("RegistrationNumber", rego);
  url.searchParams.set("State", st);
  url.searchParams.set("username", username);

  const r = await fetch(url.toString(), {
    method: "GET",
    headers: { "Accept": "text/xml,*/*" },
    cache: "no-store",
  });

  const xml = await r.text();

  if (!r.ok) {
    return NextResponse.json(
      { error: "RegCheck request failed", status: r.status, body: xml.slice(0, 300) },
      { status: 502 }
    );
  }

  const parsed = extractJsonFromXml(xml);

  if (!parsed) {
    return NextResponse.json(
      { error: "Could not parse RegCheck response", xmlPreview: xml.slice(0, 500) },
      { status: 502 }
    );
  }

  // Return as-is; client will map fields it cares about
  return NextResponse.json({ ok: true, data: parsed });
}
