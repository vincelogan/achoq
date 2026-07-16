import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import {
  getAllMarkets,
  getVotedMarketIds,
  getMarketBySlug,
  getMarketById,
  getVoteStats,
  hasVoted,
  castVote,
  getDemographics,
  getVoteHistory,
  getRelatedMarkets,
  seedMarketsIfEmpty,
  getAllMarketsAdmin,
  createMarket,
  updateMarket,
  deleteMarket,
  getMarketVoteCount,
  getUserScore,
  getUserVotesWithResults,
  getNewsByMarketId,
  getAllActiveNews,
  getTopRanking,
  getMyRankingPosition,
  setNickname,
} from "./db";
import { resolveMarket } from "./resolution";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "./rateLimit";
import { getWallet, getTransactions } from "./economy";
import { processVoteRewards } from "./gamification";
import {
  listShopItems,
  getMyItems,
  buyItem,
  equipItem,
  unequipItem,
  boostMarket,
  getActiveBoostMarketIds,
} from "./shop";

// Seed mercados na inicialização
seedMarketsIfEmpty().catch(console.error);

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  markets: router({
    // Listar mercados ativos com estatísticas reais.
    // Filtros opcionais por categoria e busca textual; com fingerprint,
    // devolve viewerHasVoted por enquete (evita N chamadas de checkVote).
    list: publicProcedure
      .input(
        z.object({
          category: z.string().min(1).max(64).optional(),
          search: z.string().min(1).max(128).optional(),
          fingerprint: z.string().min(8).max(128).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const allMarkets = await getAllMarkets({ category: input?.category, search: input?.search });
        const votedIds = input?.fingerprint
          ? new Set(await getVotedMarketIds(input.fingerprint, allMarkets.map((m: any) => m.id)))
          : null;
        const boostedIds = await getActiveBoostMarketIds();
        const marketsWithStats = await Promise.all(
          allMarkets.map(async (market: any) => {
            const stats = await getVoteStats(market.id);
            const total = stats.total;
            const pctA = total > 0 ? Math.round((stats.countA / total) * 100) : 50;
            const pctB = total > 0 ? Math.round((stats.countB / total) * 100) : 50;
            return {
              ...market,
              stats: { countA: stats.countA, countB: stats.countB, total, pctA, pctB },
              viewerHasVoted: votedIds ? votedIds.has(market.id) : undefined,
              boosted: boostedIds.has(market.id),
            };
          })
        );
        // Enquetes impulsionadas primeiro (destaque comprado com Qs)
        marketsWithStats.sort((a: any, b: any) => Number(b.boosted) - Number(a.boosted));
        return marketsWithStats;
      }),

    // Buscar mercado pelo slug
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const market = await getMarketBySlug(input.slug);
        if (!market) return null;
        const stats = await getVoteStats(market.id);
        const total = stats.total;
        const pctA = total > 0 ? Math.round((stats.countA / total) * 100) : 50;
        const pctB = total > 0 ? Math.round((stats.countB / total) * 100) : 50;
        return { ...market, stats: { countA: stats.countA, countB: stats.countB, total, pctA, pctB } };
      }),

    // Verificar se fingerprint já votou
    checkVote: publicProcedure
      .input(z.object({ marketId: z.number(), fingerprint: z.string() }))
      .query(async ({ input }) => {
        const voted = await hasVoted(input.marketId, input.fingerprint);
        return { voted };
      }),

    // Registrar um voto real
    vote: publicProcedure
      .input(z.object({
        marketId: z.number(),
        choice: z.enum(["A", "B"]),
        fingerprint: z.string().min(8).max(128),
        country: z.string().optional(),
        region: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        checkRateLimit(`vote:${getClientIp(ctx.req)}`, RATE_LIMITS.vote.max, RATE_LIMITS.vote.windowMs);
        const alreadyVoted = await hasVoted(input.marketId, input.fingerprint);
        if (alreadyVoted) throw new Error("Você já opinou nesta enquete.");
        // Corrida entre o check acima e o INSERT é coberta pelo índice único
        // (marketId, fingerprint): castVote lança DuplicateVoteError.
        await castVote({
          marketId: input.marketId,
          choice: input.choice,
          fingerprint: input.fingerprint,
          userId: ctx.user?.id ?? null,
          country: input.country ?? null,
          region: input.region ?? null,
        });

        // Recompensas de Qs em best-effort: falha aqui nunca derruba o voto
        let qsEarned = 0;
        let dailyStreak = 0;
        try {
          const market = await getMarketById(input.marketId);
          if (market) {
            const rewards = await processVoteRewards(input.fingerprint, market);
            qsEarned = rewards.qsEarned;
            dailyStreak = rewards.dailyStreak;
          }
        } catch (e) {
          console.error("[vote] Falha ao processar recompensas de Qs:", e);
        }

        const stats = await getVoteStats(input.marketId);
        const total = stats.total;
        const pctA = total > 0 ? Math.round((stats.countA / total) * 100) : 50;
        const pctB = total > 0 ? Math.round((stats.countB / total) * 100) : 50;
        return {
          success: true,
          stats: { countA: stats.countA, countB: stats.countB, total, pctA, pctB },
          qsEarned,
          dailyStreak,
        };
      }),

    // Dados demográficos
    demographics: publicProcedure
      .input(z.object({ marketId: z.number() }))
      .query(async ({ input }) => {
        return getDemographics(input.marketId);
      }),

    // Histórico de votos (para gráfico temporal)
    voteHistory: publicProcedure
      .input(z.object({ marketId: z.number() }))
      .query(async ({ input }) => {
        return getVoteHistory(input.marketId);
      }),

    // Mercados relacionados
    related: publicProcedure
      .input(z.object({ marketId: z.number(), category: z.string() }))
      .query(async ({ input }) => {
        const relatedMarkets = await getRelatedMarkets(input.marketId, input.category);
        const marketsWithStats = await Promise.all(
          relatedMarkets.map(async (market: any) => {
            const stats = await getVoteStats(market.id);
            const total = stats.total;
            const pctA = total > 0 ? Math.round((stats.countA / total) * 100) : 50;
            const pctB = total > 0 ? Math.round((stats.countB / total) * 100) : 50;
            return { ...market, stats: { countA: stats.countA, countB: stats.countB, total, pctA, pctB } };
          })
        );
        return marketsWithStats;
      }),
  }),
  // ─── Notícias de Contexto ────────────────────────────────────────────────────────────────────
  news: router({
    // Notícias de contexto por enquete
    byMarket: publicProcedure
      .input(z.object({ marketId: z.number() }))
      .query(async ({ input }) => {
        return getNewsByMarketId(input.marketId);
      }),

    // Todas as notícias ativas (para ticker na home)
    allActive: publicProcedure.query(async () => {
      return getAllActiveNews();
    }),
  }),

  // ─── Score de Usuário ───────────────────────────────────────────────────────────────
  score: router({
    // Score de acerto do usuário (baseado no fingerprint)
    get: publicProcedure
      .input(z.object({ fingerprint: z.string().min(8).max(128) }))
      .query(async ({ input }) => {
        return getUserScore(input.fingerprint);
      }),

    // Histórico de votos com resultados
    history: publicProcedure
      .input(z.object({ fingerprint: z.string().min(8).max(128) }))
      .query(async ({ input }) => {
        return getUserVotesWithResults(input.fingerprint);
      }),
  }),

  // ─── Carteira de Qs ───────────────────────────────────────────────────────────
  wallet: router({
    // Saldo, streak diário e proteções (migra pontos herdados na 1ª leitura)
    get: publicProcedure
      .input(z.object({ fingerprint: z.string().min(8).max(128) }))
      .query(async ({ input }) => {
        return getWallet(input.fingerprint);
      }),

    // Extrato de transações (mais recentes primeiro)
    history: publicProcedure
      .input(z.object({ fingerprint: z.string().min(8).max(128), limit: z.number().int().min(1).max(200).optional() }))
      .query(async ({ input }) => {
        return getTransactions(input.fingerprint, input.limit ?? 50);
      }),
  }),

  // ─── Loja fictícia ────────────────────────────────────────────────────────────
  shop: router({
    list: publicProcedure.query(async () => {
      return listShopItems();
    }),

    myItems: publicProcedure
      .input(z.object({ fingerprint: z.string().min(8).max(128) }))
      .query(async ({ input }) => {
        return getMyItems(input.fingerprint);
      }),

    buy: publicProcedure
      .input(z.object({ fingerprint: z.string().min(8).max(128), itemCode: z.string().min(1).max(64) }))
      .mutation(async ({ input, ctx }) => {
        checkRateLimit(`shop:${getClientIp(ctx.req)}`, RATE_LIMITS.shop.max, RATE_LIMITS.shop.windowMs);
        return buyItem(input.fingerprint, input.itemCode);
      }),

    equip: publicProcedure
      .input(z.object({ fingerprint: z.string().min(8).max(128), itemId: z.number().int() }))
      .mutation(async ({ input }) => {
        return equipItem(input.fingerprint, input.itemId);
      }),

    unequip: publicProcedure
      .input(z.object({ fingerprint: z.string().min(8).max(128), itemId: z.number().int() }))
      .mutation(async ({ input }) => {
        return unequipItem(input.fingerprint, input.itemId);
      }),

    // Impulsionar enquete: destaque na home por 24h
    boost: publicProcedure
      .input(z.object({ fingerprint: z.string().min(8).max(128), marketId: z.number().int() }))
      .mutation(async ({ input, ctx }) => {
        checkRateLimit(`shop:${getClientIp(ctx.req)}`, RATE_LIMITS.shop.max, RATE_LIMITS.shop.windowMs);
        return boostMarket(input.fingerprint, input.marketId);
      }),
  }),

  // ─── Ranking Público ──────────────────────────────────────────────────────────
  ranking: router({
    // Top 50 usuários por pontos
    top: publicProcedure.query(async () => {
      return getTopRanking(50);
    }),

    // Posição e score do usuário atual
    myPosition: publicProcedure
      .input(z.object({ fingerprint: z.string().min(8).max(128) }))
      .query(async ({ input }) => {
        return getMyRankingPosition(input.fingerprint);
      }),

    // Definir apelido no ranking
    setNickname: publicProcedure
      .input(z.object({
        fingerprint: z.string().min(8).max(128),
        nickname: z.string().min(2).max(32).regex(/^[a-zA-Z0-9À-ÿ _-]+$/, "Apelido inválido"),
      }))
      .mutation(async ({ input, ctx }) => {
        checkRateLimit(`nickname:${getClientIp(ctx.req)}`, RATE_LIMITS.nickname.max, RATE_LIMITS.nickname.windowMs);
        return setNickname(input.fingerprint, input.nickname);
      }),
  }),

  // ─── Admin ───────────────────────────────────────────────────────────────────────
  admin: router({// Listar TODOS os mercados (incluindo inativos) com contagem de votos
    listAll: adminProcedure.query(async () => {
      const allMarkets = await getAllMarketsAdmin();
      const marketsWithVotes = await Promise.all(
        allMarkets.map(async (market: any) => {
          const stats = await getVoteStats(market.id);
          const voteCount = await getMarketVoteCount(market.id);
          return { ...market, voteCount, stats };
        })
      );
      return marketsWithVotes;
    }),

    // Criar novo mercado
    create: adminProcedure
      .input(z.object({
        slug: z.string().min(3).max(128).regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e hífens"),
        title: z.string().min(5),
        description: z.string().optional(),
        category: z.string().min(1).default("geral"),
        optionA: z.string().min(1),
        optionB: z.string().min(1),
        labelA: z.string().min(1),
        labelB: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        return createMarket({
          slug: input.slug,
          title: input.title,
          description: input.description ?? null,
          category: input.category,
          optionA: input.optionA,
          optionB: input.optionB,
          labelA: input.labelA,
          labelB: input.labelB,
          isActive: true,
        });
      }),

    // Editar mercado existente
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        slug: z.string().min(3).max(128).regex(/^[a-z0-9-]+$/).optional(),
        title: z.string().min(5).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        optionA: z.string().optional(),
        optionB: z.string().optional(),
        labelA: z.string().optional(),
        labelB: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateMarket(id, data);
      }),

    // Desativar mercado (soft delete)
    deactivate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteMarket(input.id);
      }),

    // Reativar mercado
    activate: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return updateMarket(input.id, { isActive: true });
      }),

    // Resolver enquete e recalcular pontos de todos os votantes
    resolve: adminProcedure
      .input(z.object({
        id: z.number(),
        resolvedChoice: z.enum(["A", "B"]),
      }))
      .mutation(async ({ input }) => {
        await resolveMarket(input.id, input.resolvedChoice);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
