import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { markets, marketSuggestions, userScores } from "../drizzle/schema";
import { grantQs, spendQs } from "./economy";
import { checkAndAwardBadges } from "./gamification";

/**
 * Enquetes sugeridas por usuários (padrão Manifold adaptado):
 * - sugerir custa Qs (sink da economia) e exige apelido;
 * - fila de aprovação no admin preserva o controle editorial;
 * - rejeição estorna os Qs automaticamente;
 * - aprovação publica a enquete e concede a badge "Pauteiro".
 */

export const SUGGESTION_COST = 100;
const MAX_PENDING_PER_USER = 3;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

export async function createSuggestion(input: {
  fingerprint: string;
  title: string;
  category: string;
  optionA: string;
  optionB: string;
  labelA: string;
  labelB: string;
  description?: string;
  endsAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Exige apelido (mesma regra dos comentários — identidade mínima)
  const scoreRows = await db
    .select({ nickname: userScores.nickname })
    .from(userScores)
    .where(eq(userScores.fingerprint, input.fingerprint))
    .limit(1);
  if (!scoreRows[0]?.nickname) throw new Error("Defina um apelido para sugerir enquetes.");

  const pendingRows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(marketSuggestions)
    .where(and(eq(marketSuggestions.fingerprint, input.fingerprint), eq(marketSuggestions.status, "pending")));
  if (Number(pendingRows[0]?.count ?? 0) >= MAX_PENDING_PER_USER) {
    throw new Error(`Você já tem ${MAX_PENDING_PER_USER} sugestões aguardando revisão.`);
  }

  // Chave monotônica por número de sugestões já cobradas
  const spentRows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(sql`q_transactions`)
    .where(sql`fingerprint = ${input.fingerprint} AND type = 'shop_purchase' AND refType = 'suggestion'`);
  const spends = Number(spentRows[0]?.count ?? 0);

  const result = await spendQs({
    fingerprint: input.fingerprint,
    amount: SUGGESTION_COST,
    type: "shop_purchase",
    idempotencyKey: `suggest:${input.fingerprint}:${spends + 1}`,
    refType: "suggestion",
  });
  if (!result.spent) throw new Error(result.error || "Não foi possível processar a sugestão.");

  await db.insert(marketSuggestions).values({
    fingerprint: input.fingerprint,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    optionA: input.optionA.trim(),
    optionB: input.optionB.trim(),
    labelA: input.labelA.trim(),
    labelB: input.labelB.trim(),
    endsAt: input.endsAt ?? null,
  });

  return { success: true, balance: result.balance };
}

export async function listMySuggestions(fingerprint: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(marketSuggestions)
    .where(eq(marketSuggestions.fingerprint, fingerprint))
    .orderBy(desc(marketSuggestions.id))
    .limit(20);
}

// ─── Moderação (admin) ────────────────────────────────────────────────────────

export async function listPendingSuggestions() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: marketSuggestions.id,
      title: marketSuggestions.title,
      description: marketSuggestions.description,
      category: marketSuggestions.category,
      optionA: marketSuggestions.optionA,
      optionB: marketSuggestions.optionB,
      labelA: marketSuggestions.labelA,
      labelB: marketSuggestions.labelB,
      endsAt: marketSuggestions.endsAt,
      createdAt: marketSuggestions.createdAt,
      fingerprint: marketSuggestions.fingerprint,
      nickname: userScores.nickname,
    })
    .from(marketSuggestions)
    .leftJoin(userScores, eq(marketSuggestions.fingerprint, userScores.fingerprint))
    .where(eq(marketSuggestions.status, "pending"))
    .orderBy(marketSuggestions.createdAt)
    .limit(100);
}

async function uniqueSlug(db: any, base: string): Promise<string> {
  let candidate = base || "enquete";
  for (let i = 2; i < 50; i++) {
    const existing = await db.select({ id: markets.id }).from(markets).where(eq(markets.slug, candidate)).limit(1);
    if (existing.length === 0) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function reviewSuggestion(id: number, action: "approve" | "reject", note?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db.select().from(marketSuggestions).where(eq(marketSuggestions.id, id)).limit(1);
  const suggestion = rows[0];
  if (!suggestion) throw new Error("Sugestão não encontrada.");
  if (suggestion.status !== "pending") throw new Error("Sugestão já revisada.");

  if (action === "approve") {
    const slug = await uniqueSlug(db, slugify(suggestion.title));
    await db.insert(markets).values({
      slug,
      title: suggestion.title,
      description: suggestion.description,
      category: suggestion.category,
      optionA: suggestion.optionA,
      optionB: suggestion.optionB,
      labelA: suggestion.labelA,
      labelB: suggestion.labelB,
      endsAt: suggestion.endsAt,
      isActive: true,
    });
    const created = await db.select({ id: markets.id }).from(markets).where(eq(markets.slug, slug)).limit(1);
    const marketId = created[0]?.id ?? null;

    await db
      .update(marketSuggestions)
      .set({ status: "approved", marketId, reviewNote: note ?? null })
      .where(eq(marketSuggestions.id, id));

    // Badge "Pauteiro" (best-effort)
    try {
      await checkAndAwardBadges(suggestion.fingerprint);
    } catch {
      /* nunca falhar a aprovação por causa da badge */
    }
    return { success: true, marketId, slug };
  }

  // Rejeição: estorna os Qs (idempotente por sugestão)
  await db
    .update(marketSuggestions)
    .set({ status: "rejected", reviewNote: note ?? null })
    .where(eq(marketSuggestions.id, id));
  await grantQs({
    fingerprint: suggestion.fingerprint,
    amount: SUGGESTION_COST,
    type: "reversal",
    idempotencyKey: `suggest-refund:${id}`,
    refType: "suggestion",
    refId: id,
  });
  return { success: true };
}

/** Quantas sugestões aprovadas o fingerprint tem (critério da badge Pauteiro). */
export async function countApprovedSuggestions(fingerprint: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(marketSuggestions)
    .where(and(eq(marketSuggestions.fingerprint, fingerprint), eq(marketSuggestions.status, "approved")));
  return Number(rows[0]?.count ?? 0);
}
