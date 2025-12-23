// app/api/billing/portal/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "../../../../lib/session";

// NOTE: This is a stub for now. When you add Stripe, you’ll create a portal session
// and redirect to session.url.
export async function POST(req: Request) {
  const user = await requireUser();
  if (user.role !== "customer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // For now just return user to profile with a message pattern you can later enhance.
  return NextResponse.redirect(new URL("/account/profile", req.url));
}
