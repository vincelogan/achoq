import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { castVote, getDb, recalcUserScore } from "./db";
import {
  countTodayVoteGrants,
  getTransactions,
  getWallet,
  grantQs,
  InsufficientBalanceError,
  recalcQBalance,
  spendQs,
} from "./economy";
import { processVoteRewards, REWARDS } from "./gamification";
import { resolveMarket } from "./resolution";
import { boostMarket, buyItem } from "./shop";

const hasDatabase = !!process.env.DATABASE_URL;

const PREFIX = "vitest-eco";
const FP = "vitest_eco_fp_000001";
const FP2 = "vitest_eco_fp_000002";
const FP_MIG = "vitest_eco_fp_migrar";

async function createTempMarket(db: any, slug: string, opts: { createdAt?: Date; endsAt?: Date } = {}): Promise<number> {
  const createdAt = opts.createdAt ?? new Date();
  await db.execute(
    sql`INSERT INTO markets (slug, title, optionA, optionB, labelA, labelB, category, isActive, createdAt)
        VALUES (${slug}, ${"Enquete temp " + slug}, 'Sim', 'Não', 'Sim', 'Não', 'vitest-eco', 1, ${createdAt})`
  );
  const result = await db.execute(sql`SELECT id FROM markets WHERE slug = ${slug} LIMIT 1`);
  const rows = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];
  return Number(rows[0].id);
}

async function cleanup(db: any) {
  await db.execute(sql`DELETE FROM q_transactions WHERE fingerprint LIKE ${"vitest_eco_%"}`);
  await db.execute(sql`DELETE FROM user_scores WHERE fingerprint LIKE ${"vitest_eco_%"}`);
  await db.execute(sql`DELETE FROM votes WHERE fingerprint LIKE ${"vitest_eco_%"}`);
  await db.execute(sql`DELETE FROM user_items WHERE fingerprint LIKE ${"vitest_eco_%"}`);
  await db.execute(sql`DELETE FROM market_boosts WHERE fingerprint LIKE ${"vitest_eco_%"}`);
  await db.execute(sql`DELETE FROM markets WHERE slug LIKE ${PREFIX + "%"}`);
}

