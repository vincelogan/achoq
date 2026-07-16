import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT } from "jose";

process.env.JWT_SECRET = "test-jwt-secret-for-vitest-only";
process.env.SCHEDULED_SECRET = "test-scheduled-secret";

import { isScheduledRequestAuthorized } from "./_core/scheduledAuth";
import { signAdminToken } from "./_core/adminAuth";

function req(overrides: { cookies?: Record<string, string>; headers?: Record<string, string> } = {}) {
  return { cookies: overrides.cookies ?? {}, headers: overrides.headers ?? {} } as any;
}

async function signWith(secret: string, payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
}

/** Cookie forjado: header/payload/assinatura em base64 mas SEM assinatura válida. */
function forgeUnsignedCookie(payload: Record<string, unknown>): string {
  const b64 = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.assinatura-falsa`;
}

describe("isScheduledRequestAuthorized", () => {
  it("rejeita request sem credencial nenhuma", async () => {
    expect(await isScheduledRequestAuthorized(req())).toBe(false);
  });

  it("REJEITA cron cookie forjado (payload base64 sem assinatura válida) — regressão da falha original", async () => {
    const forged = forgeUnsignedCookie({ openId: "cron_attacker", appId: "x" });
    expect(await isScheduledRequestAuthorized(req({ cookies: { app_session_id: forged } }))).toBe(false);
  });

  it("aceita cron cookie legítimo (assinado com JWT_SECRET e openId cron_*)", async () => {
    const legit = await signWith(process.env.JWT_SECRET!, { openId: "cron_scheduler_1" });
    expect(await isScheduledRequestAuthorized(req({ cookies: { app_session_id: legit } }))).toBe(true);
  });

  it("rejeita cookie assinado corretamente mas de usuário comum (openId sem prefixo cron_)", async () => {
    const userCookie = await signWith(process.env.JWT_SECRET!, { openId: "user_123" });
    expect(await isScheduledRequestAuthorized(req({ cookies: { app_session_id: userCookie } }))).toBe(false);
  });

  it("rejeita cron cookie assinado com secret errado", async () => {
    const wrong = await signWith("outro-secret-qualquer", { openId: "cron_scheduler_1" });
    expect(await isScheduledRequestAuthorized(req({ cookies: { app_session_id: wrong } }))).toBe(false);
  });

  it("aceita bearer token assinado com SCHEDULED_SECRET", async () => {
    const bearer = await signWith(process.env.SCHEDULED_SECRET!, { job: "resolve" });
    expect(
      await isScheduledRequestAuthorized(req({ headers: { authorization: `Bearer ${bearer}` } }))
    ).toBe(true);
  });

  it("rejeita bearer token inválido", async () => {
    expect(
      await isScheduledRequestAuthorized(req({ headers: { authorization: "Bearer nao-e-um-jwt" } }))
    ).toBe(false);
  });

  it("aceita header x-scheduled-secret com o valor correto", async () => {
    expect(
      await isScheduledRequestAuthorized(req({ headers: { "x-scheduled-secret": "test-scheduled-secret" } }))
    ).toBe(true);
  });

  it("rejeita header x-scheduled-secret com valor errado", async () => {
    expect(
      await isScheduledRequestAuthorized(req({ headers: { "x-scheduled-secret": "chute" } }))
    ).toBe(false);
  });

  it("aceita cookie de admin válido", async () => {
    const adminToken = await signAdminToken();
    expect(await isScheduledRequestAuthorized(req({ cookies: { admin_session: adminToken } }))).toBe(true);
  });
});
