import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import {
  getAllMarkets,
  getMarketBySlug,
  getVoteStats,
  hasVoted,
  castVote,
  getDemographics,
  seedMarketsIfEmpty,
  getAllMarketsAdmin,
  createMarket,
  updateMarket,
  deleteMarket,
  getMarketVoteCount,
} from "./db";

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
    // Listar todos os mercados ativos com estatísticas reais
    list: publicProcedure.query(async () => {
      const allMarkets = await getAllMarkets();
      const marketsWithStats = await Promise.all(
        allMarkets.map(async (market: any) => {
          const stats = await getVoteStats(market.id);
          const total = stats.total;
          const pctA = total > 0 ? Math.round((stats.countA / total) * 100) : 50;
          const pctB = total > 0 ? Math.round((stats.countB / total) * 100) : 50;
          return { ...market, stats: { countA: stats.countA, countB: stats.countB, total, pctA, pctB } };
        })
      );
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
        const alreadyVoted = await hasVoted(input.marketId, input.fingerprint);
        if (alreadyVoted) throw new Error("Você já votou neste mercado.");
        await castVote({
          marketId: input.marketId,
          choice: input.choice,
          fingerprint: input.fingerprint,
          userId: ctx.user?.id ?? null,
          country: input.country ?? null,
          region: input.region ?? null,
        });
        const stats = await getVoteStats(input.marketId);
        const total = stats.total;
        const pctA = total > 0 ? Math.round((stats.countA / total) * 100) : 50;
        const pctB = total > 0 ? Math.round((stats.countB / total) * 100) : 50;
        return { success: true, stats: { countA: stats.countA, countB: stats.countB, total, pctA, pctB } };
      }),

    // Dados demográficos
    demographics: publicProcedure
      .input(z.object({ marketId: z.number() }))
      .query(async ({ input }) => {
        return getDemographics(input.marketId);
      }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    // Listar TODOS os mercados (incluindo inativos) com contagem de votos
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
  }),
});

export type AppRouter = typeof appRouter;
