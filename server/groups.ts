import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { groupMembers, groups, userScores } from "../drizzle/schema";
import { isDuplicateEntry } from "./economy";
import { currentWeekStartUtc } from "./gamification";

/**
 * Bolões: grupos privados com convite por código (padrão Cartola/BolãoJá).
 * Ranking interno = Qs ganhos na semana + acurácia, apenas entre os membros.
 * Grátis (viralização) — a economia entra pelo engajamento que gera.
 */

const MAX_GROUPS_OWNED = 5;
const MAX_MEMBERS = 50;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem 0/O/1/I/L

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export async function createGroup(fingerprint: string, name: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const scoreRows = await db
    .select({ nickname: userScores.nickname })
    .from(userScores)
    .where(eq(userScores.fingerprint, fingerprint))
    .limit(1);
  if (!scoreRows[0]?.nickname) throw new Error("Defina um apelido para criar um bolão.");

  const ownedRows = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(groups)
    .where(and(eq(groups.ownerFingerprint, fingerprint), eq(groups.isActive, true)));
  if (Number(ownedRows[0]?.count ?? 0) >= MAX_GROUPS_OWNED) {
    throw new Error(`Você já criou ${MAX_GROUPS_OWNED} bolões.`);
  }

  // Código único (tenta algumas vezes em caso de colisão)
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      await db.insert(groups).values({ code, name: name.trim(), ownerFingerprint: fingerprint });
      const created = await db.select().from(groups).where(eq(groups.code, code)).limit(1);
      await db.insert(groupMembers).values({ groupId: created[0].id, fingerprint });
      return { success: true, code, id: created[0].id };
    } catch (e: any) {
      if (isDuplicateEntry(e)) continue; // colisão de código — tenta outro
      throw e;
    }
  }
  throw new Error("Não foi possível gerar o código do bolão. Tente novamente.");
}

export async function joinGroup(fingerprint: string, code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const scoreRows = await db
    .select({ nickname: userScores.nickname })
    .from(userScores)
    .where(eq(userScores.fingerprint, fingerprint))
    .limit(1);
  if (!scoreRows[0]?.nickname) throw new Error("Defina um apelido para entrar no bolão.");

  const groupRows = await db
    .select()
    .from(groups)
    .where(and(eq(groups.code, code.trim().toUpperCase()), eq(groups.isActive, true)))
    .limit(1);
  const group = groupRows[0];
  if (!group) throw new Error("Bolão não encontrado. Confira o código.");

  const memberCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, group.id));
  if (Number(memberCount[0]?.count ?? 0) >= MAX_MEMBERS) {
    throw new Error(`Este bolão já atingiu o limite de ${MAX_MEMBERS} participantes.`);
  }

  try {
    await db.insert(groupMembers).values({ groupId: group.id, fingerprint });
  } catch (e: any) {
    if (isDuplicateEntry(e)) throw new Error("Você já está neste bolão.");
    throw e;
  }
  return { success: true, code: group.code, name: group.name };
}

export async function leaveGroup(fingerprint: string, groupId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.fingerprint, fingerprint)));
  return { success: true };
}

export async function listMyGroups(fingerprint: string) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      id: groups.id,
      code: groups.code,
      name: groups.name,
      ownerFingerprint: groups.ownerFingerprint,
      joinedAt: groupMembers.joinedAt,
      members: sql<number>`(SELECT COUNT(*) FROM group_members gm2 WHERE gm2.groupId = ${groups.id})`,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(and(eq(groupMembers.fingerprint, fingerprint), eq(groups.isActive, true)))
    .orderBy(desc(groupMembers.joinedAt));
  return rows.map((r: any) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    isOwner: r.ownerFingerprint === fingerprint,
    members: Number(r.members),
  }));
}

/** Bolão + ranking interno (Qs da semana + acurácia geral, só entre membros). */
export async function getGroupWithRanking(code: string, viewerFingerprint?: string) {
  const db = await getDb();
  if (!db) return null;

  const groupRows = await db
    .select()
    .from(groups)
    .where(and(eq(groups.code, code.trim().toUpperCase()), eq(groups.isActive, true)))
    .limit(1);
  const group = groupRows[0];
  if (!group) return null;

  const weekStart = currentWeekStartUtc();
  const rows = await db
    .select({
      fingerprint: groupMembers.fingerprint,
      joinedAt: groupMembers.joinedAt,
      nickname: userScores.nickname,
      totalVotes: userScores.totalVotes,
      correctVotes: userScores.correctVotes,
      points: userScores.points,
      weeklyQs: sql<number>`COALESCE((
        SELECT SUM(qt.amount) FROM q_transactions qt
        WHERE qt.fingerprint = ${groupMembers.fingerprint}
          AND qt.amount > 0
          AND qt.createdAt >= ${weekStart}
      ), 0)`,
    })
    .from(groupMembers)
    .leftJoin(userScores, eq(groupMembers.fingerprint, userScores.fingerprint))
    .where(eq(groupMembers.groupId, group.id));

  const members = rows
    .map((r: any) => ({
      displayName: r.nickname || `Anônimo ${String(r.fingerprint).slice(-4)}`,
      weeklyQs: Number(r.weeklyQs),
      totalVotes: Number(r.totalVotes ?? 0),
      correctVotes: Number(r.correctVotes ?? 0),
      accuracy: Number(r.totalVotes) > 0 ? Math.round((Number(r.correctVotes) / Number(r.totalVotes)) * 100) : 0,
      points: Number(r.points ?? 0),
      isOwner: r.fingerprint === group.ownerFingerprint,
      isMe: viewerFingerprint ? r.fingerprint === viewerFingerprint : false,
    }))
    .sort((a: any, b: any) => b.weeklyQs - a.weeklyQs || b.points - a.points)
    .map((m: any, i: number) => ({ ...m, rank: i + 1 }));

  return {
    id: group.id,
    code: group.code,
    name: group.name,
    createdAt: group.createdAt,
    viewerIsMember: viewerFingerprint ? rows.some((r: any) => r.fingerprint === viewerFingerprint) : false,
    members,
  };
}
