// lib/session.ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./auth";

export type SessionUser = {
  id: string;
  email: string;
  role: "admin" | "customer";
  mustResetPassword: boolean;
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const decoded = await verifySessionToken(token);
  if (!decoded) return null;

  return {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    mustResetPassword: Boolean(decoded.mustResetPassword),
  };
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireUser();
  if (session.role !== "admin") redirect("/account");
  return session;
}
