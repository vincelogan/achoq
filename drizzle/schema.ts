import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de mercados de previsão (perguntas)
 * Cada mercado é uma pergunta com opções de resposta
 */
export const markets = mysqlTable("markets", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  category: varchar("category", { length: 64 }).notNull().default("politica"),
  optionA: varchar("optionA", { length: 128 }).notNull(),
  optionB: varchar("optionB", { length: 128 }).notNull(),
  labelA: varchar("labelA", { length: 64 }).notNull(),
  labelB: varchar("labelB", { length: 64 }).notNull(),
  // Imagens ilustrativas
  imageUrl: text("imageUrl"), // Imagem principal da enquete
  imageA: text("imageA"),     // Imagem da opção A
  imageB: text("imageB"),     // Imagem da opção B
  // Resultado final: quando a enquete é resolvida, armazena a resposta correta
  resolvedChoice: mysqlEnum("resolvedChoice", ["A", "B"]),
  isActive: boolean("isActive").default(true).notNull(),
  endsAt: timestamp("endsAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => [
  index("idx_markets_category").on(t.category, t.isActive),
]);

export type Market = typeof markets.$inferSelect;
export type InsertMarket = typeof markets.$inferInsert;

/**
 * Tabela de votos
 * Cada voto é anônimo por padrão (fingerprint do browser)
 * Se o usuário estiver logado, o userId é salvo também
 */
export const votes = mysqlTable("votes", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId").notNull(),
  choice: mysqlEnum("choice", ["A", "B"]).notNull(),
  // Identificador anônimo do browser (fingerprint)
  fingerprint: varchar("fingerprint", { length: 128 }).notNull(),
  // Opcional: userId se o usuário estiver logado
  userId: int("userId"),
  // Dados geográficos opcionais (para o mapa demográfico)
  country: varchar("country", { length: 64 }),
  region: varchar("region", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  // Um voto por fingerprint por enquete — dedup garantida no banco
  uniqueIndex("uniq_vote_market_fp").on(t.marketId, t.fingerprint),
  index("idx_votes_fingerprint").on(t.fingerprint),
]);

export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

/**
 * Tabela de notícias de contexto por enquete
 * Cada enquete pode ter múltiplas notícias associadas
 */
export const marketNews = mysqlTable("market_news", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId").notNull(),
  tickerText: varchar("tickerText", { length: 200 }).notNull(), // Texto curto para scrolling na home
  contextText: text("contextText").notNull(), // Texto mais completo para quadro de contexto
  sourceName: varchar("sourceName", { length: 128 }).notNull(), // Nome do veículo
  sourceUrl: text("sourceUrl"), // URL da notícia
  newsDate: timestamp("newsDate"), // Data da notícia
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketNews = typeof marketNews.$inferSelect;
export type InsertMarketNews = typeof marketNews.$inferInsert;

/**
 * Tabela de pontuação de usuários (por fingerprint)
 * Atualizada automaticamente quando uma enquete é resolvida
 */
export const userScores = mysqlTable("user_scores", {
  id: int("id").autoincrement().primaryKey(),
  // Identificador anônimo do browser
  fingerprint: varchar("fingerprint", { length: 128 }).notNull().unique(),
  // Apelido opcional (definido pelo usuário)
  nickname: varchar("nickname", { length: 64 }),
  // Contadores
  totalVotes: int("totalVotes").default(0).notNull(),
  correctVotes: int("correctVotes").default(0).notNull(),
  // Pontos: +10 por acerto, +2 por participação
  points: int("points").default(0).notNull(),
  // Sequência de acertos consecutivos
  streak: int("streak").default(0).notNull(),
  maxStreak: int("maxStreak").default(0).notNull(),
  // ─── Economia de Qs ───
  // Saldo cacheado da moeda Q (fonte da verdade é o ledger q_transactions;
  // atualizado na mesma transação de cada lançamento — NUNCA pelo recompute
  // de acurácia)
  qBalance: int("qBalance").default(0).notNull(),
  // Streak diário de check-in ("opinei hoje"), em dias corridos
  dailyStreak: int("dailyStreak").default(0).notNull(),
  // Data (YYYY-MM-DD, America/Sao_Paulo) do último check-in diário
  lastCheckinDate: varchar("lastCheckinDate", { length: 10 }),
  // Proteções de streak compradas na loja (consumidas ao pular 1 dia)
  streakShields: int("streakShields").default(0).notNull(),
  // Timestamps
  lastVoteAt: timestamp("lastVoteAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserScore = typeof userScores.$inferSelect;
export type InsertUserScore = typeof userScores.$inferInsert;

/**
 * Ledger append-only da moeda fictícia Q.
 * Todo ganho/gasto é um lançamento; idempotencyKey única garante que eventos
 * re-executados (ex.: re-resolução de enquete) não dupliquem concessões.
 */
export const qTransactions = mysqlTable("q_transactions", {
  id: int("id").autoincrement().primaryKey(),
  fingerprint: varchar("fingerprint", { length: 128 }).notNull(),
  // Positivo = ganho; negativo = gasto
  amount: int("amount").notNull(),
  // 'vote' | 'early_bird' | 'daily_checkin' | 'correct' | 'streak_bonus'
  // | 'badge_reward' | 'migration' | 'shop_purchase' | 'boost_purchase'
  // | 'reversal' | 'admin_adjust'
  type: varchar("type", { length: 32 }).notNull(),
  refType: varchar("refType", { length: 16 }),
  refId: int("refId"),
  idempotencyKey: varchar("idempotencyKey", { length: 160 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_qtx_fingerprint").on(t.fingerprint, t.createdAt),
]);

export type QTransaction = typeof qTransactions.$inferSelect;
export type InsertQTransaction = typeof qTransactions.$inferInsert;

/** Catálogo da loja fictícia (molduras, títulos, proteção de streak, boost). */
export const shopItems = mysqlTable("shop_items", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  kind: mysqlEnum("kind", ["frame", "title", "streak_shield", "boost"]).notNull(),
  price: int("price").notNull(),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShopItem = typeof shopItems.$inferSelect;

/** Inventário: itens adquiridos por fingerprint; 1 equipado por kind. */
export const userItems = mysqlTable("user_items", {
  id: int("id").autoincrement().primaryKey(),
  fingerprint: varchar("fingerprint", { length: 128 }).notNull(),
  itemId: int("itemId").notNull(),
  isEquipped: boolean("isEquipped").default(false).notNull(),
  acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("uniq_user_item").on(t.fingerprint, t.itemId),
  index("idx_user_items_fp").on(t.fingerprint),
]);

export type UserItem = typeof userItems.$inferSelect;

/** Impulsos de enquete comprados com Qs (destaque na home por 24h). */
export const marketBoosts = mysqlTable("market_boosts", {
  id: int("id").autoincrement().primaryKey(),
  marketId: int("marketId").notNull(),
  fingerprint: varchar("fingerprint", { length: 128 }).notNull(),
  startsAt: timestamp("startsAt").defaultNow().notNull(),
  endsAt: timestamp("endsAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_boosts_endsAt").on(t.endsAt),
]);

export type MarketBoost = typeof marketBoosts.$inferSelect;
