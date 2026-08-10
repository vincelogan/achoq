import { Link } from "wouter";
import { TrendingDown, TrendingUp } from "lucide-react";

type TapeMarket = {
  id: number;
  slug: string;
  title: string;
  optionA: string;
  stats: { pctA: number; pctB: number; total: number };
};

/**
 * Fita de cotações ("ticker tape") — assinatura do rebrand Pregão.
 * Mostra o placar ao vivo de cada enquete como uma bolsa mostra ativos:
 * nome curto + % da opção líder, verde quando a opção A lidera, coral
 * quando a B lidera. Conteúdo duplicado 2× para o loop CSS ser contínuo.
 */
export default function TickerTape({ markets }: { markets: TapeMarket[] }) {
  if (!markets || markets.length === 0) return null;

  const items = markets.slice(0, 12).map((m) => {
    const aLeads = m.stats.pctA >= m.stats.pctB;
    return {
      id: m.id,
      slug: m.slug,
      // Nome curto estilo "ticker": título truncado sem a pergunta inteira
      label: shortLabel(m.title),
      pct: aLeads ? m.stats.pctA : m.stats.pctB,
      side: aLeads ? m.optionA : undefined,
      aLeads,
    };
  });

  const tape = (
    <>
      {items.map((it) => (
        <Link
          key={it.id}
          href={`/mercado/${it.slug}`}
          className="flex items-center gap-1.5 px-4 py-1.5 font-mono text-[11px] tracking-tight whitespace-nowrap hover:bg-muted/60 transition-colors"
        >
          <span className="text-muted-foreground uppercase">{it.label}</span>
          <span className={`flex items-center gap-0.5 font-bold tabular-nums ${it.aLeads ? "text-vote-a" : "text-vote-b"}`}>
            {it.aLeads ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {it.side ? `${it.side} ` : ""}{it.pct}%
          </span>
          <span className="text-border select-none" aria-hidden>·</span>
        </Link>
      ))}
    </>
  );

  return (
    <div className="tape w-full border-b border-border bg-card/60 overflow-hidden" aria-label="Placar ao vivo das enquetes">
      <div className="tape-track">
        <div className="flex">{tape}</div>
        {/* Cópia para o loop contínuo — invisível para leitores de tela */}
        <div className="flex" aria-hidden>{tape}</div>
      </div>
    </div>
  );
}

/** Encurta o título para caber na fita, estilo código de ativo. */
function shortLabel(title: string): string {
  const cleaned = title
    .replace(/^você acha que\s*/i, "")
    .replace(/\?+\s*$/, "")
    .trim();
  return cleaned.length > 38 ? `${cleaned.slice(0, 36)}…` : cleaned;
}
