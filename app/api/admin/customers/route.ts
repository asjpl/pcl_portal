// app/api/admin/customers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/session";
import { generateTempPassword, hashPassword } from "../../../../lib/passwords";
import { sendWelcomeEmailSES } from "../../../../lib/ses";

function toE164AU(input: string) {
  const s = String(input || "").trim().replace(/\s+/g, "");
  if (!s) return "";
  if (s.startsWith("+")) return s;
  if (s.startsWith("04")) return "+61" + s.slice(1);
  if (s.startsWith("4")) return "+61" + s;
  return s;
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: Request) {
  const admin = await requireUser();
  if (admin.role !== "admin") return bad("Forbidden", 403);

  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid JSON");

  const cleanEmail = String(body.email || "").trim().toLowerCase();
  const phoneE164 = toE164AU(body.phone);

  const required = (k: string, v: any) => {
    if (v === null || v === undefined || String(v).trim() === "") throw new Error(`${k} is required.`);
  };

  try {
    required("Customer / Hirer Name", body.fullName);
    required("Drivers Licence Number", body.driversLicenceNumber);
    required("Drivers Licence expiry", body.driversLicenceExpiry);
    required("Drivers Licence state", body.driversLicenceState);
    required("Date of Birth", body.dateOfBirth);
    required("Address Line 1", body.addressLine1);
    required("Suburb", body.suburb);
    required("State", body.state);
    required("Postcode", body.postcode);
    required("Phone Number", phoneE164);
    required("Email Address", cleanEmail);
  } catch (e: any) {
    return bad(e.message || "Missing fields.");
  }

  // Hard stop duplicates (nicer than Prisma throw)
  const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail }, select: { id: true } });
  if (existingUser) return bad("Email already exists.", 409);

  const existingPhone = await prisma.customer.findUnique({ where: { phoneE164 }, select: { id: true } });
  if (existingPhone) return bad("Phone already exists.", 409);

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const created = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        role: "customer",
        mustResetPassword: true, // ✅ FORCE TRUE
        tempPasswordIssuedAt: new Date(),
        customer: {
          create: {
            companyName: body.companyName ? String(body.companyName).trim() : null,
            fullName: String(body.fullName).trim(),
            dateOfBirth: new Date(body.dateOfBirth),

            addressLine1: String(body.addressLine1).trim(),
            addressLine2: body.addressLine2 ? String(body.addressLine2).trim() : null,
            suburb: String(body.suburb).trim(),
            state: String(body.state).trim(),
            postcode: String(body.postcode).trim(),

            phoneE164,
            email: cleanEmail,

            driversLicenceNumber: String(body.driversLicenceNumber).trim(),
            driversLicenceState: String(body.driversLicenceState).trim(),
            driversLicenceExpiry: new Date(body.driversLicenceExpiry),
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        mustResetPassword: true,
        tempPasswordIssuedAt: true,
        customer: { select: { id: true, fullName: true } },
      },
    });

    return u;
  });

  // ✅ If mustResetPassword comes back false HERE, you are NOT hitting this route
  // or your DB column isn't applied.
  let emailSent = false;
  let emailError: string | null = null;

  try {
    await sendWelcomeEmailSES({
      to: cleanEmail,
      loginEmail: cleanEmail,
      tempPassword,
    });
    emailSent = true;
  } catch (e: any) {
    emailError = e?.message || String(e);
    console.error("SES sendWelcomeEmailSES failed:", e);
  }

  return NextResponse.json({
    ok: true,
    createdUser: created,
    emailSent,
    emailError,
    // DEV ONLY: remove later
    tempPassword,
  });
}
