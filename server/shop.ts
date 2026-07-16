import { and, eq, gt, sql } from "drizzle-orm";
import { getDb } from "./db";
import { marketBoosts, markets, shopItems, userItems, userScores } from "../drizzle/schema";
import { isDuplicateEntry, spendQs, spDate } from "./economy";

/**
 * Loja fictícia: molduras, títulos, proteção de streak e boost de enquete.
 * Compra debita Qs via spendQs (transacional, saldo nunca negativo).
 */

const MAX_STREAK_SHIELDS = 2;
export const BOOST_DURATION_MS = 24 * 60 * 60 * 1000;

export async function listShopItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shopItems).where(eq(shopItems.isActive, true));
}

export async function getMyItems(fingerprint: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: userItems.id,
      itemId: userItems.itemId,
      isEquipped: userItems.isEquipped,
      acquiredAt: userItems.acquiredAt,
      code: shopItems.code,
      name: shopItems.name,
      kind: shopItems.kind,
    })
    .from(userItems)
    .innerJoin(shopItems, eq(userItems.itemId, shopItems.id))
    .where(eq(userItems.fingerprint, fingerprint));
}

export async function buyItem(fingerprint: string, itemCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const itemRows = await db
    .select()
    .from(shopItems)
    .where(and(eq(shopItems.code, itemCode), eq(shopItems.isActive, true)))
    .limit(1);
  const item = itemRows[0];
  if (!item) throw new Error("Item não encontrado.");
  if (item.kind === "boost") throw new Error("Use a opção Impulsionar na própria enquete.");

  if (item.kind === "streak_shield") {
    const scoreRows = await db
      .select({ streakShields: userScores.streakShields })
      .from(userScores)
      .where(eq(userScores.fingerprint, fingerprint))
      .limit(1);
    const current = Number(scoreRows[0]?.streakShields ?? 0);
    if (current >= MAX_STREAK_SHIELDS) {
      throw new Error(`Você já tem o máximo de ${MAX_STREAK_SHIELDS} proteções.`);
    }
    // Chave monotônica por número de compras (permite recomprar após consumir)
    const countRows = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(sql`q_transactions`)
      .where(sql`fingerprint = ${fingerprint} AND type = 'shop_purchase' AND refId = ${item.id}`);
    const purchases = Number(countRows[0]?.count ?? 0);

    const result = await spendQs({
      fingerprint,
      amount: item.price,
      type: "shop_purchase",
      idempotencyKey: `shop:${item.code}:${fingerprint}:${purchases + 1}`,
      refType: "item",
      refId: item.id,
    });
    if (!result.spent) throw new Error(result.error || "Compra não processada.");

    await db.execute(
      sql`UPDATE ${userScores} SET streakShields = streakShields + 1 WHERE fingerprint = ${fingerprint}`
    );
    return { success: true, balance: result.balance };
  }

  // Molduras e títulos: compra única por item
  const owned = await db
    .select({ id: userItems.id })
    .from(userItems)
    .where(and(eq(userItems.fingerprint, fingerprint), eq(userItems.itemId, item.id)))
    .limit(1);
  if (owned.length > 0) throw new Error("Você já possui este item.");

  const result = await spendQs({
    fingerprint,
    amount: item.price,
    type: "shop_purchase",
    idempotencyKey: `shop:${item.code}:${fingerprint}`,
    refType: "item",
    refId: item.id,
  });
  if (!result.spent) throw new Error(result.error || "Compra não processada.");

  try {
    await db.insert(userItems).values({ fingerprint, itemId: item.id });
  } catch (e: any) {
    // Corrida de dupla compra: o UNIQUE já garante 1 exemplar
    if (!isDuplicateEntry(e)) throw e;
  }
  return { success: true, balance: result.balance };
}

/** Equipa um item (1 por tipo); desequipa os demais do mesmo tipo. */
export async function equipItem(fingerprint: string, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rows = await db
    .select({ id: userItems.id, kind: shopItems.kind })
    .from(userItems)
    .innerJoin(shopItems, eq(userItems.itemId, shopItems.id))
    .where(and(eq(userItems.fingerprint, fingerprint), eq(userItems.itemId, itemId)))
    .limit(1);
  const mine = rows[0];
  if (!mine) throw new Error("Você não possui este item.");

  await db.execute(
    sql`UPDATE user_items ui
        INNER JOIN shop_items si ON ui.itemId = si.id
        SET ui.isEquipped = (ui.itemId = ${itemId})
        WHERE ui.fingerprint = ${fingerprint} AND si.kind = ${mine.kind}`
  );
  return { success: true };
}

/** Desequipa um item. */
export async function unequipItem(fingerprint: string, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(userItems)
    .set({ isEquipped: false })
    .where(and(eq(userItems.fingerprint, fingerprint), eq(userItems.itemId, itemId)));
  return { success: true };
}

/** Compra um impulso de 24h para uma enquete ativa. */
export async function boostMarket(fingerprint: string, marketId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const marketRows = await db.select().from(markets).where(eq(markets.id, marketId)).limit(1);
  const market = marketRows[0];
  if (!market || !market.isActive || market.resolvedChoice !== null) {
    throw new Error("Só é possível impulsionar enquetes ativas.");
  }

  const activeBoost = await db
    .select({ id: marketBoosts.id })
    .from(marketBoosts)
    .where(and(eq(marketBoosts.marketId, marketId), gt(marketBoosts.endsAt, new Date())))
    .limit(1);
  if (activeBoost.length > 0) throw new Error("Esta enquete já está impulsionada.");

  const boostItems = await db
    .select()
    .from(shopItems)
    .where(and(eq(shopItems.kind, "boost"), eq(shopItems.isActive, true)))
    .limit(1);
  const boostItem = boostItems[0];
  if (!boostItem) throw new Error("Impulso indisponível no momento.");

  const result = await spendQs({
    fingerprint,
    amount: boostItem.price,
    type: "boost_purchase",
    // 1 boost por enquete por usuário por dia
    idempotencyKey: `boost:${marketId}:${fingerprint}:${spDate()}`,
    refType: "market",
    refId: marketId,
  });
  if (!result.spent) throw new Error(result.error || "Impulso não processado.");

  await db.insert(marketBoosts).values({
    marketId,
    fingerprint,
    endsAt: new Date(Date.now() + BOOST_DURATION_MS),
  });
  return { success: true, balance: result.balance };
}

/** IDs de enquetes com boost ativo agora. */
export async function getActiveBoostMarketIds(): Promise<Set<number>> {
  const db = await getDb();
  if (!db) return new Set();
  const rows = await db
    .selectDistinct({ marketId: marketBoosts.marketId })
    .from(marketBoosts)
    .where(gt(marketBoosts.endsAt, new Date()));
  return new Set(rows.map((r: any) => r.marketId));
}
