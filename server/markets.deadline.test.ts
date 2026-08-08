import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { resolveMarket } from "./resolution";

// Testes de integração — exigem banco (DATABASE_URL). Pulados sem ele.
const hasDatabase = !!process.env.DATABASE_URL;

const SLUG_PREFIX = "vitest-deadline";
const FP = "vitest_deadline_fp_01";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

async function createTempMarket(
  db: any,
  slug: string,
  opts: { endsAt?: string | null; isActive?: boolean } = {}
): Promise<number> {
  await db.execute(
    sql`INSERT INTO markets (slug, title, optionA, optionB, labelA, labelB, category, isActive, endsAt)
        VALUES (${slug}, ${"Enquete de prazo " + slug}, 'Sim', 'Não', 'Sim', 'Não', 'vitest-deadline', ${
      opts.isActive ?? true
    }, ${opts.endsAt ?? null})`
  );
  const result = await db.execute(sql`SELECT id FROM markets WHERE slug = ${slug} LIMIT 1`);
  const rows = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];
  return Number(rows[0].id);
}

describe.skipIf(!hasDatabase)("markets.vote — bloqueio por prazo vencido (integração)", () => {
  let overdueId: number;
  let futureId: number;
  let noDeadlineId: number;
  let resolvedId: number;

  beforeAll(async () => {
    const db = await getDb();
    overdueId = await createTempMarket(db, `${SLUG_PREFIX}-overdue`, { endsAt: "2020-01-01 00:00:00" });
    futureId = await createTempMarket(db, `${SLUG_PREFIX}-future`, { endsAt: "2030-01-01 00:00:00" });
    noDeadlineId = await createTempMarket(db, `${SLUG_PREFIX}-nodeadline`);
    resolvedId = await createTempMarket(db, `${SLUG_PREFIX}-resolved`, { endsAt: "2030-01-01 00:00:00" });
    await resolveMarket(resolvedId, "A");
  });

  afterAll(async () => {
    const db = await getDb();
    await db.execute(sql`DELETE FROM q_transactions WHERE fingerprint LIKE ${"vitest_deadline_%"}`);
    await db.execute(sql`DELETE FROM votes WHERE fingerprint LIKE ${"vitest_deadline_%"}`);
    await db.execute(sql`DELETE FROM user_scores WHERE fingerprint LIKE ${"vitest_deadline_%"}`);
    await db.execute(sql`DELETE FROM markets WHERE slug LIKE ${SLUG_PREFIX + "%"}`);
  });

  it("rejeita voto quando o prazo (endsAt) já passou", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.markets.vote({ marketId: overdueId, choice: "A", fingerprint: `${FP}_a` })
    ).rejects.toThrow("prazo");
  });

  it("rejeita voto em enquete já resolvida", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.markets.vote({ marketId: resolvedId, choice: "A", fingerprint: `${FP}_b` })
    ).rejects.toThrow("encerrada");
  });

  it("aceita voto normalmente quando o prazo ainda não chegou", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.markets.vote({ marketId: futureId, choice: "A", fingerprint: `${FP}_c` });
    expect(result.success).toBe(true);
  });

  it("aceita voto quando a enquete não tem prazo definido", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.markets.vote({ marketId: noDeadlineId, choice: "B", fingerprint: `${FP}_d` });
    expect(result.success).toBe(true);
  });
});
