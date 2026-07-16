import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { castVote, getDb } from "./db";

const hasDatabase = !!process.env.DATABASE_URL;

const SLUG_PREFIX = "vitest-filter";
const FP = "vitest_filter_fp_01234";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

async function createTempMarket(db: any, slug: string, category: string, title: string): Promise<number> {
  await db.execute(
    sql`INSERT INTO markets (slug, title, optionA, optionB, labelA, labelB, category, isActive)
        VALUES (${slug}, ${title}, 'Sim', 'Não', 'Sim', 'Não', ${category}, 1)`
  );
  const result = await db.execute(sql`SELECT id FROM markets WHERE slug = ${slug} LIMIT 1`);
  const rows = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];
  return Number(rows[0].id);
}

describe.skipIf(!hasDatabase)("markets.list — filtros e viewerHasVoted (integração)", () => {
  let idBolsa: number;

  beforeAll(async () => {
    const db = await getDb();
    idBolsa = await createTempMarket(db, `${SLUG_PREFIX}-bolsa`, "vitest-filter-eco", "A bolsa vitest-filter vai subir este ano?");
    await createTempMarket(db, `${SLUG_PREFIX}-jogo`, "vitest-filter-esp", "O time vitest-filter vence o campeonato?");
    await castVote({ marketId: idBolsa, choice: "A", fingerprint: FP });
  });

  afterAll(async () => {
    const db = await getDb();
    await db.execute(sql`DELETE FROM votes WHERE fingerprint = ${FP}`);
    await db.execute(sql`DELETE FROM markets WHERE slug LIKE ${SLUG_PREFIX + "%"}`);
  });

  it("filtra por categoria", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.markets.list({ category: "vitest-filter-eco" });
    expect(result.length).toBe(1);
    expect(result[0].slug).toBe(`${SLUG_PREFIX}-bolsa`);
  });

  it("busca por texto no título", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.markets.list({ search: "vitest-filter" });
    const slugs = result.map((m: any) => m.slug);
    expect(slugs).toContain(`${SLUG_PREFIX}-bolsa`);
    expect(slugs).toContain(`${SLUG_PREFIX}-jogo`);
  });

  it("busca sem resultados retorna lista vazia", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.markets.list({ search: "zzz-termo-inexistente-zzz" });
    expect(result).toEqual([]);
  });

  it("viewerHasVoted marca apenas as enquetes votadas pelo fingerprint", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.markets.list({ search: "vitest-filter", fingerprint: FP });
    const bolsa = result.find((m: any) => m.slug === `${SLUG_PREFIX}-bolsa`);
    const jogo = result.find((m: any) => m.slug === `${SLUG_PREFIX}-jogo`);
    expect(bolsa?.viewerHasVoted).toBe(true);
    expect(jogo?.viewerHasVoted).toBe(false);
  });

  it("sem fingerprint, viewerHasVoted fica undefined (shape antigo preservado)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.markets.list({ search: "vitest-filter" });
    expect(result[0].viewerHasVoted).toBeUndefined();
  });

  it("chamada sem input continua funcionando (compatibilidade)", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.markets.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
