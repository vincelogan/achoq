import { updateMarket, recalcScoresForMarket } from "./db";

/**
 * Resolve uma enquete: grava o resultado, desativa e recalcula a pontuação
 * de acurácia de todos os fingerprints que votaram.
 *
 * Lógica única compartilhada entre `admin.resolve` (tRPC) e o endpoint
 * agendado `POST /api/scheduled/resolve-markets`. É segura para re-execução:
 * o recompute de scores é idempotente (recalcula do zero a partir dos votos).
 */
export async function resolveMarket(marketId: number, resolvedChoice: "A" | "B"): Promise<void> {
  await updateMarket(marketId, { resolvedChoice, isActive: false });
  await recalcScoresForMarket(marketId);
}
