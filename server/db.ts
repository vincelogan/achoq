import { eq, sql, and, desc, ne, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, markets, votes, marketNews, userScores, InsertMarket, InsertVote, InsertMarketNews } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: any | null = null;

/**
 * Parse DATABASE_URL manually to handle SSL robustly.
 * The JSON in the query string (ssl={"rejectUnauthorized":true}) can break
 * in some environments (e.g., AWS Amplify env vars panel).
 */
function createDbConnection(dbUrl: string) {
  try {
    const url = new URL(dbUrl);
    const config: mysql.ConnectionOptions = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
    };

    // Always enable SSL for TiDB Cloud / production databases
    if (url.hostname.includes('tidbcloud.com') || url.searchParams.has('ssl') || process.env.NODE_ENV === 'production') {
      config.ssl = { rejectUnauthorized: true };
    }

    const pool = mysql.createPool(config);
    return drizzle(pool);
  } catch (error) {
    console.error("[Database] Failed to parse DATABASE_URL:", error);
    // Fallback: try passing the URL directly to drizzle
    return drizzle(dbUrl);
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = createDbConnection(process.env.DATABASE_URL);
      console.log("[Database] Connected successfully.");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Markets ─────────────────────────────────────────────────────────────────

export async function getAllMarkets(filters?: { category?: string; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(markets.isActive, true)];
  if (filters?.category) {
    conditions.push(eq(markets.category, filters.category));
  }
  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(sql`(${markets.title} LIKE ${term} OR ${markets.description} LIKE ${term})`);
  }
  return db.select().from(markets).where(and(...conditions));
}

/**
 * Retorna, em uma única query, os IDs de enquetes em que o fingerprint já
 * votou (evita N chamadas de checkVote na home).
 */
export async function getVotedMarketIds(fingerprint: string, marketIds: number[]): Promise<number[]> {
  const db = await getDb();
  if (!db || marketIds.length === 0) return [];
  const rows = await db
    .select({ marketId: votes.marketId })
    .from(votes)
    .where(and(eq(votes.fingerprint, fingerprint), inArray(votes.marketId, marketIds)));
  return rows.map((r: any) => r.marketId);
}

