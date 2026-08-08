import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { hashPassword, verifyPassword } from "./_core/passwordAuth";

const hasDatabase = !!process.env.DATABASE_URL;

const EMAIL_PREFIX = "vitest-account";
const FP_PREFIX = "fp_vitest_account";

function createPublicContext(): { ctx: TrpcContext; cookies: Array<{ name: string; value: string }> } {
  const cookies: Array<{ name: string; value: string }> = [];
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: (name: string, value: string) => {
        cookies.push({ name, value });
      },
    } as unknown as TrpcContext["res"],
  };
  return { ctx, cookies };
}

async function cleanup(db: any) {
  await db.execute(sql`DELETE FROM users WHERE email LIKE ${EMAIL_PREFIX + "%"}`);
  await db.execute(sql`DELETE FROM q_transactions WHERE fingerprint LIKE ${FP_PREFIX + "%"}`);
  await db.execute(sql`DELETE FROM user_scores WHERE fingerprint LIKE ${FP_PREFIX + "%"}`);
}

describe.skipIf(!hasDatabase)("auth.register / auth.login (integração)", () => {
  beforeAll(async () => {
    const db = await getDb();
    await cleanup(db);
  });

  afterAll(async () => {
    const db = await getDb();
    await cleanup(db);
  });

  it("cadastra com e-mail/senha, seta cookie de sessão e nunca devolve o hash da senha", async () => {
    const { ctx, cookies } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.register({
      email: `${EMAIL_PREFIX}-a@example.com`,
      password: "senha-forte-123",
    });

    expect(user).toBeTruthy();
    expect((user as any).passwordHash).toBeUndefined();
    expect((user as any).fingerprint).toMatch(/^fp_/);
    expect(cookies.some((c) => c.name === "app_session_id")).toBe(true);
  });

  it("rejeita cadastro com e-mail já usado", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.register({ email: `${EMAIL_PREFIX}-a@example.com`, password: "outra-senha-123" })
    ).rejects.toThrow();
  });

  it("rejeita senha curta demais", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.register({ email: `${EMAIL_PREFIX}-b@example.com`, password: "123" })
    ).rejects.toThrow();
  });

  it("rejeita e-mail inválido", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.register({ email: "nao-e-email", password: "senha-forte-123" })
    ).rejects.toThrow();
  });

  it("no cadastro, adota o fingerprint anônimo já existente do navegador (preserva histórico)", async () => {
    const db = await getDb();
    const candidateFp = `${FP_PREFIX}_claim_me`;
    // Simula alguém que já opinava anonimamente antes de criar conta.
    await db.execute(
      sql`INSERT INTO user_scores (fingerprint, points, qBalance) VALUES (${candidateFp}, 40, 140)`
    );

    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const user = await caller.auth.register({
      email: `${EMAIL_PREFIX}-c@example.com`,
      password: "senha-forte-123",
      fingerprint: candidateFp,
    });

    expect((user as any).fingerprint).toBe(candidateFp);
  });

  it("login com senha correta funciona e com senha errada dá mensagem genérica", async () => {
    const { ctx: registerCtx } = createPublicContext();
    const registerCaller = appRouter.createCaller(registerCtx);
    await registerCaller.auth.register({ email: `${EMAIL_PREFIX}-d@example.com`, password: "senha-correta-123" });

    const { ctx: loginCtx, cookies } = createPublicContext();
    const loginCaller = appRouter.createCaller(loginCtx);
    const user = await loginCaller.auth.login({ email: `${EMAIL_PREFIX}-d@example.com`, password: "senha-correta-123" });
    expect(user).toBeTruthy();
    expect(cookies.some((c) => c.name === "app_session_id")).toBe(true);

    const { ctx: wrongCtx } = createPublicContext();
    const wrongCaller = appRouter.createCaller(wrongCtx);
    await expect(
      wrongCaller.auth.login({ email: `${EMAIL_PREFIX}-d@example.com`, password: "senha-errada" })
    ).rejects.toThrow("E-mail ou senha incorretos");

    const { ctx: unknownCtx } = createPublicContext();
    const unknownCaller = appRouter.createCaller(unknownCtx);
    await expect(
      unknownCaller.auth.login({ email: `${EMAIL_PREFIX}-naoexiste@example.com`, password: "qualquer-coisa" })
    ).rejects.toThrow("E-mail ou senha incorretos");
  });
});

describe("hashPassword / verifyPassword (scrypt)", () => {
  it("hash e verificação funcionam e senha errada é rejeitada", async () => {
    const hash = await hashPassword("minha-senha-123");
    expect(hash).toMatch(/^scrypt:/);
    expect(await verifyPassword("minha-senha-123", hash)).toBe(true);
    expect(await verifyPassword("senha-errada", hash)).toBe(false);
  });

  it("hashes do mesmo password são diferentes (salt aleatório)", async () => {
    const a = await hashPassword("repetida-123");
    const b = await hashPassword("repetida-123");
    expect(a).not.toBe(b);
  });
});
