import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, markets, votes, InsertMarket, InsertVote } from "../drizzle/schema";
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

export async function getAllMarkets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(markets).where(eq(markets.isActive, true));
}

export async function getMarketBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(markets).where(eq(markets.slug, slug)).limit(1);
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
    .select()
    .from(votes)
    .where(eq(votes.marketId, marketId))
    .limit(500);
  return result.some((v: any) => v.fingerprint === fingerprint);
}

export async function castVote(data: InsertVote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(votes).values(data);
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
  const result = await db
    .select({
      date: sql<string>`DATE(${votes.createdAt})`,
      choice: votes.choice,
      count: sql<number>`COUNT(*)`,
    })
    .from(votes)
    .where(eq(votes.marketId, marketId))
    .groupBy(sql`DATE(${votes.createdAt})`, votes.choice)
    .orderBy(sql`DATE(${votes.createdAt})`);
  return result;
}

export async function getRelatedMarkets(marketId: number, category: string) {
  const db = await getDb();
  if (!db) return [];
  const result = await db
    .select()
    .from(markets)
    .where(eq(markets.isActive, true))
    .limit(10);
  // Filter out current market and return up to 4
  return result.filter((m: any) => m.id !== marketId).slice(0, 4);
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
