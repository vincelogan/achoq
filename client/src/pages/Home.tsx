import { useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import Methodology from "@/components/Methodology";
import Disclaimer from "@/components/Disclaimer";
import MarketCard from "@/components/MarketCard";
import { trpc } from "@/lib/trpc";
import { Loader2, BarChart3 } from "lucide-react";
import UserScoreCard from "@/components/UserScoreCard";

export default function Home() {
  useEffect(() => {
    document.title = "Veja o que o Brasil acha em tempo real - Plataforma de Expectativa Coletiva";
  }, []);
  const { data: markets, isLoading, error } = trpc.markets.list.useQuery(undefined, {
    refetchInterval: 30_000, // Atualizar a cada 30 segundos
  });
  const { data: allNews } = trpc.news.allActive.useQuery();

  // Map news by marketId for quick lookup
  const newsByMarketId = useMemo(() => {
    const map = new Map<number, { tickerText: string; sourceName: string }>();
    if (allNews) {
      for (const n of allNews as any[]) {
        if (!map.has(n.marketId)) {
          map.set(n.marketId, { tickerText: n.tickerText, sourceName: n.sourceName });
        }
      }
    }
    return map;
  }, [allNews]);

  const featuredMarket = markets?.[0];
  const otherMarkets = markets?.slice(1) ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-white text-black font-sans selection:bg-[#0047FF] selection:text-white">
      <Header />
      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative w-full py-8 md:py-16 bg-gray-50/50">
          <div className="container max-w-4xl mx-auto">

            {/* Título da seção */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full">
                  Enquete em Destaque
                </span>
              </div>
              {isLoading ? (
                <div className="h-10 bg-gray-100 rounded-lg animate-pulse w-3/4" />
              ) : (
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                  {featuredMarket?.title ?? "Carregando mercados..."}
                </h1>
              )}
            </div>

            {/* Card principal */}
            {isLoading ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 flex items-center justify-center min-h-[200px]">
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm">Carregando dados reais...</span>
                </div>
              </div>
            ) : error ? (
              <div className="bg-white border border-red-200 rounded-xl p-8 text-center text-red-600">
                <p className="font-semibold">Erro ao carregar mercados</p>
                <p className="text-sm mt-1 text-red-400">{error.message}</p>
              </div>
            ) : featuredMarket ? (
              <MarketCard
                marketId={featuredMarket.id}
                slug={featuredMarket.slug}
                title={featuredMarket.title}
                category={({politica:"Política",esportes:"Esportes",economia:"Economia",entretenimento:"Entretenimento",tecnologia:"Tecnologia",geral:"Geral"} as Record<string,string>)[featuredMarket.category] || featuredMarket.category}
                optionA={featuredMarket.optionA}
                optionB={featuredMarket.optionB}
                labelA={featuredMarket.labelA}
                labelB={featuredMarket.labelB}
                initialStats={featuredMarket.stats}
                endsAt={featuredMarket.endsAt}
                imageUrl={featuredMarket.imageUrl}
                tickerText={newsByMarketId.get(featuredMarket.id)?.tickerText}
                tickerSource={newsByMarketId.get(featuredMarket.id)?.sourceName}
                hero
              />
            ) : null}
          </div>
        </section>

        {/* Outros Mercados */}
        {otherMarkets.length > 0 && (
          <section className="w-full py-8 md:py-12 bg-white border-t border-gray-100">
            <div className="container max-w-4xl mx-auto">
              <div className="mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                <h2 className="text-2xl font-bold tracking-tight text-gray-900">
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
                    category={({politica:"Política",esportes:"Esportes",economia:"Economia",entretenimento:"Entretenimento",tecnologia:"Tecnologia",geral:"Geral"} as Record<string,string>)[market.category] || market.category}
                    optionA={market.optionA}
                    optionB={market.optionB}
                    labelA={market.labelA}
                    labelB={market.labelB}
                    initialStats={market.stats}
                    endsAt={market.endsAt}
                    imageUrl={market.imageUrl}
                    tickerText={newsByMarketId.get(market.id)?.tickerText}
                    tickerSource={newsByMarketId.get(market.id)?.sourceName}
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
