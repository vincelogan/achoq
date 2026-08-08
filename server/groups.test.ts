import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { grantQs } from "./economy";
import { createGroup, getGroupWithRanking, joinGroup, leaveGroup, listMyGroups } from "./groups";

const hasDatabase = !!process.env.DATABASE_URL;
const FP_OWNER = "vitest_grp_fp_owner1";
const FP_FRIEND = "vitest_grp_fp_friend";
const FP_NONICK = "vitest_grp_fp_nonick";

async function cleanup(db: any) {
  await db.execute(sql`DELETE FROM group_members WHERE fingerprint LIKE ${"vitest_grp_%"}`);
  await db.execute(sql`DELETE FROM groups WHERE ownerFingerprint LIKE ${"vitest_grp_%"}`);
  await db.execute(sql`DELETE FROM q_transactions WHERE fingerprint LIKE ${"vitest_grp_%"}`);
  await db.execute(sql`DELETE FROM user_scores WHERE fingerprint LIKE ${"vitest_grp_%"}`);
}

describe.skipIf(!hasDatabase)("Bolões (integração)", () => {
  let code: string;
  let groupId: number;

  beforeAll(async () => {
    const db = await getDb();
    await cleanup(db);
    await db.execute(
      sql`INSERT INTO user_scores (fingerprint, nickname) VALUES (${FP_OWNER}, 'DonoDoBolao'), (${FP_FRIEND}, 'AmigoDoBolao')
          ON DUPLICATE KEY UPDATE nickname = VALUES(nickname)`
    );
  });

  afterAll(async () => {
    const db = await getDb();
    await cleanup(db);
  });

  it("exige apelido para criar", async () => {
    await expect(createGroup(FP_NONICK, "Bolão Sem Nome")).rejects.toThrow("apelido");
  });

  it("cria bolão com código único e o dono já como membro", async () => {
    const result = await createGroup(FP_OWNER, "Bolão do Teste");
    expect(result.success).toBe(true);
    expect(result.code).toMatch(/^[A-Z2-9]{6}$/);
    code = result.code;
    groupId = result.id;

    const mine = await listMyGroups(FP_OWNER);
    expect(mine.length).toBe(1);
    expect(mine[0].isOwner).toBe(true);
    expect(mine[0].members).toBe(1);
  });

  it("amigo entra pelo código (case-insensitive) e não pode entrar duas vezes", async () => {
    const result = await joinGroup(FP_FRIEND, code.toLowerCase());
    expect(result.success).toBe(true);
    await expect(joinGroup(FP_FRIEND, code)).rejects.toThrow("já está");
  });

  it("código inexistente é rejeitado", async () => {
    await expect(joinGroup(FP_FRIEND, "ZZZZZZ")).rejects.toThrow("não encontrado");
  });

  it("ranking do bolão ordena por Qs da semana e marca dono/eu", async () => {
    await grantQs({ fingerprint: FP_FRIEND, amount: 70, type: "admin_adjust", idempotencyKey: `grp:fund:${FP_FRIEND}` });
    await grantQs({ fingerprint: FP_OWNER, amount: 30, type: "admin_adjust", idempotencyKey: `grp:fund:${FP_OWNER}` });

    const group = await getGroupWithRanking(code, FP_OWNER);
    expect(group).not.toBeNull();
    expect(group!.viewerIsMember).toBe(true);
    expect(group!.members.length).toBe(2);
    expect(group!.members[0].displayName).toBe("AmigoDoBolao");
    expect(group!.members[0].weeklyQs).toBe(70);
    const me = group!.members.find((m: any) => m.isMe);
    expect(me?.displayName).toBe("DonoDoBolao");
    const owner = group!.members.find((m: any) => m.isOwner);
    expect(owner?.displayName).toBe("DonoDoBolao");
  });

  it("sair do bolão remove do ranking", async () => {
    await leaveGroup(FP_FRIEND, groupId);
    const group = await getGroupWithRanking(code);
    expect(group!.members.length).toBe(1);
    const mine = await listMyGroups(FP_FRIEND);
    expect(mine.length).toBe(0);
  });
});
