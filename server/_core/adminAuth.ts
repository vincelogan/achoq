import type { NextFunction, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";

export const ADMIN_COOKIE = "admin_session";

export function getAdminSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Nunca operar com secret previsível em produção
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET não configurado — obrigatório em produção");
    }
    console.warn("[Auth] JWT_SECRET ausente — usando secret de desenvolvimento");
    return new TextEncoder().encode("dev-only-secret-not-for-production");
  }
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getAdminSecret());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getAdminSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  const valid = await verifyAdminToken(token);
  if (!valid) {
    res.status(401).json({ error: "Sessão inválida ou expirada" });
    return;
  }
  next();
}
