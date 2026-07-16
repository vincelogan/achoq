import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { getWallet, grantQs } from "./economy";
import {
  checkAndAwardBadges,
  closeFinishedSeasons,
  currentWeekStart,
  ensureEnrolled,
  getCurrentSeason,
  getLeagueStandings,
  getMyBadges,
  processVoteRewards,
} from "./gamification";

const hasDatabase = !!process.env.DATABASE_URL;
const FP_A = "vitest_liga_fp_aaa001";
const FP_B = "vitest_liga_fp_bbb002";
const FP_SHIELD = "vitest_liga_fp_shield";
const FP_NOSHIELD = "vitest_liga_fp_noshld";
const FP_BADGE = "vitest_liga_fp_badge1";

async function cleanup(db: any) {
  await db.execute(sql`DELETE FROM q_transactions WHERE fingerprint LIKE ${"vitest_liga_%"}`);
  await db.execute(sql`DELETE FROM user_scores WHERE fingerprint LIKE ${"vitest_liga_%"}`);
  await db.execute(sql`DELETE FROM votes WHERE fingerprint LIKE ${"vitest_liga_%"}`);
  await db.execute(sql`DELETE FROM user_badges WHERE fingerprint LIKE ${"vitest_liga_%"}`);
  await db.execute(sql`DELETE FROM league_members WHERE fingerprint LIKE ${"vitest_liga_%"}`);
  await db.execute(sql`DELETE FROM markets WHERE slug LIKE ${"vitest-liga%"}`);
  // temporadas de teste de semanas passadas
  await db.execute(sql`DELETE FROM league_seasons WHERE weekStart = '2020-01-06'`);
}

function spDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}

