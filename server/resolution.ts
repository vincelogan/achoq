import { eq, sql } from "drizzle-orm";
import { getDb, updateMarket, recalcScoresForMarket } from "./db";
import { userScores, votes } from "../drizzle/schema";
import { grantQs } from "./economy";
import { checkAndAwardBadges, REWARDS } from "./gamification";

/**
 * Resolve uma enquete: grava o resultado, desativa, recalcula a pontuação
 * de acurácia de todos os fingerprints que votaram e credita Qs aos
 * acertadores (+20 por acerto; +10 de bônus com sequência >= 3).
 *
 * Lógica única compartilhada entre `admin.resolve` (tRPC) e o endpoint
 * agendado `POST /api/scheduled/resolve-markets`. É segura para re-execução:
 * o recompute de scores é idempotente e as concessões de Qs usam
 * idempotencyKey única (re-resolver não duplica créditos).
 */
export async function resolveMarket(marketId: number, resolvedChoice: "A" | "B"): Promise<void> {
  await updateMarket(marketId, { resolvedChoice, isActive: false });
  await recalcScoresForMarket(marketId);
  await grantResolutionRewards(marketId, resolvedChoice);
}

async function grantResolutionRewards(marketId: number, resolvedChoice: "A" | "B"): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const correctVoters = await db
      .select({ fingerprint: votes.fingerprint })
      .from(votes)
      .where(sql`${votes.marketId} = ${marketId} AND ${votes.choice} = ${resolvedChoice}`);

    for (const voter of correctVoters) {
      const fp = voter.fingerprint;
      await grantQs({
        fingerprint: fp,
        amount: REWARDS.correct,
        type: "correct",
        idempotencyKey: `correct:${marketId}:${fp}`,
        refType: "market",
        refId: marketId,
      });

      // Bônus de sequência: streak de acertos (recém-recalculada) >= 3
      const scoreRows = await db
        .select({ streak: userScores.streak })
        .from(userScores)
        .where(eq(userScores.fingerprint, fp))
        .limit(1);
      if (Number(scoreRows[0]?.streak ?? 0) >= 3) {
        await grantQs({
          fingerprint: fp,
          amount: REWARDS.streakBonus,
          type: "streak_bonus",
          idempotencyKey: `streakb:${marketId}:${fp}`,
          refType: "market",
          refId: marketId,
        });
      }

      // Conquistas de acerto (Na Mosca, Certeiro, Vidente...)
      await checkAndAwardBadges(fp);
    }
  } catch (e) {
    // Recompensas nunca devem impedir a resolução em si
    console.error("[grantResolutionRewards] Error:", e);
  }
}
