import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "../../../../lib/auth";
import { getSession } from "../../../../lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const session = await getSession();

  return NextResponse.json({
    cookieName: SESSION_COOKIE_NAME,
    hasCookie: Boolean(raw),
    cookiePreview: raw ? raw.slice(0, 20) + "…" : null,
    session
  });
}
