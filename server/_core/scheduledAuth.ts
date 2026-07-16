import type { Request } from "express";
import { jwtVerify } from "jose";
import { ADMIN_COOKIE, getAdminSecret, verifyAdminToken } from "./adminAuth";

/**
 * Autoriza chamadas dos endpoints /api/scheduled/*.
 * Aceita (todas com verificação criptográfica):
 *  1. Cookie de admin (JWT assinado com JWT_SECRET);
 *  2. Bearer token JWT assinado com SCHEDULED_SECRET (ou JWT_SECRET);
 *  3. Header x-scheduled-secret com o valor exato de SCHEDULED_SECRET (comparação timing-safe);
 *  4. Cookie de sessão do agente agendado (app_session_id): JWT com assinatura
 *     VERIFICADA contra JWT_SECRET e openId iniciando com "cron_".
 *
 * O método 4 substitui a checagem antiga que decodificava o payload em base64
 * SEM verificar a assinatura — qualquer um conseguia forjar o cookie.
 */
export async function isScheduledRequestAuthorized(req: Pick<Request, "cookies" | "headers">): Promise<boolean> {
  const adminToken = req.cookies?.[ADMIN_COOKIE];
  if (adminToken && (await verifyAdminToken(adminToken))) return true;

  const scheduledSecret = process.env.SCHEDULED_SECRET || process.env.JWT_SECRET;

  const bearerToken = req.headers.authorization?.replace("Bearer ", "");
  if (bearerToken && scheduledSecret) {
    try {
      await jwtVerify(bearerToken, new TextEncoder().encode(scheduledSecret));
      return true;
    } catch {
      /* tenta os próximos métodos */
    }
  }

  const headerSecret = req.headers["x-scheduled-secret"];
  if (typeof headerSecret === "string" && process.env.SCHEDULED_SECRET) {
    const { timingSafeEqual } = await import("crypto");
    const a = Buffer.from(headerSecret);
    const b = Buffer.from(process.env.SCHEDULED_SECRET);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }

  const sessionCookie = req.cookies?.["app_session_id"];
  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, getAdminSecret());
      const openId = payload.openId;
      if (typeof openId === "string" && openId.startsWith("cron_")) return true;
    } catch {
      /* assinatura inválida → não autorizado */
    }
  }

  return false;
}
