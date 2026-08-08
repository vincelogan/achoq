import { and, desc, eq, lt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { notifications, votes, watchlist } from "../drizzle/schema";
import { isDuplicateEntry, spDate } from "./economy";

/**
 * Notificações in-app (sininho no header).
 * Toda emissão é idempotente por idempotencyKey — eventos re-executados
 * (re-resolução, retries) não duplicam avisos.
 */

export type NotifyInput = {
  fingerprint: string;
  type: string;
  title: string;
  body?: string;
  linkUrl?: string;
  refType?: string;
  refId?: number;
  idempotencyKey: string;
};

export async function notify(input: NotifyInput): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.insert(notifications).values({
      fingerprint: input.fingerprint,
      type: input.type,
      title: input.title.slice(0, 200),
      body: input.body?.slice(0, 300) ?? null,
      linkUrl: input.linkUrl ?? null,
      refType: input.refType ?? null,
      refId: input.refId ?? null,
      idempotencyKey: input.idempotencyKey,
    });
    return true;
  } catch (e: any) {
    if (isDuplicateEntry(e)) return false;
    // Notificação nunca deve derrubar o fluxo que a emitiu
    console.error("[notify] Error:", e);
    return false;
  }
}

export async function listNotifications(fingerprint: string, opts?: { limit?: number; cursor?: number }) {
  const db = await getDb();
  if (!db) return { items: [], nextCursor: null as number | null };
  const limit = Math.min(opts?.limit ?? 20, 50);
  const conditions = [eq(notifications.fingerprint, fingerprint)];
  if (opts?.cursor) conditions.push(lt(notifications.id, opts.cursor));

  const rows = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

export async function unreadCount(fingerprint: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  try {
    const rows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(and(eq(notifications.fingerprint, fingerprint), eq(notifications.isRead, false)));
    return Number(rows[0]?.count ?? 0);
  } catch {
    return 0; // janela pré-migration
  }
}

export async function markAllRead(fingerprint: string) {
  const db = await getDb();
  if (!db) return { success: false };
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.fingerprint, fingerprint), eq(notifications.isRead, false)));
  return { success: true };
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export async function toggleWatch(fingerprint: string, marketId: number): Promise<{ watching: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(and(eq(watchlist.fingerprint, fingerprint), eq(watchlist.marketId, marketId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(watchlist).where(eq(watchlist.id, existing[0].id));
    return { watching: false };
  }
  try {
    await db.insert(watchlist).values({ fingerprint, marketId });
  } catch (e: any) {
    if (!isDuplicateEntry(e)) throw e;
  }
  return { watching: true };
}

export async function isWatching(fingerprint: string, marketId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(and(eq(watchlist.fingerprint, fingerprint), eq(watchlist.marketId, marketId)))
    .limit(1);
  return rows.length > 0;
}

/** Fingerprints que seguem a enquete (para avisos de virada). */
export async function getWatchers(marketId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ fingerprint: watchlist.fingerprint })
    .from(watchlist)
    .where(eq(watchlist.marketId, marketId));
  return rows.map((r: any) => r.fingerprint);
}

// ─── Virada de maioria (feature-assinatura) ───────────────────────────────────

const FLIP_MIN_VOTES = 20;

type FlipStats = { countA: number; countB: number };

function leaderOf(stats: FlipStats): "A" | "B" | null {
  if (stats.countA > stats.countB) return "A";
  if (stats.countB > stats.countA) return "B";
  return null;
}

/**
 * Detecta virada de maioria causada por um voto e notifica votantes e
 * seguidores da enquete (exceto quem causou a virada).
 * Debounce: no máximo 1 aviso por pessoa, por direção, por dia
 * (idempotencyKey inclui o novo líder e a data SP).
 */
export async function detectAndNotifyMajorityFlip(
  market: { id: number; slug: string; title: string; optionA: string; optionB: string },
  before: FlipStats,
  after: FlipStats,
  actorFingerprint: string
): Promise<void> {
  const total = after.countA + after.countB;
  if (total < FLIP_MIN_VOTES) return;

  const leaderBefore = leaderOf(before);
  const leaderAfter = leaderOf(after);
  if (!leaderBefore || !leaderAfter || leaderBefore === leaderAfter) return;

  const db = await getDb();
  if (!db) return;

  const winningOption = leaderAfter === "A" ? market.optionA : market.optionB;
  const pct = Math.round(((leaderAfter === "A" ? after.countA : after.countB) / total) * 100);

  const voterRows = await db
    .select({ fingerprint: votes.fingerprint })
    .from(votes)
    .where(eq(votes.marketId, market.id));
  const recipients = new Set<string>(voterRows.map((r: any) => r.fingerprint));
  for (const watcher of await getWatchers(market.id)) recipients.add(watcher);
  recipients.delete(actorFingerprint);

  const day = spDate();
  for (const fp of Array.from(recipients)) {
    await notify({
      fingerprint: fp,
      type: "majority_flip",
      title: "Virou! 🔄 A maioria mudou de lado",
      body: `"${market.title}" — agora ${pct}% acham "${winningOption}".`,
      linkUrl: `/mercado/${market.slug}`,
      refType: "market",
      refId: market.id,
      idempotencyKey: `notif:flip:${market.id}:${leaderAfter}:${day}:${fp}`,
    });
  }
}
