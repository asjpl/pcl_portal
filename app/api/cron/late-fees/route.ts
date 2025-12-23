import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

const LATE_FEE_CENTS = 6000;

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const overdue = await prisma.paymentSchedule.findMany({
    where: { status: { in: ["failed", "overdue"] }, paidAt: null },
    select: { id: true, leaseId: true }
  });

  const now = new Date();
  const dayKey = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  let created = 0;

  for (const p of overdue) {
    const exists = await prisma.lateFee.findFirst({
      where: { leaseId: p.leaseId, paymentId: p.id, dateApplied: dayKey },
      select: { id: true }
    });
    if (exists) continue;

    await prisma.lateFee.create({
      data: { leaseId: p.leaseId, paymentId: p.id, dateApplied: dayKey, amount: LATE_FEE_CENTS }
    });

    await prisma.paymentSchedule.update({
      where: { id: p.id },
      data: { status: "overdue" }
    });

    created++;
  }

  return NextResponse.json({ ok: true, created });
}
