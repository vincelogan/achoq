import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "./db";
import { markets, votes, qTransactions } from "../drizzle/schema";
import { applyAugust2026ContentUpdate } from "./_core/contentUpdate";

// Testes de integração — exigem banco (DATABASE_URL). Pulados sem ele.
const hasDatabase = !!process.env.DATABASE_URL;

const TARGET_SLUGS = [
  "eleicoes-2026",
  "copa-2026",
  "neymar-copa",
  "bbb-26-campeao",
  "eleicoes-2026-segundo-turno",
  "producao-br-netflix-top10-2026",
  "libertadores-2026-campeao-brasileiro",
];

async function cleanup(db: any) {
  // Restaura as 4 enquetes "legadas" ao estado sem prazo/sem resolução e remove as novas.
  const existing = await db.select({ id: markets.id }).from(markets).where(inArray(markets.slug, TARGET_SLUGS));
  const ids = existing.map((r: any) => r.id);
  if (ids.length > 0) {
    await db.delete(votes).where(inArray(votes.marketId, ids));
    await db.delete(qTransactions).where(and(eq(qTransactions.refType, "market"), inArray(qTransactions.refId, ids)));
  }
  await db.execute(
    sql`UPDATE markets SET endsAt = NULL, resolvedChoice = NULL, isActive = 1 WHERE slug IN ('eleicoes-2026', 'copa-2026', 'neymar-copa', 'bbb-26-campeao')`
  );
  await db.execute(
    sql`DELETE FROM markets WHERE slug IN ('eleicoes-2026-segundo-turno', 'producao-br-netflix-top10-2026', 'libertadores-2026-campeao-brasileiro')`
  );
}

async function seedLegacyMarketsIfMissing(db: any) {
  const legacy = [
    { slug: "eleicoes-2026", optionA: "Esquerda", optionB: "Direita" },
    { slug: "copa-2026", optionA: "Sim", optionB: "Não" },
    { slug: "neymar-copa", optionA: "Sim", optionB: "Não" },
    { slug: "bbb-26-campeao", optionA: "Ana Paula", optionB: "Outros" },
  ];
  for (const m of legacy) {
    const existing = await db.select({ id: markets.id }).from(markets).where(eq(markets.slug, m.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(markets).values({
        slug: m.slug,
        title: `Título de teste ${m.slug}`,
        category: "vitest-content-update",
        optionA: m.optionA,
        optionB: m.optionB,
        labelA: m.optionA,
        labelB: m.optionB,
        isActive: true,
      });
    }
  }
}

describe.skipIf(!hasDatabase)("applyAugust2026ContentUpdate (integração)", () => {
  beforeAll(async () => {
    const db = await getDb();
    await seedLegacyMarketsIfMissing(db);
    await cleanup(db);
  });

  afterAll(async () => {
    const db = await getDb();
    await cleanup(db);
  });

  it("na primeira execução: corrige prazos, resolve as 3 enquetes conhecidas e publica as 3 novas", async () => {
    const result = await applyAugust2026ContentUpdate();

    expect(result.datesFixed.sort()).toEqual(["bbb-26-campeao", "copa-2026", "eleicoes-2026", "neymar-copa"].sort());
    expect(result.resolved.sort()).toEqual(["bbb-26-campeao", "copa-2026", "neymar-copa"].sort());
    expect(result.inserted.sort()).toEqual(
      [
        "eleicoes-2026-segundo-turno",
        "libertadores-2026-campeao-brasileiro",
        "producao-br-netflix-top10-2026",
      ].sort()
    );

    const db = await getDb();
    const copa = await db.select().from(markets).where(eq(markets.slug, "copa-2026")).limit(1);
    expect(copa[0].resolvedChoice).toBe("B");
    expect(copa[0].isActive).toBeFalsy();

    const neymar = await db.select().from(markets).where(eq(markets.slug, "neymar-copa")).limit(1);
    expect(neymar[0].resolvedChoice).toBe("A");

    const bbb = await db.select().from(markets).where(eq(markets.slug, "bbb-26-campeao")).limit(1);
    expect(bbb[0].resolvedChoice).toBe("A");

    const eleicoes = await db.select().from(markets).where(eq(markets.slug, "eleicoes-2026")).limit(1);
    expect(eleicoes[0].resolvedChoice).toBeNull();
    expect(eleicoes[0].endsAt).not.toBeNull();

    const novaLibertadores = await db
      .select()
      .from(markets)
      .where(eq(markets.slug, "libertadores-2026-campeao-brasileiro"))
      .limit(1);
    expect(novaLibertadores[0].imageUrl).toBe("/banners/libertadores-2026-campeao-brasileiro.png");
  });

  it("é idempotente: reexecutar não duplica nem re-resolve", async () => {
    const result = await applyAugust2026ContentUpdate();
    expect(result.datesFixed).toEqual([]);
    expect(result.resolved).toEqual([]);
    expect(result.inserted).toEqual([]);

    const db = await getDb();
    const rows = await db.select({ id: markets.id }).from(markets).where(eq(markets.slug, "copa-2026"));
    expect(rows.length).toBe(1);
  });
});