export async function getMarketBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(markets).where(eq(markets.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getMarketById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(markets).where(eq(markets.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function seedMarketsIfEmpty() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(markets).limit(1);
  if (existing.length > 0) return;

  const initialMarkets: InsertMarket[] = [
    {
      slug: "eleicoes-2026",
      title: "Quem você acha que vence as eleições presidenciais de 2026?",
      description: "Mercado de opinião sobre as eleições presidenciais brasileiras de 2026.",
      category: "politica",
      optionA: "Esquerda",
      optionB: "Direita",
      labelA: "Campo Progressista",
      labelB: "Campo Conservador",
      isActive: true,
    },
    {
      slug: "copa-2026",
      title: "Você acha que o Brasil vai ganhar a Copa do Mundo 2026?",
      description: "Mercado de opinião sobre o desempenho do Brasil na Copa do Mundo de 2026.",
      category: "esportes",
      optionA: "Sim",
      optionB: "Não",
      labelA: "Acho que sim",
      labelB: "Acho que não",
      isActive: true,
    },
    {
      slug: "neymar-copa",
      title: "Você acha que Neymar vai ser convocado para a Copa?",
      description: "Mercado de opinião sobre a convocação de Neymar para a Copa do Mundo de 2026.",
      category: "esportes",
      optionA: "Sim",
      optionB: "Não",
      labelA: "Acho que sim",
      labelB: "Acho que não",
      isActive: true,
    },
  ];

  await db.insert(markets).values(initialMarkets);
  console.log("[Database] Seeded initial markets.");
}

// ─── Votes ────────────────────────────────────────────────────────────────────

export async function getVoteStats(marketId: number) {
  const db = await getDb();
  if (!db) return { countA: 0, countB: 0, total: 0 };

  const result = await db
    .select({
      choice: votes.choice,
      count: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .where(eq(votes.marketId, marketId))
    .groupBy(votes.choice);

  let countA = 0;
  let countB = 0;
  for (const row of result) {
    if (row.choice === "A") countA = Number(row.count);
    if (row.choice === "B") countB = Number(row.count);
  }
  return { countA, countB, total: countA + countB };
}

export async function hasVoted(marketId: number, fingerprint: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select({ id: votes.id })
    .from(votes)
    .where(and(eq(votes.marketId, marketId), eq(votes.fingerprint, fingerprint)))
    .limit(1);
  return result.length > 0;
}

export class DuplicateVoteError extends Error {
  constructor() {
    super("Você já opinou nesta enquete.");
    this.name = "DuplicateVoteError";
  }
}

export async function castVote(data: InsertVote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(votes).values(data);
  } catch (e: any) {
    // Índice único (marketId, fingerprint) garante 1 voto por pessoa por enquete
    if (e?.code === "ER_DUP_ENTRY" || e?.errno === 1062 || e?.cause?.code === "ER_DUP_ENTRY") {
      throw new DuplicateVoteError();
    }
    throw e;
  }
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export async function getAllMarketsAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(markets);
}

export async function createMarket(data: InsertMarket) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(markets).values(data);
  return { success: true };
}

export async function updateMarket(id: number, data: Partial<InsertMarket>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(markets).set(data).where(eq(markets.id, id));
  return { success: true };
}

export async function deleteMarket(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Soft delete: desativar em vez de remover
  await db.update(markets).set({ isActive: false }).where(eq(markets.id, id));
  return { success: true };
}

export async function getMarketVoteCount(marketId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(votes)
    .where(eq(votes.marketId, marketId));
  return Number(result[0]?.count ?? 0);
}

export async function getVoteHistory(marketId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.execute(
      sql`SELECT DATE(${votes.createdAt}) as date, ${votes.choice} as choice, COUNT(*) as count FROM ${votes} WHERE ${votes.marketId} = ${marketId} GROUP BY DATE(${votes.createdAt}), ${votes.choice} ORDER BY DATE(${votes.createdAt})`
    );
    // db.execute retorna [rows, fields] - extrair apenas as rows
    const rows = Array.isArray(result) ? result[0] : (result as any).rows ?? result;
    // Normalizar os dados para formato consistente
    return (Array.isArray(rows) ? rows : []).map((row: any) => ({
      date: String(row.date),
      choice: String(row.choice),
      count: Number(row.count),
    }));
  } catch (e) {
    console.error('[getVoteHistory] Query error:', e);
    return [];
  }
}

export async function getRelatedMarkets(marketId: number, category: string) {
  const db = await getDb();
  if (!db) return [];
  // Prioriza enquetes da mesma categoria; completa com outras se faltar
  const sameCategory = await db
    .select()
    .from(markets)
    .where(and(eq(markets.isActive, true), eq(markets.category, category), ne(markets.id, marketId)))
    .limit(4);
  if (sameCategory.length >= 4) return sameCategory;

  const others = await db
    .select()
    .from(markets)
    .where(and(eq(markets.isActive, true), ne(markets.id, marketId), ne(markets.category, category)))
    .limit(4 - sameCategory.length);
  return [...sameCategory, ...others];
}

export async function getDemographics(marketId: number) {
  const db = await getDb();
  if (!db) return { regions: [], countries: [] };

  const regionStats = await db
    .select({
      region: votes.region,
      choice: votes.choice,
      count: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .where(eq(votes.marketId, marketId))
    .groupBy(votes.region, votes.choice);

  const countryStats = await db
    .select({
      country: votes.country,
      choice: votes.choice,
      count: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .where(eq(votes.marketId, marketId))
    .groupBy(votes.country, votes.choice);

  return { regions: regionStats, countries: countryStats };
}

// ─── Market News ────────────────────────────────────────────────────────────────────────────

export async function getNewsByMarketId(marketId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketNews).where(and(eq(marketNews.marketId, marketId), eq(marketNews.isActive, true))).orderBy(desc(marketNews.newsDate));
}

export async function getAllActiveNews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketNews).where(eq(marketNews.isActive, true)).orderBy(desc(marketNews.newsDate));
}

export async function createMarketNews(data: InsertMarketNews) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(marketNews).values(data);
  return { success: true };
}

// ─── User Score ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula o score de acerto de um usuário baseado no fingerprint.
 * Considera apenas enquetes que já foram resolvidas (resolvedChoice != null).
 * Retorna: total de votos em enquetes resolvidas, acertos, e percentual.
 */
export async function getUserScore(fingerprint: string) {
  const db = await getDb();
  if (!db) return { totalResolved: 0, correct: 0, score: 0 };

  try {
    const result = await db.execute(
      sql`SELECT v.choice as userChoice, m.resolvedChoice
          FROM ${votes} v
          INNER JOIN ${markets} m ON v.marketId = m.id
          WHERE v.fingerprint = ${fingerprint}
          AND m.resolvedChoice IS NOT NULL`
    );
    const rows = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];
    const totalResolved = rows.length;
    const correct = rows.filter((r: any) => r.userChoice === r.resolvedChoice).length;
    const score = totalResolved > 0 ? Math.round((correct / totalResolved) * 100) : 0;
    return { totalResolved, correct, score };
  } catch (e) {
    console.error('[getUserScore] Error:', e);
    return { totalResolved: 0, correct: 0, score: 0 };
  }
}

/**
 * Retorna o score de um fingerprint por enquete (para exibir no perfil).
 */
export async function getUserVotesWithResults(fingerprint: string) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(
      sql`SELECT v.marketId, v.choice as userChoice, m.title, m.slug, m.resolvedChoice, m.optionA, m.optionB
          FROM ${votes} v
          INNER JOIN ${markets} m ON v.marketId = m.id
          WHERE v.fingerprint = ${fingerprint}
          ORDER BY v.createdAt DESC`
    );
    const rows = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];
    return (Array.isArray(rows) ? rows : []).map((r: any) => ({
      marketId: r.marketId,
      title: r.title,
      slug: r.slug,
      userChoice: r.userChoice,
      resolvedChoice: r.resolvedChoice,
      optionA: r.optionA,
      optionB: r.optionB,
      isResolved: r.resolvedChoice !== null,
      isCorrect: r.resolvedChoice !== null && r.userChoice === r.resolvedChoice,
    }));
  } catch (e) {
    console.error('[getUserVotesWithResults] Error:', e);
    return [];
  }
}

