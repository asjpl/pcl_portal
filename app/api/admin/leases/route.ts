// app/api/admin/leases/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getSession } from "../../../../lib/session";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const customerId = String(body.customerId || "");
  const vehicleId = String(body.vehicleId || "");
  const planName = String(body.planName || "").trim();
  const startDate = String(body.startDate || "");

  const weeklyAmountCents = Number(body.weeklyAmountCents || 0);
  const kmsPerWeek = body.kmsPerWeek === null ? null : Number(body.kmsPerWeek || 0);
  const bondAmountCents = body.bondAmountCents === null ? null : Number(body.bondAmountCents || 0);

  if (!customerId) return NextResponse.json({ error: "Customer is required" }, { status: 400 });
  if (!vehicleId) return NextResponse.json({ error: "Vehicle is required" }, { status: 400 });
  if (!planName) return NextResponse.json({ error: "Plan is required" }, { status: 400 });
  if (!startDate) return NextResponse.json({ error: "Start date is required" }, { status: 400 });
  if (!Number.isFinite(weeklyAmountCents) || weeklyAmountCents <= 0) {
    return NextResponse.json({ error: "Weekly amount must be greater than 0" }, { status: 400 });
  }

  // Optional: prevent an "active" duplicate lease for same vehicle
  const existingActive = await prisma.lease.findFirst({
    where: {
      vehicleId,
      status: "active",
    },
    select: { id: true },
  });

  if (existingActive) {
    return NextResponse.json(
      { error: "That vehicle already has an active lease. Pause/cancel it first." },
      { status: 400 }
    );
  }

  const lease = await prisma.lease.create({
    data: {
      customerId,
      vehicleId,
      planName,
      weeklyAmount: weeklyAmountCents,
      kmsPerWeek,
      bondAmount: bondAmountCents,
      startDate: new Date(startDate),
      status: "active",
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: lease.id });
}
