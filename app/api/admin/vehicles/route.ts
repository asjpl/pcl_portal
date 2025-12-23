// app/api/admin/vehicles/route.ts
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const regoNumber = String(body.regoNumber || "").toUpperCase().trim();
    if (!regoNumber) {
      return NextResponse.json(
        { error: "Registration number is required." },
        { status: 400 }
      );
    }

    // 🚫 Prevent duplicate regos (clean error, not Prisma crash)
    const existing = await prisma.vehicle.findUnique({
      where: { regoNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A vehicle with this registration already exists." },
        { status: 400 }
      );
    }

    const title =
      body.title?.trim() ||
      [body.year, body.make, body.model].filter(Boolean).join(" ");

    if (!title) {
      return NextResponse.json(
        { error: "Vehicle title is required." },
        { status: 400 }
      );
    }

    const slug = slugify(`${title}-${regoNumber}`);

    const vehicle = await prisma.vehicle.create({
      data: {
        regoNumber,
        state: body.state || null,
        category: body.category,
        currentKms: Number(body.currentKms) || 0,

        title,
        slug,

        make: body.make || null,
        model: body.model || null,
        year: body.year ?? null,
        colour: body.colour || null,
        bodyType: body.bodyType || null,
        fuelType: body.fuelType || null,
        vin: body.vin || null,

        regcheckRaw: body.regcheckRaw ?? null,
        regcheckVerifiedAt: body.regcheckRaw ? new Date() : null,
      },
    });

    // ✅ CRITICAL: return slug
    return NextResponse.json({ slug: vehicle.slug });
  } catch (err) {
    console.error("Create vehicle failed:", err);
    return NextResponse.json(
      { error: "Failed to create vehicle." },
      { status: 500 }
    );
  }
}
