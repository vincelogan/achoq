import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getAllMarkets,
  getMarketBySlug,
  getVoteStats,
  hasVoted,
  castVote,
  getDemographics,
  seedMarketsIfEmpty,
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
        allMarkets.map(async (market) => {
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
});

export type AppRouter = typeof appRouter;