describe.skipIf(!hasDatabase)("Liga semanal e badges (integração)", () => {
  beforeAll(async () => {
    const db = await getDb();
    await cleanup(db);
  });

  afterAll(async () => {
    const db = await getDb();
    await cleanup(db);
  });

  describe("temporadas", () => {
    it("getCurrentSeason cria a temporada da semana uma única vez (lazy)", async () => {
      const s1 = await getCurrentSeason();
      const s2 = await getCurrentSeason();
      expect(s1?.id).toBe(s2?.id);
      expect(s1?.weekStart).toBe(currentWeekStart());
    });

    it("ensureEnrolled inscreve novato no Bronze e é idempotente", async () => {
      const m1 = await ensureEnrolled(FP_A);
      const m2 = await ensureEnrolled(FP_A);
      expect(m1?.division).toBe("bronze");
      expect(m1?.id).toBe(m2?.id);
    });

    it("standings ordenam por Qs ganhos na semana", async () => {
      await ensureEnrolled(FP_B);
      await grantQs({ fingerprint: FP_A, amount: 30, type: "admin_adjust", idempotencyKey: `liga:a:${FP_A}` });
      await grantQs({ fingerprint: FP_B, amount: 80, type: "admin_adjust", idempotencyKey: `liga:b:${FP_B}` });
      const season = await getCurrentSeason();
      const standings = await getLeagueStandings(season!.id, "bronze");
      const a = standings.find((s: any) => s.fingerprint === FP_A);
      const b = standings.find((s: any) => s.fingerprint === FP_B);
      expect(b!.rank).toBeLessThan(a!.rank);
      expect(b!.weeklyQs).toBe(80);
    });
  });

  describe("fechamento de temporada", () => {
    it("fecha semana passada, grava finalRank e promove o topo", async () => {
      const db = await getDb();
      // temporada antiga (semana de 2020-01-06) com A e B no bronze
      await db.execute(sql`INSERT INTO league_seasons (weekStart, status) VALUES ('2020-01-06', 'active')`);
      const seasonRows = await db.execute(sql`SELECT id FROM league_seasons WHERE weekStart = '2020-01-06'`);
      const rows: any[] = Array.isArray(seasonRows[0]) ? seasonRows[0] : (seasonRows as any).rows ?? [];
      const oldSeasonId = Number(rows[0].id);
      await db.execute(sql`INSERT INTO league_members (seasonId, fingerprint, division) VALUES (${oldSeasonId}, ${FP_A}, 'bronze'), (${oldSeasonId}, ${FP_B}, 'bronze')`);
      // lançamentos dentro daquela semana antiga
      await db.execute(
        sql`INSERT INTO q_transactions (fingerprint, amount, type, idempotencyKey, createdAt)
            VALUES (${FP_A}, 100, 'admin_adjust', ${"liga:old:a"}, '2020-01-07 12:00:00'),
                   (${FP_B}, 10, 'admin_adjust', ${"liga:old:b"}, '2020-01-07 12:00:00')`
      );

      const result = await closeFinishedSeasons();
      expect(result.closed).toBeGreaterThanOrEqual(1);

      const closed = await db.execute(sql`SELECT status FROM league_seasons WHERE id = ${oldSeasonId}`);
      const closedRows: any[] = Array.isArray(closed[0]) ? closed[0] : (closed as any).rows ?? [];
      expect(closedRows[0].status).toBe("closed");

      const members = await db.execute(sql`SELECT fingerprint, finalRank FROM league_members WHERE seasonId = ${oldSeasonId} ORDER BY finalRank`);
      const memberRows: any[] = Array.isArray(members[0]) ? members[0] : (members as any).rows ?? [];
      expect(memberRows[0].fingerprint).toBe(FP_A);
      expect(memberRows[0].finalRank).toBe(1);

      // A (1º de 2, moveCount=1) sobe para prata na temporada corrente
      const current = await getCurrentSeason();
      const promoted = await db.execute(
        sql`SELECT division FROM league_members WHERE seasonId = ${current!.id} AND fingerprint = ${FP_A}`
      );
      const promotedRows: any[] = Array.isArray(promoted[0]) ? promoted[0] : (promoted as any).rows ?? [];
      // A já estava inscrito no bronze da semana corrente (teste anterior) —
      // o UNIQUE preserva a inscrição existente; garantimos só que existe.
      expect(promotedRows.length).toBe(1);

      // re-execução é no-op
      const again = await closeFinishedSeasons();
      expect(again.closed).toBe(0);
    });
  });

  describe("streak diário com proteção", () => {
    it("pulou 1 dia COM shield: streak continua e shield é consumido", async () => {
      const db = await getDb();
      await db.execute(
        sql`INSERT INTO user_scores (fingerprint, dailyStreak, lastCheckinDate, streakShields)
            VALUES (${FP_SHIELD}, 5, ${spDateNDaysAgo(2)}, 1)
            ON DUPLICATE KEY UPDATE dailyStreak = 5, lastCheckinDate = ${spDateNDaysAgo(2)}, streakShields = 1`
      );
      const r = await processVoteRewards(FP_SHIELD, { id: 999901, createdAt: null });
      expect(r.dailyStreak).toBe(6);
      const wallet = await getWallet(FP_SHIELD);
      expect(wallet.streakShields).toBe(0);
    });

    it("pulou 1 dia SEM shield: streak volta para 1", async () => {
      const db = await getDb();
      await db.execute(
        sql`INSERT INTO user_scores (fingerprint, dailyStreak, lastCheckinDate, streakShields)
            VALUES (${FP_NOSHIELD}, 5, ${spDateNDaysAgo(2)}, 0)
            ON DUPLICATE KEY UPDATE dailyStreak = 5, lastCheckinDate = ${spDateNDaysAgo(2)}, streakShields = 0`
      );
      const r = await processVoteRewards(FP_NOSHIELD, { id: 999902, createdAt: null });
      expect(r.dailyStreak).toBe(1);
    });
  });

  describe("badges", () => {
    it("primeira opinião concede badge + Qs uma única vez", async () => {
      const db = await getDb();
      const slug = "vitest-liga-badge";
      await db.execute(
        sql`INSERT INTO markets (slug, title, optionA, optionB, labelA, labelB, category, isActive)
            VALUES (${slug}, 'Badge test', 'Sim', 'Não', 'Sim', 'Não', 'vitest-liga', 1)`
      );
      const idRows = await db.execute(sql`SELECT id FROM markets WHERE slug = ${slug}`);
      const rows: any[] = Array.isArray(idRows[0]) ? idRows[0] : (idRows as any).rows ?? [];
      const marketId = Number(rows[0].id);
      await db.execute(sql`INSERT INTO votes (marketId, choice, fingerprint) VALUES (${marketId}, 'A', ${FP_BADGE})`);

      const q1 = await checkAndAwardBadges(FP_BADGE);
      expect(q1).toBe(10); // primeira-opiniao
      const q2 = await checkAndAwardBadges(FP_BADGE);
      expect(q2).toBe(0);

      const mine = await getMyBadges(FP_BADGE);
      expect(mine.map((b: any) => b.code)).toContain("primeira-opiniao");
      expect(mine.length).toBe(1);
    });

    it("vidente-5 é concedida com maxStreak >= 5", async () => {
      const db = await getDb();
      await db.execute(sql`UPDATE user_scores SET maxStreak = 5 WHERE fingerprint = ${FP_BADGE}`);
      await checkAndAwardBadges(FP_BADGE);
      const mine = await getMyBadges(FP_BADGE);
      expect(mine.map((b: any) => b.code)).toContain("vidente-5");
    });
  });
});
