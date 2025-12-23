// app/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "../lib/session";
import LoginPage from "./login/page";

export const dynamic = "force-dynamic";

/**
 * Home page is now the main login page.
 * - If already logged in, redirect to the correct workspace.
 * - Otherwise render the same UI as /login (single source of truth).
 */
export default async function HomePage() {
  const session = await getSession();

  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "customer") redirect("/account");

  return <LoginPage />;
}
