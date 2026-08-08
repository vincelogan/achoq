import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { badges, leagueMembers, leagueSeasons, qTransactions, userBadges, userScores, votes } from "../drizzle/schema";
import { countTodayVoteGrants, ensureScoreRow, grantQs, isDuplicateEntry, spDate } from "./economy";

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

  // 4. Conquistas + inscrição na liga da semana (best-effort)
  try {
    const badgeQs = await checkAndAwardBadges(fingerprint);
    qsEarned += badgeQs;
    await ensureEnrolled(fingerprint);
  } catch (e) {
    console.error("[processVoteRewards] badges/liga:", e);
  }

  return { qsEarned, dailyStreak: checkin.dailyStreak };
}

// ─── Badges ───────────────────────────────────────────────────────────────────

/**
 * Avalia os critérios de todas as badges ainda não conquistadas pelo
 * fingerprint e concede as elegíveis (com Qs de recompensa).
 * Retorna o total de Qs ganhos em badges nesta chamada.
 */
export async function checkAndAwardBadges(fingerprint: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const allBadges = await db.select().from(badges);
  const mine = await db
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.fingerprint, fingerprint));
  const owned = new Set(mine.map((b: any) => b.badgeId));
  const pending = allBadges.filter((b: any) => !owned.has(b.id));
  if (pending.length === 0) return 0;

  // Métricas usadas pelos critérios
  const voteCountRows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(votes)
    .where(eq(votes.fingerprint, fingerprint));
  const voteCount = Number(voteCountRows[0]?.count ?? 0);

  const scoreRows = await db
    .select({
      correctVotes: userScores.correctVotes,
      maxStreak: userScores.maxStreak,
      dailyStreak: userScores.dailyStreak,
    })
    .from(userScores)
    .where(eq(userScores.fingerprint, fingerprint))
    .limit(1);
  const score = scoreRows[0] ?? { correctVotes: 0, maxStreak: 0, dailyStreak: 0 };

  const earlyRows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(qTransactions)
    .where(and(eq(qTransactions.fingerprint, fingerprint), eq(qTransactions.type, "early_bird")));
  const earlyCount = Number(earlyRows[0]?.count ?? 0);

  let commentCount = 0;
  try {
    const commentRows = await db.execute(
      sql`SELECT COUNT(*) as count FROM comments WHERE fingerprint = ${fingerprint} AND status = 'visible'`
    );
    const rows: any[] = Array.isArray(commentRows[0]) ? commentRows[0] : (commentRows as any).rows ?? [];
    commentCount = Number(rows[0]?.count ?? 0);
  } catch {
    // Tabela de comentários pode ainda não existir
  }

  let approvedSuggestions = 0;
  try {
    const suggestionRows = await db.execute(
      sql`SELECT COUNT(*) as count FROM market_suggestions WHERE fingerprint = ${fingerprint} AND status = 'approved'`
    );
    const rows: any[] = Array.isArray(suggestionRows[0]) ? suggestionRows[0] : (suggestionRows as any).rows ?? [];
    approvedSuggestions = Number(rows[0]?.count ?? 0);
  } catch {
    // Tabela de sugestões pode ainda não existir
  }

  const meets = (code: string): boolean => {
    switch (code) {
      case "primeira-opiniao": return voteCount >= 1;
      case "dez-opinioes": return voteCount >= 10;
      case "cinquenta-opinioes": return voteCount >= 50;
      case "cem-opinioes": return voteCount >= 100;
      case "primeiro-acerto": return Number(score.correctVotes) >= 1;
      case "dez-acertos": return Number(score.correctVotes) >= 10;
      case "vidente-5": return Number(score.maxStreak) >= 5;
      case "assiduo-3": return Number(score.dailyStreak) >= 3;
      case "assiduo-7": return Number(score.dailyStreak) >= 7;
      case "assiduo-30": return Number(score.dailyStreak) >= 30;
      case "madrugador": return earlyCount >= 10;
      case "comentarista": return commentCount >= 10;
      case "ideia-aprovada": return approvedSuggestions >= 1;
      default: return false;
    }
  };

  let totalQs = 0;
  for (const badge of pending) {
    if (!meets(badge.code)) continue;
    try {
      await db.insert(userBadges).values({ fingerprint, badgeId: badge.id });
    } catch (e: any) {
      if (isDuplicateEntry(e)) continue;
      throw e;
    }
    if (badge.qReward > 0) {
      const r = await grantQs({
        fingerprint,
        amount: badge.qReward,
        type: "badge_reward",
        idempotencyKey: `badge:${badge.code}:${fingerprint}`,
        refType: "badge",
        refId: badge.id,
      });
      if (r.granted) totalQs += r.amount;
    }
  }
  return totalQs;
}