// ─── Ranking / User Scores ────────────────────────────────────────────────────

/**
 * Recalcula e salva a pontuação de um fingerprint na tabela user_scores.
 * Chamado após resolução de enquete ou após um novo voto.
 * Pontuação: +10 por acerto, +2 por participação em enquete resolvida.
 */
export async function recalcUserScore(fingerprint: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const result = await db.execute(
      sql`SELECT v.choice as userChoice, m.resolvedChoice, v.createdAt
          FROM ${votes} v
          INNER JOIN ${markets} m ON v.marketId = m.id
          WHERE v.fingerprint = ${fingerprint}
          ORDER BY v.createdAt ASC`
    );
    const rows: any[] = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];

    let totalVotes = rows.length;
    let correctVotes = 0;
    let points = 0;
    let streak = 0;
    let maxStreak = 0;

    for (const r of rows) {
      if (r.resolvedChoice !== null) {
        const isCorrect = r.userChoice === r.resolvedChoice;
        points += 2; // participação
        if (isCorrect) {
          correctVotes++;
          points += 10; // acerto
          streak++;
          if (streak > maxStreak) maxStreak = streak;
        } else {
          streak = 0;
        }
      }
    }

    // Upsert na tabela user_scores
    const existing = await db.select().from(userScores).where(eq(userScores.fingerprint, fingerprint)).limit(1);
    if (existing.length > 0) {
      await db.update(userScores)
        .set({ totalVotes, correctVotes, points, streak, maxStreak, lastVoteAt: new Date() })
        .where(eq(userScores.fingerprint, fingerprint));
    } else {
      await db.insert(userScores).values({
        fingerprint,
        totalVotes,
        correctVotes,
        points,
        streak,
        maxStreak,
        lastVoteAt: new Date(),
      });
    }
  } catch (e) {
    console.error('[recalcUserScore] Error:', e);
  }
}

/**
 * Retorna o top N usuários por pontos para o ranking público.
 * Exibe apenas nickname (ou fingerprint truncado) e estatísticas.
 */
