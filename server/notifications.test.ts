import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { castVote, getDb } from "./db";
import {
  detectAndNotifyMajorityFlip,
  isWatching,
  listNotifications,
  markAllRead,
  notify,
  toggleWatch,
  unreadCount,
} from "./notifications";
import { resolveMarket } from "./resolution";

const hasDatabase = !!process.env.DATABASE_URL;
const FP_A = "vitest_ntf_fp_actor1";
const FP_B = "vitest_ntf_fp_voter2";
const FP_C = "vitest_ntf_fp_voter3";
const FP_W = "vitest_ntf_fp_watch4";
const SLUG = "vitest-ntf-enquete";

let marketId: number;

async function cleanup(db: any) {
  await db.execute(sql`DELETE FROM notifications WHERE fingerprint LIKE ${"vitest_ntf_%"}`);
  await db.execute(sql`DELETE FROM watchlist WHERE fingerprint LIKE ${"vitest_ntf_%"}`);
  await db.execute(sql`DELETE FROM votes WHERE fingerprint LIKE ${"vitest_ntf_%"}`);
  await db.execute(sql`DELETE FROM q_transactions WHERE fingerprint LIKE ${"vitest_ntf_%"}`);
  await db.execute(sql`DELETE FROM user_scores WHERE fingerprint LIKE ${"vitest_ntf_%"}`);
  await db.execute(sql`DELETE FROM markets WHERE slug = ${SLUG}`);
}

describe.skipIf(!hasDatabase)("Notificações e watchlist (integração)", () => {
  beforeAll(async () => {
    const db = await getDb();
    await cleanup(db);
    await db.execute(
      sql`INSERT INTO markets (slug, title, optionA, optionB, labelA, labelB, category, isActive)
          VALUES (${SLUG}, 'O vitest vai notificar?', 'Sim', 'Não', 'Sim', 'Não', 'vitest-ntf', 1)`
    );
    const rows = await db.execute(sql`SELECT id FROM markets WHERE slug = ${SLUG}`);
    const r: any[] = Array.isArray(rows[0]) ? rows[0] : (rows as any).rows ?? [];
    marketId = Number(r[0].id);
  });

  afterAll(async () => {
    const db = await getDb();
    await cleanup(db);
  });

  it("notify é idempotente por chave", async () => {
    const first = await notify({
      fingerprint: FP_A,
      type: "badge_earned",
      title: "Teste",
      idempotencyKey: `vitest:ntf:dup:${FP_A}`,
    });
    const second = await notify({
      fingerprint: FP_A,
      type: "badge_earned",
      title: "Teste",
      idempotencyKey: `vitest:ntf:dup:${FP_A}`,
    });
    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(await unreadCount(FP_A)).toBe(1);
  });

  it("markAllRead zera a contagem", async () => {
    await markAllRead(FP_A);
    expect(await unreadCount(FP_A)).toBe(0);
    const list = await listNotifications(FP_A);
    expect(list.items[0].isRead).toBeTruthy();
  });

  it("watchlist alterna seguir/desseguir", async () => {
    const on = await toggleWatch(FP_W, marketId);
    expect(on.watching).toBe(true);
    expect(await isWatching(FP_W, marketId)).toBe(true);
    const off = await toggleWatch(FP_W, marketId);
    expect(off.watching).toBe(false);
    expect(await isWatching(FP_W, marketId)).toBe(false);
    await toggleWatch(FP_W, marketId); // liga de novo para o teste da virada
  });

  it("virada de maioria notifica votantes e seguidores, exceto o autor; com debounce diário", async () => {
    await castVote({ marketId, choice: "A", fingerprint: FP_A });
    await castVote({ marketId, choice: "B", fingerprint: FP_B });
    await castVote({ marketId, choice: "B", fingerprint: FP_C });

    const market = { id: marketId, slug: SLUG, title: "O vitest vai notificar?", optionA: "Sim", optionB: "Não" };

    // abaixo do mínimo de votos → não notifica
    await detectAndNotifyMajorityFlip(market, { countA: 5, countB: 4 }, { countA: 5, countB: 6 }, FP_A);
    expect(await unreadCount(FP_B)).toBe(0);

    // virada real (>= 20 votos no total)
    await detectAndNotifyMajorityFlip(market, { countA: 11, countB: 10 }, { countA: 11, countB: 12 }, FP_A);
    expect(await unreadCount(FP_B)).toBe(1);
    expect(await unreadCount(FP_C)).toBe(1);
    expect(await unreadCount(FP_W)).toBe(1); // seguidor sem voto
    expect(await unreadCount(FP_A)).toBe(0); // autor da virada não é avisado

    // mesma direção no mesmo dia → debounce
    await detectAndNotifyMajorityFlip(market, { countA: 12, countB: 11 }, { countA: 12, countB: 13 }, FP_A);
    expect(await unreadCount(FP_B)).toBe(1);

    const list = await listNotifications(FP_B);
    expect(list.items[0].type).toBe("majority_flip");
    expect(list.items[0].body).toContain("Não");
  });

  it("resolução notifica cada votante com o próprio resultado", async () => {
    await resolveMarket(marketId, "A");
    const listA = await listNotifications(FP_A);
    const resolvedA = listA.items.find((n: any) => n.type === "market_resolved");
    expect(resolvedA?.title).toContain("acertou");

    const listB = await listNotifications(FP_B);
    const resolvedB = listB.items.find((n: any) => n.type === "market_resolved");
    expect(resolvedB?.title).toContain("encerrada");

    // re-resolução não duplica notificações
    await resolveMarket(marketId, "A");
    const again = await listNotifications(FP_B);
    expect(again.items.filter((n: any) => n.type === "market_resolved").length).toBe(1);
  });
});
