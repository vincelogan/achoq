import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { addComment, listComments, listReportedComments, moderateComment, reportComment } from "./comments";

const hasDatabase = !!process.env.DATABASE_URL;

const FP_AUTHOR = "vitest_cmt_fp_author";
const FP_NONICK = "vitest_cmt_fp_nonick";
const REPORTERS = ["vitest_cmt_fp_rep001", "vitest_cmt_fp_rep002", "vitest_cmt_fp_rep003"];
const SLUG = "vitest-cmt-enquete";

let marketId: number;

async function cleanup(db: any) {
  await db.execute(sql`DELETE FROM comment_reports WHERE fingerprint LIKE ${"vitest_cmt_%"}`);
  await db.execute(sql`DELETE FROM comments WHERE fingerprint LIKE ${"vitest_cmt_%"}`);
  await db.execute(sql`DELETE FROM user_badges WHERE fingerprint LIKE ${"vitest_cmt_%"}`);
  await db.execute(sql`DELETE FROM q_transactions WHERE fingerprint LIKE ${"vitest_cmt_%"}`);
  await db.execute(sql`DELETE FROM user_scores WHERE fingerprint LIKE ${"vitest_cmt_%"}`);
  await db.execute(sql`DELETE FROM markets WHERE slug = ${SLUG}`);
}

describe.skipIf(!hasDatabase)("Comentários (integração)", () => {
  beforeAll(async () => {
    const db = await getDb();
    await cleanup(db);
    await db.execute(
      sql`INSERT INTO markets (slug, title, optionA, optionB, labelA, labelB, category, isActive)
          VALUES (${SLUG}, 'Enquete de comentários', 'Sim', 'Não', 'Sim', 'Não', 'vitest-cmt', 1)`
    );
    const rows = await db.execute(sql`SELECT id FROM markets WHERE slug = ${SLUG}`);
    const r: any[] = Array.isArray(rows[0]) ? rows[0] : (rows as any).rows ?? [];
    marketId = Number(r[0].id);
    await db.execute(
      sql`INSERT INTO user_scores (fingerprint, nickname) VALUES (${FP_AUTHOR}, 'TestadorDeComentario')
          ON DUPLICATE KEY UPDATE nickname = 'TestadorDeComentario'`
    );
  });

  afterAll(async () => {
    const db = await getDb();
    await cleanup(db);
  });

  it("exige apelido para comentar", async () => {
    await expect(addComment(marketId, FP_NONICK, "tentativa sem apelido")).rejects.toThrow("apelido");
  });

  it("valida tamanho do conteúdo (2–500)", async () => {
    await expect(addComment(marketId, FP_AUTHOR, "a")).rejects.toThrow("curto");
    await expect(addComment(marketId, FP_AUTHOR, "x".repeat(501))).rejects.toThrow("longo");
  });

  it("publica comentário e lista com o apelido", async () => {
    await addComment(marketId, FP_AUTHOR, "Acho que sim, o cenário aponta para isso.");
    const result = await listComments(marketId);
    expect(result.items.length).toBe(1);
    expect(result.items[0].displayName).toBe("TestadorDeComentario");
  });

  it("report duplicado do mesmo fingerprint é bloqueado", async () => {
    const list = await listComments(marketId);
    const commentId = list.items[0].id;
    await reportComment(commentId, REPORTERS[0]);
    await expect(reportComment(commentId, REPORTERS[0])).rejects.toThrow("já denunciou");
  });

  it("3º report oculta automaticamente o comentário", async () => {
    const list = await listComments(marketId);
    const commentId = list.items[0].id;
    await reportComment(commentId, REPORTERS[1]);
    const third = await reportComment(commentId, REPORTERS[2]);
    expect(third.hidden).toBe(true);

    const after = await listComments(marketId);
    expect(after.items.length).toBe(0); // oculto não aparece

    const reported = await listReportedComments();
    const mine = reported.find((c: any) => c.id === commentId);
    expect(mine?.status).toBe("hidden");
    expect(mine?.reportCount).toBe(3);
  });

  it("moderação restaura (zera denúncias) e exclui", async () => {
    const reported = await listReportedComments();
    const target = reported.find((c: any) => c.marketId === marketId);
    expect(target).toBeDefined();

    await moderateComment(target!.id, "restore");
    const visible = await listComments(marketId);
    expect(visible.items.length).toBe(1);

    await moderateComment(target!.id, "delete");
    const gone = await listComments(marketId);
    expect(gone.items.length).toBe(0);
    // excluídos não voltam para a fila de moderação
    const queue = await listReportedComments();
    expect(queue.find((c: any) => c.id === target!.id)).toBeUndefined();
  });
});
