import { getSession } from "./session";

export async function requireSession() {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  return s;
}

export async function requireAdmin() {
  const s = await requireSession();
  if (s.role !== "admin") throw new Error("FORBIDDEN");
  return s;
}

export async function requireCustomer() {
  const s = await requireSession();
  if (s.role !== "customer") throw new Error("FORBIDDEN");
  return s;
}
