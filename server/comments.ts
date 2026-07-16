import { and, desc, eq, lt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { commentReports, comments, userScores } from "../drizzle/schema";
import { isDuplicateEntry } from "./economy";
import { checkAndAwardBadges } from "./gamification";

/**
 * Comentários por enquete (estilo Polymarket, versão enxuta):
 * - exige apelido do ranking para comentar (identidade pública mínima);
 * - report único por fingerprint; 3 reports ocultam automaticamente;
 * - moderação (ocultar/excluir/restaurar) no admin.
 */

const AUTO_HIDE_REPORTS = 3;

export async function listComments(marketId: number, opts?: { limit?: number; cursor?: number }) {
  const db = await getDb();
  if (!db) return { items: [], nextCursor: null as number | null };
  const limit = Math.min(opts?.limit ?? 20, 50);

  const conditions = [eq(comments.marketId, marketId), eq(comments.status, "visible")];
  if (opts?.cursor) conditions.push(lt(comments.id, opts.cursor));

  const rows = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      fingerprint: comments.fingerprint,
      nickname: userScores.nickname,
    })
    .from(comments)
    .leftJoin(userScores, eq(comments.fingerprint, userScores.fingerprint))
    .where(and(...conditions))
    .orderBy(desc(comments.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map((r: any) => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt,
    displayName: r.nickname || `Anônimo ${String(r.fingerprint).slice(-4)}`,
  }));
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

export async function addComment(marketId: number, fingerprint: string, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const trimmed = content.trim();
  if (trimmed.length < 2) throw new Error("Comentário muito curto.");
  if (trimmed.length > 500) throw new Error("Comentário muito longo (máx. 500 caracteres).");

  // Comentar exige apelido definido no ranking
  const scoreRows = await db
    .select({ nickname: userScores.nickname })
    .from(userScores)
    .where(eq(userScores.fingerprint, fingerprint))
    .limit(1);
  if (!scoreRows[0]?.nickname) {
    throw new Error("Defina um apelido para comentar.");
  }

  await db.insert(comments).values({ marketId, fingerprint, content: trimmed });

  // Badge "Comentarista" (best-effort)
  try {
    await checkAndAwardBadges(fingerprint);
  } catch {
    /* nunca derrubar o comentário */
  }
  return { success: true };
}

export async function reportComment(commentId: number, fingerprint: string, reason?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select({ id: comments.id, reportCount: comments.reportCount })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  if (!existing[0]) throw new Error("Comentário não encontrado.");

  try {
    await db.insert(commentReports).values({ commentId, fingerprint, reason: reason ?? null });
  } catch (e: any) {
    if (isDuplicateEntry(e)) throw new Error("Você já denunciou este comentário.");
    throw e;
  }

  const newCount = Number(existing[0].reportCount) + 1;
  await db
    .update(comments)
    .set({
      reportCount: newCount,
      // Auto-oculta no 3º report até um moderador revisar
      ...(newCount >= AUTO_HIDE_REPORTS ? { status: "hidden" as const } : {}),
    })
    .where(eq(comments.id, commentId));

  return { success: true, hidden: newCount >= AUTO_HIDE_REPORTS };
}

// ─── Moderação (admin) ────────────────────────────────────────────────────────

export async function listReportedComments() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: comments.id,
      marketId: comments.marketId,
      content: comments.content,
      status: comments.status,
      reportCount: comments.reportCount,
      createdAt: comments.createdAt,
      nickname: userScores.nickname,
    })
    .from(comments)
    .leftJoin(userScores, eq(comments.fingerprint, userScores.fingerprint))
    .where(sql`${comments.reportCount} > 0 AND ${comments.status} != 'deleted'`)
    .orderBy(desc(comments.reportCount), desc(comments.id))
    .limit(100);
}

export async function moderateComment(commentId: number, action: "hide" | "delete" | "restore") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const status = action === "hide" ? "hidden" : action === "delete" ? "deleted" : "visible";
  const reset = action === "restore" ? { reportCount: 0 } : {};
  await db.update(comments).set({ status, ...reset }).where(eq(comments.id, commentId));
  return { success: true };
}
