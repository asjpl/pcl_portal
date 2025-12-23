// lib/auth.ts
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "pcl_portal_session";

export type SessionPayload = {
  sub: string;
  role: "admin" | "customer";
  email: string;
  mustResetPassword: boolean;
};

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(s);
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());

    // ✅ Normalize/guard mustResetPassword
    const mustResetPassword =
      typeof (payload as any).mustResetPassword === "boolean"
        ? (payload as any).mustResetPassword
        : false;

    return {
      sub: String((payload as any).sub),
      email: String((payload as any).email),
      role: (payload as any).role === "admin" ? "admin" : "customer",
      mustResetPassword,
    };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = COOKIE;
