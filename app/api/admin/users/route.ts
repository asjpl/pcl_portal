// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/session";
import { hashPassword } from "../../../../lib/passwords"; // assuming you already have this

export async function POST(req: Request) {
  const me = await requireUser();
  if (me.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const email = String(form.get("email") || "").trim().toLowerCase();
  const password = String(form.get("password") || "").trim();

  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  if (!password || password.length < 8)
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  try {
    await prisma.user.create({
      data: {
        email,
        role: "admin",
        passwordHash: await hashPassword(password),
      },
    });
  } catch (e: any) {
    // handle unique constraint
    return NextResponse.json({ error: "User already exists or invalid data." }, { status: 400 });
  }

  return NextResponse.redirect(new URL("/admin/users", req.url));
}
