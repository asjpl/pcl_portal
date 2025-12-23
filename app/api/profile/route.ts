// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/session";

// GET /api/profile
export async function GET() {
  const session = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      role: true,
      mustResetPassword: true,
      createdAt: true,
      updatedAt: true,
      adminProfile: {
        select: {
          id: true,
          fullName: true,
        },
      },
      customer: {
        select: {
          id: true,
          email: true,
          phoneE164: true,
          fullName: true,
          companyName: true,
          dateOfBirth: true,
          addressLine1: true,
          addressLine2: true,
          suburb: true,
          state: true,
          postcode: true,
          driversLicenceNumber: true,
          driversLicenceState: true,
          driversLicenceExpiry: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// PATCH /api/profile
export async function PATCH(req: Request) {
  const session = await requireUser();
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // -------------------------
  // ADMIN UPDATE (fullName)
  // -------------------------
  if (session.role === "admin") {
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: {
        adminProfile: {
          upsert: {
            // ✅ DO NOT pass userId in nested create
            create: { fullName: fullName || null },
            update: { fullName: fullName || null },
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        adminProfile: { select: { id: true, fullName: true } },
      },
    });

    return NextResponse.json({ ok: true, user: updated });
  }

  // -------------------------
  // CUSTOMER UPDATE (restricted)
  // customers can update ONLY contact details: email + phoneE164
  // -------------------------
  const nextEmail =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
  const nextPhone =
    typeof body.phoneE164 === "string" ? body.phoneE164.trim() : null;

  if (!nextEmail && !nextPhone) {
    return NextResponse.json(
      { error: "Nothing to update. Provide email and/or phoneE164." },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { userId: session.id },
    select: { id: true, email: true, phoneE164: true },
  });

  if (!customer) {
    return NextResponse.json(
      { error: "Customer profile not found." },
      { status: 404 }
    );
  }

  // Nice uniqueness checks (avoid raw prisma errors)
  if (nextEmail && nextEmail !== customer.email) {
    const emailTaken = await prisma.user.findUnique({
      where: { email: nextEmail },
      select: { id: true },
    });
    if (emailTaken) {
      return NextResponse.json(
        { error: "That email is already in use." },
        { status: 409 }
      );
    }
  }

  if (nextPhone && nextPhone !== customer.phoneE164) {
    const phoneTaken = await prisma.customer.findUnique({
      where: { phoneE164: nextPhone },
      select: { id: true },
    });
    if (phoneTaken) {
      return NextResponse.json(
        { error: "That phone number is already in use." },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.id },
    data: {
      ...(nextEmail ? { email: nextEmail } : {}),
      customer: {
        update: {
          ...(nextEmail ? { email: nextEmail } : {}),
          ...(nextPhone ? { phoneE164: nextPhone } : {}),
        },
      },
    },
    select: {
      id: true,
      email: true,
      role: true,
      customer: {
        select: {
          id: true,
          email: true,
          phoneE164: true,
          fullName: true,
          companyName: true,
          addressLine1: true,
          addressLine2: true,
          suburb: true,
          state: true,
          postcode: true,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, user: updated });
}