export async function getMyBadges(fingerprint: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: badges.id,
      code: badges.code,
      name: badges.name,
      description: badges.description,
      icon: badges.icon,
      tier: badges.tier,
      qReward: badges.qReward,
      awardedAt: userBadges.awardedAt,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.fingerprint, fingerprint));
}

export async function getAllBadges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(badges);
}

// ─── Liga semanal ─────────────────────────────────────────────────────────────

export const DIVISIONS = ["bronze", "prata", "ouro", "diamante"] as const;
export type Division = (typeof DIVISIONS)[number];

/** Segunda-feira da semana corrente em America/Sao_Paulo (YYYY-MM-DD). */
export function currentWeekStart(now: Date = new Date()): string {
  const today = spDate(now);
  const d = new Date(`${today}T12:00:00.000Z`);
  // getUTCDay: 0=domingo ... 1=segunda
  const dow = d.getUTCDay();
  const back = dow === 0 ? 6 : dow - 1;
  d.setUTCDate(d.getUTCDate() - back);
  return d.toISOString().slice(0, 10);
}

/** Instante UTC do início da semana corrente (segunda 00:00 em SP = 03:00Z). */
export function currentWeekStartUtc(now: Date = new Date()): Date {
  return new Date(`${currentWeekStart(now)}T03:00:00.000Z`);
}

/** Busca (ou cria, lazy) a temporada da semana corrente. */
export async function getCurrentSeason() {
  const db = await getDb();
  if (!db) return null;
  const weekStart = currentWeekStart();

  const existing = await db.select().from(leagueSeasons).where(eq(leagueSeasons.weekStart, weekStart)).limit(1);
  if (existing.length > 0) return existing[0];

  try {
    await db.insert(leagueSeasons).values({ weekStart });
  } catch (e: any) {
    // Corrida: outra requisição criou primeiro (UNIQUE weekStart)
    if (!isDuplicateEntry(e)) throw e;
  }
  const created = await db.select().from(leagueSeasons).where(eq(leagueSeasons.weekStart, weekStart)).limit(1);
  return created[0] ?? null;
}

/**
 * Inscreve o fingerprint na temporada corrente (lazy, na primeira atividade
 * da semana). A divisão é herdada da participação mais recente; novatos
 * começam no Bronze.
 */
export async function ensureEnrolled(fingerprint: string) {
  const db = await getDb();
  if (!db) return null;
  const season = await getCurrentSeason();
  if (!season) return null;

  const existing = await db
    .select()
    .from(leagueMembers)
    .where(and(eq(leagueMembers.seasonId, season.id), eq(leagueMembers.fingerprint, fingerprint)))
    .limit(1);
  if (existing.length > 0) return existing[0];

  const previous = await db
    .select({ division: leagueMembers.division })
    .from(leagueMembers)
    .where(eq(leagueMembers.fingerprint, fingerprint))
    .orderBy(desc(leagueMembers.id))
    .limit(1);
  const division = (previous[0]?.division as Division) ?? "bronze";

  try {
    await db.insert(leagueMembers).values({ seasonId: season.id, fingerprint, division });
  } catch (e: any) {
    if (!isDuplicateEntry(e)) throw e;
  }
  const created = await db
    .select()
    .from(leagueMembers)
    .where(and(eq(leagueMembers.seasonId, season.id), eq(leagueMembers.fingerprint, fingerprint)))
    .limit(1);
  return created[0] ?? null;
}

/**
 * Classificação de uma divisão na temporada: Qs ganhos na semana
 * (SUM dos lançamentos positivos desde a segunda-feira) por membro.
 */