export async function getTopRanking(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db
      .select({
        id: userScores.id,
        nickname: userScores.nickname,
        fingerprint: userScores.fingerprint,
        totalVotes: userScores.totalVotes,
        correctVotes: userScores.correctVotes,
        points: userScores.points,
        streak: userScores.streak,
        maxStreak: userScores.maxStreak,
      })
      .from(userScores)
      .where(sql`${userScores.totalVotes} > 0`)
      .orderBy(desc(userScores.points))
      .limit(limit);

    // Itens equipados (moldura/título comprados na loja) dos rankeados
    const fingerprints = rows.map((r: any) => r.fingerprint);
    const equippedByFp = new Map<string, { frame?: string; title?: string }>();
    if (fingerprints.length > 0) {
      try {
        const equipped = await db.execute(
          sql`SELECT ui.fingerprint, si.kind, si.code, si.name
              FROM user_items ui
              INNER JOIN shop_items si ON ui.itemId = si.id
              WHERE ui.isEquipped = 1 AND ui.fingerprint IN (${sql.join(fingerprints.map((f: string) => sql`${f}`), sql`, `)})`
        );
        const equippedRows: any[] = Array.isArray(equipped[0]) ? equipped[0] : (equipped as any).rows ?? [];
        for (const item of equippedRows) {
          const entry = equippedByFp.get(item.fingerprint) ?? {};
          if (item.kind === "frame") entry.frame = item.code;
          if (item.kind === "title") entry.title = String(item.name).replace(/^Título: /, "");
          equippedByFp.set(item.fingerprint, entry);
        }
      } catch (e) {
        console.error('[getTopRanking] equipped items:', e);
      }
    }

    return rows.map((r: any, index: number) => ({
      rank: index + 1,
      // Exibir nickname ou fingerprint truncado anonimizado
      displayName: r.nickname || `Usuário #${r.id}`,
      totalVotes: r.totalVotes,
      correctVotes: r.correctVotes,
      accuracy: r.totalVotes > 0 ? Math.round((r.correctVotes / r.totalVotes) * 100) : 0,
      points: r.points,
      streak: r.streak,
      maxStreak: r.maxStreak,
      equippedFrame: equippedByFp.get(r.fingerprint)?.frame ?? null,
      equippedTitle: equippedByFp.get(r.fingerprint)?.title ?? null,
    }));
  } catch (e) {
    console.error('[getTopRanking] Error:', e);
    return [];
  }
}

/**
 * Retorna a posição e pontuação de um fingerprint no ranking global.
 */
export async function getMyRankingPosition(fingerprint: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const myScore = await db.select().from(userScores).where(eq(userScores.fingerprint, fingerprint)).limit(1);
    if (myScore.length === 0) return null;

    const s = myScore[0];
    const above = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(userScores)
      .where(sql`${userScores.points} > ${s.points}`);

    const position = Number(above[0]?.count ?? 0) + 1;
    return {
      position,
      points: s.points,
      totalVotes: s.totalVotes,
      correctVotes: s.correctVotes,
      accuracy: s.totalVotes > 0 ? Math.round((s.correctVotes / s.totalVotes) * 100) : 0,
      streak: s.streak,
      maxStreak: s.maxStreak,
      nickname: s.nickname,
    };
  } catch (e) {
    console.error('[getMyRankingPosition] Error:', e);
    return null;
  }
}

/**
 * Define ou atualiza o apelido de um usuário no ranking.
 */
export async function setNickname(fingerprint: string, nickname: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(userScores).where(eq(userScores.fingerprint, fingerprint)).limit(1);
  if (existing.length > 0) {
    await db.update(userScores).set({ nickname }).where(eq(userScores.fingerprint, fingerprint));
  } else {
    await db.insert(userScores).values({ fingerprint, nickname, totalVotes: 0, correctVotes: 0, points: 0, streak: 0, maxStreak: 0 });
  }
  return { success: true };
}

/**
 * Após resolver uma enquete, recalcula pontos de TODOS os votantes dessa enquete.
 */
export async function recalcScoresForMarket(marketId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const result = await db.execute(
      sql`SELECT DISTINCT fingerprint FROM ${votes} WHERE ${votes.marketId} = ${marketId}`
    );
    const rows: any[] = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];
    for (const row of rows) {
      await recalcUserScore(row.fingerprint);
    }
  } catch (e) {
    console.error('[recalcScoresForMarket] Error:', e);
  }
}
