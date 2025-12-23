// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { hashPassword } from "../../../../lib/passwords";
import { getSession } from "../../../../lib/session";
import { SESSION_COOKIE_NAME } from "../../../../lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  if (session.role !== "customer") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { newPassword } = await req.json().catch(() => ({}));
  const pw = String(newPassword || "");

  if (pw.length < 10) {
    return NextResponse.json(
      { error: "Password must be at least 10 characters." },
      { status: 400 }
    );
  }

  const nextHash = await hashPassword(pw);

  // ✅ SessionUser uses `id` (mapped from JWT `sub`)
  await prisma.user.update({
    where: { id: session.id },
    data: {
      passwordHash: nextHash,
      mustResetPassword: false,
      tempPasswordIssuedAt: null,
    },
  });

  // ✅ safest: clear cookie so they must log back in and get a fresh token
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return res;
}