export async function getLeagueStandings(seasonId: number, division: Division) {
  const db = await getDb();
  if (!db) return [];

  const weekStart = currentWeekStartUtc();
  const rows = await db
    .select({
      fingerprint: leagueMembers.fingerprint,
      division: leagueMembers.division,
      nickname: userScores.nickname,
      weeklyQs: sql<number>`COALESCE((
        SELECT SUM(qt.amount) FROM q_transactions qt
        WHERE qt.fingerprint = ${leagueMembers.fingerprint}
          AND qt.amount > 0
          AND qt.createdAt >= ${weekStart}
      ), 0)`,
    })
    .from(leagueMembers)
    .leftJoin(userScores, eq(leagueMembers.fingerprint, userScores.fingerprint))
    .where(and(eq(leagueMembers.seasonId, seasonId), eq(leagueMembers.division, division)));

  return rows
    .map((r: any) => ({
      fingerprint: r.fingerprint,
      division: r.division,
      displayName: r.nickname || `Anônimo ${String(r.fingerprint).slice(-4)}`,
      weeklyQs: Number(r.weeklyQs),
    }))
    .sort((a: any, b: any) => b.weeklyQs - a.weeklyQs)
    .map((r: any, i: number) => ({ ...r, rank: i + 1 }));
}

/**
 * Fecha as temporadas de semanas passadas: grava finalRank/finalQs e
 * promove/rebaixa (top/bottom 10, ou 20% em divisões pequenas), inscrevendo
 * os membros na temporada corrente com a nova divisão.
 * Idempotente: só processa temporadas `active` de semanas encerradas.
 */
export async function closeFinishedSeasons(): Promise<{ closed: number }> {
  const db = await getDb();
  if (!db) return { closed: 0 };
  const week = currentWeekStart();

  const finished = await db
    .select()
    .from(leagueSeasons)
    .where(and(eq(leagueSeasons.status, "active"), sql`${leagueSeasons.weekStart} < ${week}`));

  let closed = 0;
  for (const season of finished) {
    const currentSeason = await getCurrentSeason();
    for (const division of DIVISIONS) {
      const standings = await getSeasonFinalStandings(season.id, season.weekStart, division);
      const n = standings.length;
      if (n === 0) continue;
      const moveCount = n >= 20 ? 10 : Math.max(1, Math.floor(n * 0.2));
      const divIdx = DIVISIONS.indexOf(division);

      for (const entry of standings) {
        await db
          .update(leagueMembers)
          .set({ finalRank: entry.rank, finalQs: entry.weeklyQs })
          .where(and(eq(leagueMembers.seasonId, season.id), eq(leagueMembers.fingerprint, entry.fingerprint)));

        let nextDivision = division as Division;
        // n === 1 não promove nem rebaixa (divisão de uma pessoa só)
        if (n > 1 && entry.rank <= moveCount && divIdx < DIVISIONS.length - 1) {
          nextDivision = DIVISIONS[divIdx + 1];
        } else if (n > 1 && entry.rank > n - moveCount && divIdx > 0) {
          nextDivision = DIVISIONS[divIdx - 1];
        }

        if (currentSeason) {
          try {
            await db.insert(leagueMembers).values({
              seasonId: currentSeason.id,
              fingerprint: entry.fingerprint,
              division: nextDivision,
            });
          } catch (e: any) {
            if (!isDuplicateEntry(e)) throw e;
          }
        }
      }
    }
    await db.update(leagueSeasons).set({ status: "closed" }).where(eq(leagueSeasons.id, season.id));
    closed++;
  }
  return { closed };
}

/** Classificação final de uma temporada encerrada (janela da semana dela). */
async function getSeasonFinalStandings(seasonId: number, weekStart: string, division: Division) {
  const db = await getDb();
  if (!db) return [];
  const start = new Date(`${weekStart}T03:00:00.000Z`);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      fingerprint: leagueMembers.fingerprint,
      weeklyQs: sql<number>`COALESCE((
        SELECT SUM(qt.amount) FROM q_transactions qt
        WHERE qt.fingerprint = ${leagueMembers.fingerprint}
          AND qt.amount > 0
          AND qt.createdAt >= ${start}
          AND qt.createdAt < ${end}
      ), 0)`,
    })
    .from(leagueMembers)
    .where(and(eq(leagueMembers.seasonId, seasonId), eq(leagueMembers.division, division)));

  return rows
    .map((r: any) => ({ fingerprint: r.fingerprint, weeklyQs: Number(r.weeklyQs) }))
    .sort((a: any, b: any) => b.weeklyQs - a.weeklyQs)
    .map((r: any, i: number) => ({ ...r, rank: i + 1 }));
}
