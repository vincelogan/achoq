import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { userScores } from "../drizzle/schema";
import { countTodayVoteGrants, ensureScoreRow, grantQs, spDate } from "./economy";

/**
 * Recompensas de gamificação em Qs.
 * Todos os ganhos passam por grantQs (idempotente); falhas aqui nunca devem
 * derrubar o voto — o chamador usa try/catch best-effort.
 */

export const REWARDS = {
  vote: 5, // por voto em enquete ativa
  voteDailyCap: 10, // máx. de votos premiados por dia (50 Qs/dia)
  earlyBird: 5, // opinar até 48h após a criação da enquete
  earlyBirdWindowMs: 48 * 60 * 60 * 1000,
  dailyBase: 10, // check-in diário (1º voto do dia SP)
  dailyStreak3: 15, // com dailyStreak >= 3
  dailyStreak7: 25, // com dailyStreak >= 7
  correct: 20, // acerto na resolução
  streakBonus: 10, // bônus por sequência de acertos >= 3
} as const;

function previousSpDate(dateStr: string, daysBack: number): string {
  // dateStr é YYYY-MM-DD; aritmética em UTC é segura aqui
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - daysBack);
  return d.toISOString().slice(0, 10);
}

/**
 * Check-in diário: concedido no primeiro voto do dia (fuso São Paulo).
 * - dia seguinte ao último check-in → streak continua (+1)
 * - pulou exatamente 1 dia e tem proteção → consome 1 shield, streak continua
 * - caso contrário → streak recomeça em 1
 */
async function processDailyCheckin(fingerprint: string): Promise<{ granted: number; dailyStreak: number }> {
  const db = await getDb();
  if (!db) return { granted: 0, dailyStreak: 0 };

  const today = spDate();
  await ensureScoreRow(fingerprint);
  const rows = await db
    .select({
      dailyStreak: userScores.dailyStreak,
      lastCheckinDate: userScores.lastCheckinDate,
      streakShields: userScores.streakShields,
    })
    .from(userScores)
    .where(eq(userScores.fingerprint, fingerprint))
    .limit(1);
  const row = rows[0] ?? { dailyStreak: 0, lastCheckinDate: null, streakShields: 0 };

  if (row.lastCheckinDate === today) {
    return { granted: 0, dailyStreak: Number(row.dailyStreak) };
  }

  const yesterday = previousSpDate(today, 1);
  const dayBefore = previousSpDate(today, 2);

  let newStreak = 1;
  let consumeShield = false;
  if (row.lastCheckinDate === yesterday) {
    newStreak = Number(row.dailyStreak) + 1;
  } else if (row.lastCheckinDate === dayBefore && Number(row.streakShields) > 0) {
    newStreak = Number(row.dailyStreak) + 1;
    consumeShield = true;
  }

  const amount =
    newStreak >= 7 ? REWARDS.dailyStreak7 : newStreak >= 3 ? REWARDS.dailyStreak3 : REWARDS.dailyBase;

  const result = await grantQs({
    fingerprint,
    amount,
    type: "daily_checkin",
    idempotencyKey: `daily:${today}:${fingerprint}`,
  });

  if (!result.granted) {
    // Corrida: outra requisição fez o check-in de hoje primeiro
    return { granted: 0, dailyStreak: Number(row.dailyStreak) };
  }

  await db.execute(
    sql`UPDATE ${userScores}
        SET dailyStreak = ${newStreak},
            lastCheckinDate = ${today},
            streakShields = streakShields - ${consumeShield ? 1 : 0}
        WHERE fingerprint = ${fingerprint}`
  );

  return { granted: amount, dailyStreak: newStreak };
}

/**
 * Recompensas disparadas por um voto: participação (com cap diário),
 * early bird (≤48h da criação da enquete) e check-in diário.
 */
export async function processVoteRewards(
  fingerprint: string,
  market: { id: number; createdAt: Date | string | null }
): Promise<{ qsEarned: number; dailyStreak: number }> {
  let qsEarned = 0;

  // 1. Participação (cap diário)
  const grantedToday = await countTodayVoteGrants(fingerprint);
  if (grantedToday < REWARDS.voteDailyCap) {
    const r = await grantQs({
      fingerprint,
      amount: REWARDS.vote,
      type: "vote",
      idempotencyKey: `vote:${market.id}:${fingerprint}`,
      refType: "market",
      refId: market.id,
    });
    if (r.granted) qsEarned += r.amount;
  }

  // 2. Early bird
  if (market.createdAt) {
    const created = new Date(market.createdAt).getTime();
    if (Date.now() - created <= REWARDS.earlyBirdWindowMs) {
      const r = await grantQs({
        fingerprint,
        amount: REWARDS.earlyBird,
        type: "early_bird",
        idempotencyKey: `early:${market.id}:${fingerprint}`,
        refType: "market",
        refId: market.id,
      });
      if (r.granted) qsEarned += r.amount;
    }
  }

  // 3. Check-in diário
  const checkin = await processDailyCheckin(fingerprint);
  qsEarned += checkin.granted;

  return { qsEarned, dailyStreak: checkin.dailyStreak };
}
