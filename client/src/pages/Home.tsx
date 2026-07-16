import { useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import Methodology from "@/components/Methodology";
import Disclaimer from "@/components/Disclaimer";
import MarketCard from "@/components/MarketCard";
import CategoryNav from "@/components/CategoryNav";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";
import { categoryLabel } from "@/lib/categories";
import { Loader2, BarChart3 } from "lucide-react";
import UserScoreCard from "@/components/UserScoreCard";

export default function Home() {
  useEffect(() => {
    document.title = "AchoQ - Expectativa Coletiva do Brasil";
  }, []);
  const fingerprint = useFingerprint();
  const { data: markets, isLoading, error } = trpc.markets.list.useQuery(
    { fingerprint: fingerprint || undefined },
    {
      refetchInterval: 30_000, // Atualizar a cada 30 segundos
      enabled: !!fingerprint,
    }
  );
  const { data: allNews } = trpc.news.allActive.useQuery();

  // Map news by marketId for quick lookup - group all news per market
  const newsByMarketId = useMemo(() => {
    const map = new Map<number, Array<{ tickerText: string; sourceName: string }>>();
    if (allNews) {
      for (const n of allNews as any[]) {
        if (!map.has(n.marketId)) {
          map.set(n.marketId, []);
        }
        map.get(n.marketId)!.push({ tickerText: n.tickerText, sourceName: n.sourceName });
      }
    }
    return map;
  }, [allNews]);

  const featuredMarket = markets?.[0];
  const otherMarkets = markets?.slice(1) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-brand selection:text-white">
      <Header />
      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative w-full py-8 md:py-16 bg-muted/50">
          <div className="container max-w-4xl mx-auto">

            {/* Navegação por categoria */}
            <CategoryNav className="mb-6" />

            {/* Título da seção */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted px-3 py-1 rounded-full">
                  Enquete em Destaque
                </span>
              </div>
              {isLoading ? (
                <div className="h-10 bg-muted rounded-lg animate-pulse w-3/4" />
              ) : (
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                  {featuredMarket?.title ?? "Carregando mercados..."}
                </h1>
              )}
            </div>

            {/* Card principal */}
            {isLoading ? (
              <div className="bg-card border border-border rounded-xl p-8 flex items-center justify-center min-h-[200px]">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm">Carregando dados reais...</span>
                </div>
              </div>
            ) : error ? (
              <div className="bg-card border border-red-200 rounded-xl p-8 text-center text-red-600">
                <p className="font-semibold">Erro ao carregar mercados</p>
                <p className="text-sm mt-1 text-red-400">{error.message}</p>
              </div>
            ) : featuredMarket ? (
              <MarketCard
                marketId={featuredMarket.id}
                slug={featuredMarket.slug}
                title={featuredMarket.title}
                category={categoryLabel(featuredMarket.category)}
                optionA={featuredMarket.optionA}
                optionB={featuredMarket.optionB}
                labelA={featuredMarket.labelA}
                labelB={featuredMarket.labelB}
                initialStats={featuredMarket.stats}
                endsAt={featuredMarket.endsAt}
                imageUrl={featuredMarket.imageUrl}
                tickerItems={newsByMarketId.get(featuredMarket.id) ?? null}
                initialVoted={featuredMarket.viewerHasVoted}
                boosted={(featuredMarket as any).boosted}
                hero
              />
            ) : null}
          </div>
        </section>

        {/* Outros Mercados */}
        {otherMarkets.length > 0 && (
          <section className="w-full py-8 md:py-12 bg-card border-t border-border/50">
            <div className="container max-w-4xl mx-auto">
              <div className="mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Outras Enquetes em Destaque
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {otherMarkets.map((market) => (
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
            </div>
          </section>
        )}

        {/* Score de Usuário */}
        <UserScoreCard />

        {/* Seções informativas */}
        <HowItWorks />
        <Methodology />
        <Disclaimer />
      </main>
      <Footer />
    </div>
  );
}
