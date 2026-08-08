import { describe, expect, it } from "vitest";
import { adminProcedure, router } from "./_core/trpc";
import { ADMIN_COOKIE, signAdminToken } from "./_core/adminAuth";
import type { TrpcContext } from "./_core/context";

/**
 * `adminProcedure` tem duas portas de entrada independentes (ver trpc.ts):
 * usuário Manus OAuth com role='admin', OU cookie de senha do painel /admin
 * (fluxo que o dono do site realmente usa). Antes da correção, só a via OAuth
 * era checada — o login por senha nunca dava acesso ao router `admin.*`.
 */

const testRouter = router({
  ping: adminProcedure.query(() => "pong"),
});

function makeCtx(opts: { user?: any; cookies?: Record<string, string> } = {}): TrpcContext {
  return {
    user: opts.user ?? null,
    req: { protocol: "https", headers: {}, cookies: opts.cookies ?? {} } as unknown as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("adminProcedure — dupla porta de entrada (OAuth role e senha admin)", () => {
  it("rejeita quando não há nenhuma autenticação", async () => {
    const caller = testRouter.createCaller(makeCtx());
    await expect(caller.ping()).rejects.toThrow();
  });

  it("rejeita usuário OAuth comum (role 'user')", async () => {
    const caller = testRouter.createCaller(makeCtx({ user: { role: "user" } }));
    await expect(caller.ping()).rejects.toThrow();
  });

  it("aceita usuário OAuth com role 'admin'", async () => {
    const caller = testRouter.createCaller(makeCtx({ user: { role: "admin" } }));
    await expect(caller.ping()).resolves.toBe("pong");
  });

  it("aceita o cookie de senha do painel /admin, mesmo sem usuário OAuth", async () => {
    const token = await signAdminToken();
    const caller = testRouter.createCaller(makeCtx({ cookies: { [ADMIN_COOKIE]: token } }));
    await expect(caller.ping()).resolves.toBe("pong");
  });

  it("rejeita um cookie de senha admin inválido ou adulterado", async () => {
    const caller = testRouter.createCaller(makeCtx({ cookies: { [ADMIN_COOKIE]: "token-invalido" } }));
    await expect(caller.ping()).rejects.toThrow();
  });

  it("rejeita quando não há cookie nenhum (objeto cookies vazio)", async () => {
    const caller = testRouter.createCaller(makeCtx({ cookies: {} }));
    await expect(caller.ping()).rejects.toThrow();
  });
});
