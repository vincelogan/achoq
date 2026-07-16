import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import {
  castVote,
  DuplicateVoteError,
  getDb,
  getRelatedMarkets,
  hasVoted,
} from "./db";

// Testes de integração — exigem banco (DATABASE_URL). Pulados sem ele.
const hasDatabase = !!process.env.DATABASE_URL;

const SLUG_PREFIX = "vitest-tmp";
const FP = "vitest_fp_0123456789";

async function createTempMarket(db: any, slug: string, category: string): Promise<number> {
  await db.execute(
    sql`INSERT INTO markets (slug, title, optionA, optionB, labelA, labelB, category, isActive)
        VALUES (${slug}, ${"Enquete temporária de teste " + slug}, 'Sim', 'Não', 'Sim', 'Não', ${category}, 1)`
  );
  const result = await db.execute(sql`SELECT id FROM markets WHERE slug = ${slug} LIMIT 1`);
  const rows = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];
  return Number(rows[0].id);
}

describe.skipIf(!hasDatabase)("votos e relacionados (integração com banco)", () => {
  let marketA: number;
  let marketB: number;
  let marketC: number;

  beforeAll(async () => {
    const db = await getDb();
    marketA = await createTempMarket(db, `${SLUG_PREFIX}-economia-a`, "vitest-economia");
    marketB = await createTempMarket(db, `${SLUG_PREFIX}-economia-b`, "vitest-economia");
    marketC = await createTempMarket(db, `${SLUG_PREFIX}-esportes-c`, "vitest-esportes");
  });

  afterAll(async () => {
    const db = await getDb();
    await db.execute(sql`DELETE FROM votes WHERE fingerprint = ${FP}`);
    await db.execute(sql`DELETE FROM markets WHERE slug LIKE ${SLUG_PREFIX + "%"}`);
  });

  it("castVote grava e hasVoted reflete", async () => {
    expect(await hasVoted(marketA, FP)).toBe(false);
    await castVote({ marketId: marketA, choice: "A", fingerprint: FP });
    expect(await hasVoted(marketA, FP)).toBe(true);
  });

  it("segundo voto do mesmo fingerprint na mesma enquete lança DuplicateVoteError (índice único)", async () => {
    await expect(castVote({ marketId: marketA, choice: "B", fingerprint: FP })).rejects.toThrow(
      DuplicateVoteError
    );
  });

  it("mesmo fingerprint pode votar em OUTRA enquete", async () => {
    await expect(castVote({ marketId: marketB, choice: "A", fingerprint: FP })).resolves.toBeUndefined();
  });

  it("getRelatedMarkets prioriza a mesma categoria e exclui a própria enquete", async () => {
    const related = await getRelatedMarkets(marketA, "vitest-economia");
    const ids = related.map((m: any) => m.id);
    expect(ids).not.toContain(marketA);
    expect(ids).toContain(marketB);
    // a primeira posição deve ser da mesma categoria
    expect(related[0].category).toBe("vitest-economia");
  });
});
