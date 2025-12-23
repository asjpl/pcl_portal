// app/api/rego-lookup/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { rego, state } = await req.json();

  if (!rego) {
    return NextResponse.json({ error: "Missing rego" }, { status: 400 });
  }

  const username = process.env.REGCHECK_USERNAME;
  if (!username) {
    return NextResponse.json(
      { error: "RegCheck not configured" },
      { status: 500 }
    );
  }

  const reg = String(rego).toUpperCase().trim();
  const st = String(state || "WA").toUpperCase().trim();

  const url =
    "https://www.regcheck.org.uk/api/reg.asmx/CheckAustralia" +
    `?RegistrationNumber=${encodeURIComponent(reg)}` +
    `&State=${encodeURIComponent(st)}` +
    `&username=${encodeURIComponent(username)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const xml = await res.text();

    const match = xml.match(/<vehicleJson>([\s\S]*?)<\/vehicleJson>/i);
    if (!match?.[1]) {
      return NextResponse.json({ found: false });
    }

    const jsonStr = match[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");

    const data = JSON.parse(jsonStr);

    return NextResponse.json({
      found: true,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Lookup failed" },
      { status: 500 }
    );
  }
}
