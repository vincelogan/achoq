import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { getWallet, grantQs } from "./economy";
import { getMyBadges } from "./gamification";
import {
  createSuggestion,
  listMySuggestions,
  listPendingSuggestions,
  reviewSuggestion,
  SUGGESTION_COST,
} from "./suggestions";

const hasDatabase = !!process.env.DATABASE_URL;
const FP = "vitest_sug_fp_000001";
const FP_POOR = "vitest_sug_fp_semqs1";
const FP_NONICK = "vitest_sug_fp_nonick";

const BASE = {
  title: "Você acha que o teste vitest-sug vai passar?",
  category: "geral",
  optionA: "Sim",
  optionB: "Não",
  labelA: "Acho que sim",
  labelB: "Acho que não",
};

async function cleanup(db: any) {
  await db.execute(sql`DELETE FROM market_suggestions WHERE fingerprint LIKE ${"vitest_sug_%"}`);
  await db.execute(sql`DELETE FROM q_transactions WHERE fingerprint LIKE ${"vitest_sug_%"}`);
  await db.execute(sql`DELETE FROM user_badges WHERE fingerprint LIKE ${"vitest_sug_%"}`);
  await db.execute(sql`DELETE FROM user_scores WHERE fingerprint LIKE ${"vitest_sug_%"}`);
  await db.execute(sql`DELETE FROM markets WHERE title LIKE ${"%vitest-sug%"}`);
}

describe.skipIf(!hasDatabase)("Sugestões de enquete (integração)", () => {
  beforeAll(async () => {
    const db = await getDb();
    await cleanup(db);
    await db.execute(
      sql`INSERT INTO user_scores (fingerprint, nickname) VALUES (${FP}, 'SugestorTeste'), (${FP_POOR}, 'PobreTeste')
          ON DUPLICATE KEY UPDATE nickname = VALUES(nickname)`
    );
    await grantQs({ fingerprint: FP, amount: 500, type: "admin_adjust", idempotencyKey: `sug:fund:${FP}` });
  });

  afterAll(async () => {
    const db = await getDb();
    await cleanup(db);
  });

  it("exige apelido", async () => {
    await expect(createSuggestion({ ...BASE, fingerprint: FP_NONICK })).rejects.toThrow("apelido");
  });

  it("exige saldo suficiente", async () => {
    await expect(createSuggestion({ ...BASE, fingerprint: FP_POOR })).rejects.toThrow();
  });

  it("cria sugestão debitando o custo", async () => {
    const before = (await getWallet(FP)).qBalance;
    const result = await createSuggestion({ ...BASE, fingerprint: FP });
    expect(result.success).toBe(true);
    expect(result.balance).toBe(before - SUGGESTION_COST);
    const mine = await listMySuggestions(FP);
    expect(mine.length).toBe(1);
    expect(mine[0].status).toBe("pending");
  });

  it("rejeição estorna os Qs (uma única vez)", async () => {
    const mine = await listMySuggestions(FP);
    const id = mine[0].id;
    const before = (await getWallet(FP)).qBalance;

    await reviewSuggestion(id, "reject", "Fora de escopo");
    const after = (await getWallet(FP)).qBalance;
    expect(after).toBe(before + SUGGESTION_COST);

    // re-revisar é bloqueado
    await expect(reviewSuggestion(id, "reject")).rejects.toThrow("já revisada");
    const updated = await listMySuggestions(FP);
    expect(updated[0].status).toBe("rejected");
    expect(updated[0].reviewNote).toBe("Fora de escopo");
  });

  it("aprovação publica a enquete com slug único e concede a badge Pauteiro", async () => {
    const db = await getDb();
    await createSuggestion({ ...BASE, fingerprint: FP });
    const pending = await listPendingSuggestions();
    const mine = pending.find((p: any) => p.fingerprint === FP);
    expect(mine).toBeDefined();

    const result = await reviewSuggestion(mine!.id, "approve");
    expect(result.marketId).toBeTruthy();

    const marketRows = await db.execute(sql`SELECT slug, isActive FROM markets WHERE id = ${result.marketId}`);
    const rows: any[] = Array.isArray(marketRows[0]) ? marketRows[0] : (marketRows as any).rows ?? [];
    expect(rows[0].isActive).toBeTruthy();
    expect(rows[0].slug).toContain("voce-acha-que-o-teste-vitest-sug");

    const badges = await getMyBadges(FP);
    expect(badges.map((b: any) => b.code)).toContain("ideia-aprovada");
  });

  it("limita sugestões pendentes por usuário", async () => {
    for (let i = 0; i < 3; i++) {
      await createSuggestion({ ...BASE, title: `${BASE.title} rodada ${i}?`, fingerprint: FP });
    }
    await expect(createSuggestion({ ...BASE, fingerprint: FP })).rejects.toThrow("aguardando revisão");
  });
});
