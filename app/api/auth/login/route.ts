// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { verifyPassword } from "../../../../lib/passwords";
import { signSessionToken, SESSION_COOKIE_NAME } from "../../../../lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  const loginEmail = String(email || "").trim().toLowerCase();
  const pw = String(password || "");

  if (!loginEmail || !pw) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: loginEmail },
    select: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
      mustResetPassword: true,
    },
  });

  if (!user || !(await verifyPassword(pw, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = await signSessionToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    mustResetPassword: user.mustResetPassword,
  });

  const res = NextResponse.json({
    ok: true,
    role: user.role,
    mustResetPassword: user.mustResetPassword,
  });

  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
