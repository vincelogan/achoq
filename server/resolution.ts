import { eq, sql } from "drizzle-orm";
import { getDb, updateMarket, recalcScoresForMarket, getMarketById } from "./db";
import { userScores, votes } from "../drizzle/schema";
import { grantQs } from "./economy";
import { checkAndAwardBadges, REWARDS } from "./gamification";
import { notify } from "./notifications";

/**
 * Resolve uma enquete: grava o resultado, desativa, recalcula a pontuação
 * de acurácia de todos os fingerprints que votaram, credita Qs aos
 * acertadores (+20; +10 de bônus com sequência >= 3) e notifica cada
 * votante com o resultado.
 *
 * Lógica única compartilhada entre `admin.resolve` (tRPC) e o endpoint
 * agendado `POST /api/scheduled/resolve-markets`. É segura para re-execução:
 * o recompute de scores é idempotente e concessões/notificações usam
 * idempotencyKey única (re-resolver não duplica nada).
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
    const market = await getMarketById(marketId);
    const winningOption = market
      ? (resolvedChoice === "A" ? market.optionA : market.optionB)
      : resolvedChoice;

    const allVoters = await db
      .select({ fingerprint: votes.fingerprint, choice: votes.choice })
      .from(votes)
      .where(eq(votes.marketId, marketId));

    for (const voter of allVoters) {
      const fp = voter.fingerprint;
      const correct = voter.choice === resolvedChoice;

      if (correct) {
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

      // Notificação de resultado para TODOS os votantes
      if (market) {
        await notify({
          fingerprint: fp,
          type: "market_resolved",
          title: correct ? `Você acertou! +${REWARDS.correct} Qs 🎯` : "Enquete encerrada",
          body: `"${market.title}" — resultado: ${winningOption}.${correct ? "" : " Não foi dessa vez."}`,
          linkUrl: `/mercado/${market.slug}`,
          refType: "market",
          refId: marketId,
          idempotencyKey: `notif:resolved:${marketId}:${fp}`,
        });
      }
    }
  } catch (e) {
    // Recompensas/notificações nunca devem impedir a resolução em si
    console.error("[grantResolutionRewards] Error:", e);
  }
}
