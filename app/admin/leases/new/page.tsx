// app/admin/leases/new/page.tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { requireUser } from "../../../../lib/session";
import NewLeaseForm from "./new-lease-form.client";

export default async function AdminNewLeasePage() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/account");

  const [customers, vehicles] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneE164: true,
        companyName: true,
      },
      take: 500,
    }),
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        regoNumber: true,
        state: true,
        category: true,
        currentKms: true,
        regcheckVerifiedAt: true,
      },
      take: 500,
    }),
  ]);

  return <NewLeaseForm customers={customers} vehicles={vehicles} />;
}