describe.skipIf(!hasDatabase)("Economia de Qs (integração)", () => {
  beforeAll(async () => {
    const db = await getDb();
    await cleanup(db);
  });

  afterAll(async () => {
    const db = await getDb();
    await cleanup(db);
  });

  describe("grantQs — idempotência", () => {
    it("mesma idempotencyKey concede apenas uma vez", async () => {
      const r1 = await grantQs({ fingerprint: FP, amount: 50, type: "admin_adjust", idempotencyKey: `test:dup:${FP}` });
      const r2 = await grantQs({ fingerprint: FP, amount: 50, type: "admin_adjust", idempotencyKey: `test:dup:${FP}` });
      expect(r1.granted).toBe(true);
      expect(r2.granted).toBe(false);
      const wallet = await getWallet(FP);
      expect(wallet.qBalance).toBe(50);
    });
  });

  describe("spendQs — saldo", () => {
    it("com saldo insuficiente lança erro e não altera o saldo", async () => {
      await expect(
        spendQs({ fingerprint: FP, amount: 999, type: "shop_purchase", idempotencyKey: `test:spend-fail:${FP}` })
      ).rejects.toThrow(InsufficientBalanceError);
      const wallet = await getWallet(FP);
      expect(wallet.qBalance).toBe(50);
    });

    it("debita corretamente com saldo suficiente", async () => {
      const result = await spendQs({ fingerprint: FP, amount: 20, type: "shop_purchase", idempotencyKey: `test:spend-ok:${FP}` });
      expect(result.spent).toBe(true);
      expect(result.balance).toBe(30);
    });

    it("recalcQBalance (SUM do ledger) bate com o cache", async () => {
      const total = await recalcQBalance(FP);
      expect(total).toBe(30);
    });
  });

  describe("migração lazy de pontos herdados + boas-vindas", () => {
    it("primeira leitura credita points migrados + bônus de boas-vindas, uma única vez", async () => {
      const db = await getDb();
      await db.execute(
        sql`INSERT INTO user_scores (fingerprint, points) VALUES (${FP_MIG}, 120)
            ON DUPLICATE KEY UPDATE points = 120`
      );
      // 120 migrados + 100 de boas-vindas
      const w1 = await getWallet(FP_MIG);
      expect(w1.qBalance).toBe(220);
      const w2 = await getWallet(FP_MIG);
      expect(w2.qBalance).toBe(220);
      const txs = await getTransactions(FP_MIG);
      expect(txs.filter((t: any) => t.type === "migration").length).toBe(1);
      expect(txs.filter((t: any) => t.type === "welcome").length).toBe(1);
    });
  });

  describe("recompensas de voto", () => {
    it("voto premia participação + early bird + check-in diário; repetição não duplica", async () => {
      const db = await getDb();
      const marketId = await createTempMarket(db, `${PREFIX}-fresh`);
      await castVote({ marketId, choice: "A", fingerprint: FP2 });

      const market = { id: marketId, createdAt: new Date() };
      const r1 = await processVoteRewards(FP2, market);
      // +5 voto, +5 early (recém-criada), +10 check-in do dia
      expect(r1.qsEarned).toBe(REWARDS.vote + REWARDS.earlyBird + REWARDS.dailyBase);
      expect(r1.dailyStreak).toBe(1);

      const r2 = await processVoteRewards(FP2, market);
      expect(r2.qsEarned).toBe(0);
    });

    it("enquete antiga (>48h) não premia early bird", async () => {
      const db = await getDb();
      const old = new Date(Date.now() - 72 * 60 * 60 * 1000);
      const marketId = await createTempMarket(db, `${PREFIX}-old`, { createdAt: old });
      const r = await processVoteRewards(FP2, { id: marketId, createdAt: old });
      // check-in já feito hoje; early fora da janela → só o voto
      expect(r.qsEarned).toBe(REWARDS.vote);
    });

    it("cap diário: no máximo 10 votos premiados por dia", async () => {
      const db = await getDb();
      // já há 2 concessões de voto hoje; cria mais 9 enquetes antigas e premia
      for (let i = 0; i < 9; i++) {
        const marketId = await createTempMarket(db, `${PREFIX}-cap-${i}`, {
          createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        });
        await processVoteRewards(FP2, { id: marketId, createdAt: null });
      }
      const grants = await countTodayVoteGrants(FP2);
      expect(grants).toBe(REWARDS.voteDailyCap);

      // 12ª enquete: não premia mais o voto
      const extraId = await createTempMarket(db, `${PREFIX}-cap-extra`, {
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      });
      const r = await processVoteRewards(FP2, { id: extraId, createdAt: null });
      expect(r.qsEarned).toBe(0);
    });
  });

  describe("resolução — Qs de acerto", () => {
    it("acertador ganha +20; re-resolução não duplica", async () => {
      const db = await getDb();
      const marketId = await createTempMarket(db, `${PREFIX}-resolve`, {
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      });
      await castVote({ marketId, choice: "A", fingerprint: FP });
      const before = (await getWallet(FP)).qBalance;

      await resolveMarket(marketId, "A");
      const after1 = (await getWallet(FP)).qBalance;
      expect(after1).toBe(before + REWARDS.correct);

      // Re-execução (ex.: retry do agente agendado)
      await resolveMarket(marketId, "A");
      const after2 = (await getWallet(FP)).qBalance;
      expect(after2).toBe(after1);
    });

    it("recalcUserScore NUNCA altera o qBalance (regressão ledger × recompute)", async () => {
      const before = (await getWallet(FP)).qBalance;
      await recalcUserScore(FP);
      const after = (await getWallet(FP)).qBalance;
      expect(after).toBe(before);
    });
  });

  describe("loja", () => {
    it("compra de moldura debita e impede compra duplicada", async () => {
      await grantQs({ fingerprint: FP, amount: 500, type: "admin_adjust", idempotencyKey: `test:fund:${FP}` });
      const before = (await getWallet(FP)).qBalance;
      const result = await buyItem(FP, "frame-bronze");
      expect(result.success).toBe(true);
      expect(result.balance).toBe(before - 100);
      await expect(buyItem(FP, "frame-bronze")).rejects.toThrow("já possui");
    });

    it("proteção de streak respeita o máximo de 2", async () => {
      await buyItem(FP, "shield-streak");
      await buyItem(FP, "shield-streak");
      expect((await getWallet(FP)).streakShields).toBe(2);
      await expect(buyItem(FP, "shield-streak")).rejects.toThrow("máximo");
    });

    it("boost em enquete resolvida é rejeitado", async () => {
      const db = await getDb();
      const result = await db.execute(sql`SELECT id FROM markets WHERE slug = ${PREFIX + "-resolve"} LIMIT 1`);
      const rows = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];
      const resolvedId = Number(rows[0].id);
      await expect(boostMarket(FP, resolvedId)).rejects.toThrow("ativas");
    });

    it("boost em enquete ativa debita e marca a enquete como impulsionada", async () => {
      const db = await getDb();
      const marketId = await createTempMarket(db, `${PREFIX}-boostme`);
      await grantQs({ fingerprint: FP, amount: 300, type: "admin_adjust", idempotencyKey: `test:fund-boost:${FP}` });
      const before = (await getWallet(FP)).qBalance;
      const result = await boostMarket(FP, marketId);
      expect(result.success).toBe(true);
      expect(result.balance).toBe(before - 200);
      // segundo boost na mesma enquete enquanto ativo → erro
      await expect(boostMarket(FP2, marketId)).rejects.toThrow("já está impulsionada");
    });
  });
});
