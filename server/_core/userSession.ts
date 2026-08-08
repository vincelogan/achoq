import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";

/**
 * Sessão de usuário (contas reais — e-mail/senha ou Google), substituindo o
 * antigo fluxo "Manus OAuth" (que dependia de uma chamada de rede para
 * api.manus.im a cada login e exigia conta no Manus.im — nunca usável pelos
 * visitantes reais do AchoQ). Mesmo cookie (`app_session_id`) e mesma técnica
 * (JWT local assinado com JWT_SECRET via `jose`) já usados antes — só que
 * agora o JWT carrega `userId` (chave local) em vez de `openId` (chave do
 * Manus), e a verificação é 100% local (sem round-trip de rede).
 */

function getSessionSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET não configurado — obrigatório em produção");
    }
    console.warn("[Auth] JWT_SECRET ausente — usando secret de desenvolvimento");
    return new TextEncoder().encode("dev-only-secret-not-for-production");
  }
  return new TextEncoder().encode(secret);
}

export async function createUserSessionToken(userId: number): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + ONE_YEAR_MS) / 1000))
    .sign(getSessionSecret());
}

async function verifyUserSessionToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] });
    const userId = payload.userId;
    return typeof userId === "number" ? userId : null;
  } catch {
    return null;
  }
}

/** Lê e valida a sessão do cookie da requisição; null se ausente/inválida. */
export async function authenticateUserRequest(req: Request): Promise<User | null> {
  const token = (req as any).cookies?.[COOKIE_NAME];
  if (!token) return null;
  const userId = await verifyUserSessionToken(token);
  if (!userId) return null;
  const user = await getUserById(userId);
  return user ?? null;
}
