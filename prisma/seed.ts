import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/passwords";

async function main() {
  const adminEmail = "admin@pcl.dev";
  const customerEmail = "customer@pcl.dev";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await hashPassword("Admin123!"),
      role: "admin",
      adminProfile: { create: { fullName: "PCL Admin" } }
    }
  });

  await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      email: customerEmail,
      passwordHash: await hashPassword("Customer123!"),
      role: "customer",
    }
  });

  console.log("✅ Seed complete");
  console.log("Admin login:", adminEmail, "Admin123!");
  console.log("Customer login:", customerEmail, "Customer123!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
