import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { qTransactions, userScores } from "../drizzle/schema";

/**
 * Economia da moeda fictícia Q.
 *
 * Regras estruturais:
 * - O ledger `q_transactions` é append-only e é a fonte da verdade.
 * - `user_scores.qBalance` é um cache do saldo, atualizado na MESMA
 *   transação de cada lançamento. O recompute de acurácia (recalcUserScore)
 *   NUNCA toca no qBalance.
 * - Toda concessão tem `idempotencyKey` determinística: re-executar o mesmo
 *   evento (ex.: re-resolução de enquete) vira no-op via UNIQUE constraint.
 * - Votar nunca custa Qs e o saldo nunca fica negativo.
 */

export type GrantResult = { granted: boolean; amount: number };
export type SpendResult = { spent: boolean; balance: number; error?: string };

export class InsufficientBalanceError extends Error {
  constructor() {
    super("Saldo de Qs insuficiente.");
    this.name = "InsufficientBalanceError";
  }
}

function isDuplicateEntry(e: any): boolean {
  return e?.code === "ER_DUP_ENTRY" || e?.errno === 1062 || e?.cause?.code === "ER_DUP_ENTRY";
}

/**
 * Data corrente (YYYY-MM-DD) no fuso America/Sao_Paulo.
 * O Brasil não adota mais horário de verão (desde 2019): SP é UTC-3 fixo.
 */
export function spDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Instante UTC da meia-noite de São Paulo do dia corrente (SP = UTC-3 fixo). */
export function spDayStartUtc(now: Date = new Date()): Date {
  return new Date(`${spDate(now)}T03:00:00.000Z`);
}

/** Garante que exista a linha de user_scores do fingerprint. */
export async function ensureScoreRow(fingerprint: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(
    sql`INSERT IGNORE INTO ${userScores} (fingerprint) VALUES (${fingerprint})`
  );
}

/**
 * Credita Qs de forma idempotente. Retorna {granted:false} se a
 * idempotencyKey já existir (evento já premiado).
 */
export async function grantQs(params: {
  fingerprint: string;
  amount: number;
  type: string;
  idempotencyKey: string;
  refType?: string;
  refId?: number;
}): Promise<GrantResult> {
  const db = await getDb();
  if (!db) return { granted: false, amount: 0 };
  if (params.amount <= 0) return { granted: false, amount: 0 };

  await ensureScoreRow(params.fingerprint);
  try {
    await db.transaction(async (tx: any) => {
      await tx.insert(qTransactions).values({
        fingerprint: params.fingerprint,
        amount: params.amount,
        type: params.type,
        refType: params.refType ?? null,
        refId: params.refId ?? null,
        idempotencyKey: params.idempotencyKey,
      });
      await tx.execute(
        sql`UPDATE ${userScores} SET qBalance = qBalance + ${params.amount} WHERE fingerprint = ${params.fingerprint}`
      );
    });
    return { granted: true, amount: params.amount };
  } catch (e: any) {
    if (isDuplicateEntry(e)) return { granted: false, amount: 0 };
    throw e;
  }
}

/**
 * Debita Qs de forma transacional com lock de linha (SELECT ... FOR UPDATE);
 * lança InsufficientBalanceError se o saldo não cobrir o valor.
 */
export async function spendQs(params: {
  fingerprint: string;
  amount: number;
  type: string;
  idempotencyKey: string;
  refType?: string;
  refId?: number;
}): Promise<SpendResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (params.amount <= 0) throw new Error("Valor de gasto inválido");

  await ensureScoreRow(params.fingerprint);
  try {
    let newBalance = 0;
    await db.transaction(async (tx: any) => {
      const result = await tx.execute(
        sql`SELECT qBalance FROM ${userScores} WHERE fingerprint = ${params.fingerprint} FOR UPDATE`
      );
      const rows: any[] = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];
      const balance = Number(rows[0]?.qBalance ?? 0);
      if (balance < params.amount) {
        throw new InsufficientBalanceError();
      }
      await tx.insert(qTransactions).values({
        fingerprint: params.fingerprint,
        amount: -params.amount,
        type: params.type,
        refType: params.refType ?? null,
        refId: params.refId ?? null,
        idempotencyKey: params.idempotencyKey,
      });
      await tx.execute(
        sql`UPDATE ${userScores} SET qBalance = qBalance - ${params.amount} WHERE fingerprint = ${params.fingerprint}`
      );
      newBalance = balance - params.amount;
    });
    return { spent: true, balance: newBalance };
  } catch (e: any) {
    if (e instanceof InsufficientBalanceError) throw e;
    if (isDuplicateEntry(e)) return { spent: false, balance: 0, error: "Operação já processada." };
    throw e;
  }
}

/**
 * Carteira do fingerprint. Na primeira leitura, migra o saldo herdado dos
 * pontos de acurácia existentes (lançamento único `migration:{fp}` — a
 * UNIQUE key elimina corrida entre requisições concorrentes).
 */
export async function getWallet(fingerprint: string) {
  const db = await getDb();
  if (!db) return { qBalance: 0, dailyStreak: 0, streakShields: 0, lastCheckinDate: null };

  await ensureScoreRow(fingerprint);

  const existing = await db
    .select({ id: qTransactions.id })
    .from(qTransactions)
    .where(eq(qTransactions.fingerprint, fingerprint))
    .limit(1);

  if (existing.length === 0) {
    const scoreRows = await db
      .select({ points: userScores.points })
      .from(userScores)
      .where(eq(userScores.fingerprint, fingerprint))
      .limit(1);
    const points = Number(scoreRows[0]?.points ?? 0);
    if (points > 0) {
      await grantQs({
        fingerprint,
        amount: points,
        type: "migration",
        idempotencyKey: `migration:${fingerprint}`,
      });
    }
  }

  const rows = await db
    .select({
      qBalance: userScores.qBalance,
      dailyStreak: userScores.dailyStreak,
      streakShields: userScores.streakShields,
      lastCheckinDate: userScores.lastCheckinDate,
    })
    .from(userScores)
    .where(eq(userScores.fingerprint, fingerprint))
    .limit(1);

  const row = rows[0];
  return {
    qBalance: Number(row?.qBalance ?? 0),
    dailyStreak: Number(row?.dailyStreak ?? 0),
    streakShields: Number(row?.streakShields ?? 0),
    lastCheckinDate: row?.lastCheckinDate ?? null,
  };
}

/** Extrato (mais recentes primeiro). */
export async function getTransactions(fingerprint: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(qTransactions)
    .where(eq(qTransactions.fingerprint, fingerprint))
    .orderBy(desc(qTransactions.id))
    .limit(Math.min(limit, 200));
}

/** Reconciliação: recalcula o saldo a partir do ledger (fonte da verdade). */
export async function recalcQBalance(fingerprint: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${qTransactions.amount}), 0)` })
    .from(qTransactions)
    .where(eq(qTransactions.fingerprint, fingerprint));
  const total = Number(result[0]?.total ?? 0);
  await db
    .update(userScores)
    .set({ qBalance: total })
    .where(eq(userScores.fingerprint, fingerprint));
  return total;
}

/** Quantos votos premiados o fingerprint já teve hoje (cap diário). */
export async function countTodayVoteGrants(fingerprint: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(qTransactions)
    .where(
      and(
        eq(qTransactions.fingerprint, fingerprint),
        eq(qTransactions.type, "vote"),
        gte(qTransactions.createdAt, spDayStartUtc())
      )
    );
  return Number(result[0]?.count ?? 0);
}
