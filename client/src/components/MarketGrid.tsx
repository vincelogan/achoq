import { useMemo } from "react";
import MarketCard from "@/components/MarketCard";
import { trpc } from "@/lib/trpc";
import { categoryLabel } from "@/lib/categories";

type MarketListItem = {
  id: number;
  slug: string;
  title: string;
  category: string;
  optionA: string;
  optionB: string;
  labelA: string;
  labelB: string;
  endsAt?: string | Date | null;
  imageUrl?: string | null;
  stats: { countA: number; countB: number; total: number; pctA: number; pctB: number };
  viewerHasVoted?: boolean;
};

/** Grid de MarketCards com ticker de notícias por enquete. */
export default function MarketGrid({ markets }: { markets: MarketListItem[] }) {
  const { data: allNews } = trpc.news.allActive.useQuery();

  const newsByMarketId = useMemo(() => {
    const map = new Map<number, Array<{ tickerText: string; sourceName: string }>>();
    if (allNews) {
      for (const n of allNews as any[]) {
        if (!map.has(n.marketId)) map.set(n.marketId, []);
        map.get(n.marketId)!.push({ tickerText: n.tickerText, sourceName: n.sourceName });
      }
    }
    return map;
  }, [allNews]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {markets.map((market) => (
        <MarketCard
          key={market.id}
          marketId={market.id}
          slug={market.slug}
          title={market.title}
          category={categoryLabel(market.category)}
          optionA={market.optionA}
          optionB={market.optionB}
          labelA={market.labelA}
          labelB={market.labelB}
          initialStats={market.stats}
          endsAt={market.endsAt}
          imageUrl={market.imageUrl}
          tickerItems={newsByMarketId.get(market.id) ?? null}
          initialVoted={market.viewerHasVoted}
          boosted={(market as any).boosted}
        />
      ))}
    </div>
  );
}
