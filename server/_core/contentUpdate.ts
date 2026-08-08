import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { markets, InsertMarket } from "../../drizzle/schema";
import { resolveMarket } from "../resolution";

/**
 * Atualização de conteúdo de agosto/2026 (rodada 3):
 *
 * - Backfill de `endsAt` para enquetes antigas que nunca tiveram prazo definido
 *   (eleicoes-2026, copa-2026, neymar-copa, bbb-26-campeao) — sem isso elas
 *   nunca apareciam como "vencidas" em lugar nenhum, mesmo com o evento real
 *   já concluído há meses.
 * - Resolução das enquetes cujo resultado real já é conhecido (pesquisado com
 *   fontes no momento da implementação), via `resolveMarket()` para preservar
 *   recompensas/badges/notificações de quem já votou.
 * - Publicação de 3 novas enquetes virais e atuais, com banner próprio.
 *
 * Idempotente: cada etapa só age quando ainda não foi aplicada, então clicar
 * de novo no botão do admin (ou reexecutar em outro deploy) é sempre seguro.
 */

type DateFixup = { slug: string; endsAt: string };
type Resolution = { slug: string; choice: "A" | "B"; reason: string };

const DATE_FIXUPS: DateFixup[] = [
  // Eleições 2026: 1º turno em 04/10, 2º turno (se houver) em 25/10 — usamos a
  // data do 2º turno como prazo, já que é quando o resultado fica definitivo.
  { slug: "eleicoes-2026", endsAt: "2026-10-25 23:59:59" },
  // Final da Copa do Mundo 2026: 19/07/2026 (Espanha 1x0 Argentina, no tempo extra).
  { slug: "copa-2026", endsAt: "2026-07-19 23:59:59" },
  // Lista final de convocados anunciada em maio/2026.
  { slug: "neymar-copa", endsAt: "2026-05-18 23:59:59" },
  // Final do BBB 26: 21/04/2026.
  { slug: "bbb-26-campeao", endsAt: "2026-04-21 23:59:59" },
];

const RESOLUTIONS: Resolution[] = [
  {
    slug: "copa-2026",
    choice: "B", // "Não" — o Brasil não foi campeão
    reason: "Espanha venceu a Argentina por 1x0 na prorrogação e é a campeã da Copa do Mundo 2026.",
  },
  {
    slug: "neymar-copa",
    choice: "A", // "Sim" — foi convocado
    reason: "Neymar foi incluído na lista final de 26 convocados de Ancelotti, anunciada em maio/2026.",
  },
  {
    slug: "bbb-26-campeao",
    choice: "A", // "Ana Paula"
    reason: "Ana Paula Renault venceu o BBB 26 com 75,94% dos votos sobre Milena Moreira.",
  },
];

const NEW_MARKETS: InsertMarket[] = [
  {
    slug: "eleicoes-2026-segundo-turno",
    title: "Você acha que vai ter 2º turno nas eleições presidenciais de 2026?",
    description:
      "Pesquisas recentes (Quaest/Genial, abr/2026) mostram Lula e Flávio Bolsonaro tecnicamente empatados no 2º turno, ambos abaixo de 50% dos votos válidos no 1º turno — cenário que aponta para uma decisão além do dia 4 de outubro. Resolução: após a apuração do 1º turno, em outubro de 2026.",
    category: "politica",
    optionA: "SIM",
    optionB: "NÃO",
    labelA: "Vai ter 2º turno",
    labelB: "Decide no 1º turno",
    imageUrl: "/banners/eleicoes-2026-segundo-turno.png",
    endsAt: new Date("2026-10-05T12:00:00.000Z"),
    isActive: true,
  },
  {
    slug: "producao-br-netflix-top10-2026",
    title: "Você acha que uma produção brasileira vai ficar entre as 10 mais assistidas globais da Netflix em 2026?",
    description:
      "Enquete sobre a presença de séries e filmes brasileiros no ranking Top 10 Global (não-inglês) da Netflix ao longo de 2026. Fonte: Netflix Top 10 (top10.netflix.com).",
    category: "entretenimento",
    optionA: "SIM",
    optionB: "NÃO",
    labelA: "Terá produção BR no Top 10",
    labelB: "Não terá",
    imageUrl: "/banners/producao-br-netflix-top10-2026.png",
    endsAt: new Date("2026-12-31T23:59:59.000Z"),
    isActive: true,
  },
  {
    slug: "libertadores-2026-campeao-brasileiro",
    title: "Você acha que um time brasileiro vai ser campeão da Libertadores 2026?",
    description:
      "As oitavas de final começaram em agosto/2026 com seis brasileiros na disputa: Corinthians, Cruzeiro, Flamengo, Fluminense, Palmeiras e Mirassol. A final acontece em 28/11/2026, no Estádio Centenário, em Montevidéu. Fonte: CONMEBOL.",
    category: "esportes",
    optionA: "SIM",
    optionB: "NÃO",
    labelA: "Brasileiro é campeão",
    labelB: "Outro país é campeão",
    imageUrl: "/banners/libertadores-2026-campeao-brasileiro.png",
    endsAt: new Date("2026-11-28T23:59:59.000Z"),
    isActive: true,
  },
];

export async function applyAugust2026ContentUpdate(): Promise<{
  datesFixed: string[];
  resolved: string[];
  inserted: string[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível.");

  const datesFixed: string[] = [];
  for (const fix of DATE_FIXUPS) {
    const result: any = await db.execute(
      sql`UPDATE markets SET endsAt = ${fix.endsAt} WHERE slug = ${fix.slug} AND endsAt IS NULL`
    );
    const affected = result?.[0]?.affectedRows ?? result?.affectedRows ?? 0;
    if (affected > 0) datesFixed.push(fix.slug);
  }

  const resolved: string[] = [];
  for (const r of RESOLUTIONS) {
    const rows = await db
      .select({ id: markets.id, resolvedChoice: markets.resolvedChoice })
      .from(markets)
      .where(eq(markets.slug, r.slug))
      .limit(1);
    const m = rows[0];
    if (m && !m.resolvedChoice) {
      await resolveMarket(m.id, r.choice);
      resolved.push(r.slug);
    }
  }

  const inserted: string[] = [];
  for (const nm of NEW_MARKETS) {
    const existing = await db.select({ id: markets.id }).from(markets).where(eq(markets.slug, nm.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(markets).values(nm);
      inserted.push(nm.slug);
    }
  }

  return { datesFixed, resolved, inserted };
}
