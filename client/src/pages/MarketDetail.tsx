import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  CheckCircle2,
  Loader2,
  Link2,
  PartyPopper,
  Clock,
  ChevronRight,
  Zap,
  Bell,
  BellOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useVote } from "@/hooks/useVote";
import { SharePopup, PostVoteShareModal } from "@/components/SharePopup";
import CommentsSection from "@/components/CommentsSection";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { categoryLabel, categoryChipClasses } from "@/lib/categories";

function VoteChart({ history, optionA, optionB }: { history: { date: string; choice: string; count: number }[]; optionA?: string; optionB?: string }) {
  const chartData = useMemo(() => {
    const dateMap = new Map<string, { a: number; b: number }>();
    for (const row of history) {
      const existing = dateMap.get(row.date) || { a: 0, b: 0 };
      if (row.choice === "A") existing.a += Number(row.count);
      else existing.b += Number(row.count);
      dateMap.set(row.date, existing);
    }
    const entries = Array.from(dateMap.entries()).sort(([a], [b]) => a.localeCompare(b));
    return entries.map(([date, { a, b }]) => {
      const total = a + b;
      return { date, pctA: total > 0 ? Math.round((a / total) * 100) : 50, pctB: total > 0 ? Math.round((b / total) * 100) : 50, total };
    });
  }, [history]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        <Clock className="w-4 h-4 mr-2" />
        Dados de evolução aparecerão após mais opiniões
      </div>
    );
  }

  const maxBars = 14;
  const displayData = chartData.slice(-maxBars);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-vote-a" /><span>{optionA || "Opção A"}</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-vote-b" /><span>{optionB || "Opção B"}</span></div>
      </div>
      <div className="flex items-end gap-1 h-32">
        {displayData.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col gap-px" style={{ height: "100%" }}>
              <div className="bg-vote-a rounded-t-sm transition-all duration-500" style={{ height: `${d.pctA}%`, minHeight: d.pctA > 0 ? "2px" : "0" }} title={`${d.pctA}%`} />
              <div className="bg-vote-b rounded-b-sm transition-all duration-500" style={{ height: `${d.pctB}%`, minHeight: d.pctB > 0 ? "2px" : "0" }} title={`${d.pctB}%`} />
            </div>
            <span className="text-[9px] text-muted-foreground truncate w-full text-center">
              {new Date(d.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarketDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const [shareOpen, setShareOpen] = useState(false);
  const [postVoteShareOpen, setPostVoteShareOpen] = useState(false);
  // Detectar se o usuário chegou via link de desafio
  const isChallenge = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("challenge") === "1";
  }, []);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: market, isLoading, error } = trpc.markets.bySlug.useQuery({ slug }, { enabled: !!slug });
  const { data: history } = trpc.markets.voteHistory.useQuery({ marketId: market?.id ?? 0 }, { enabled: !!market });
  const { data: relatedMarkets } = trpc.markets.related.useQuery({ marketId: market?.id ?? 0, category: market?.category ?? "" }, { enabled: !!market });
  const { data: newsItems } = trpc.news.byMarket.useQuery({ marketId: market?.id ?? 0 }, { enabled: !!market });

  const utils = trpc.useUtils();
  const { fingerprint, vote, hasVoted, myChoice, votingChoice, justVoted } = useVote({
    marketId: market?.id,
    onVoted: () => {
      setShowConfirmation(true);
      setTimeout(() => {
        setShowConfirmation(false);
        // Abrir modal de compartilhamento pós-voto após a confirmação
        setPostVoteShareOpen(true);
      }, 2000);
      utils.markets.bySlug.invalidate({ slug });
      utils.markets.voteHistory.invalidate({ marketId: market?.id ?? 0 });
    },
  });

  const handleVote = (choice: "A" | "B") => vote(choice);
  const votingFor = votingChoice;
  const justVotedChoice = justVoted;

  const { data: watchStatus } = trpc.watchlist.status.useQuery(
    { fingerprint, marketId: market?.id ?? 0 },
    { enabled: !!market && !!fingerprint }
  );
  const watchMutation = trpc.watchlist.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.watching ? "Seguindo! Você será avisado se a maioria virar." : "Você deixou de seguir esta enquete.");
      utils.watchlist.status.invalidate({ fingerprint, marketId: market?.id ?? 0 });
    },
    onError: (err) => toast.error(err.message),
  });

  const boostMutation = trpc.shop.boost.useMutation({
    onSuccess: () => {
      toast.success("Enquete impulsionada por 24h! ⚡");
      utils.wallet.get.invalidate();
      utils.markets.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const stats = market?.stats;

  useEffect(() => {
    if (market) {
      document.title = `${market.title} | AchoQ`;
      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", market.description || `Veja o que o Brasil acha: ${market.title}`);
      // Update OG tags for social sharing
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", `${market.title} | AchoQ`);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", market.description || `Veja o que o Brasil acha: ${market.title}`);
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute("content", `${window.location.origin}/mercado/${market.slug}`);
      if (market.imageUrl) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) ogImage.setAttribute("content", market.imageUrl);
      }
      // Update canonical URL
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.setAttribute("href", `${window.location.origin}/mercado/${market.slug}`);
      // Update Twitter Card
      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle) twTitle.setAttribute("content", `${market.title} | AchoQ`);
      const twDesc = document.querySelector('meta[name="twitter:description"]');
      if (twDesc) twDesc.setAttribute("content", market.description || `Veja o que o Brasil acha: ${market.title}`);

      // JSON-LD Structured Data for this poll/article
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": market.title,
        "description": market.description || `Veja o que o Brasil acha: ${market.title}`,
        "image": market.imageUrl || "https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/achoq-og-image-aawMaQuDuycX5rNEb2EqnQ.png",
        "url": `${window.location.origin}/mercado/${market.slug}`,
        "datePublished": market.createdAt ? new Date(market.createdAt).toISOString() : undefined,
        "dateModified": market.updatedAt ? new Date(market.updatedAt).toISOString() : undefined,
        "author": {
          "@type": "Organization",
          "name": "AchoQ",
          "url": "https://achoq.com.br"
        },
        "publisher": {
          "@type": "Organization",
          "name": "AchoQ",
          "logo": {
            "@type": "ImageObject",
            "url": "https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/achoq-logo-white-BLiPCqaJbJJwJNXxmtqJqA.png"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `${window.location.origin}/mercado/${market.slug}`
        },
        "interactionStatistic": {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/VoteAction",
          "userInteractionCount": stats ? (stats.countA + stats.countB) : 0
        }
      };
      let scriptTag = document.getElementById("jsonld-market") as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.id = "jsonld-market";
        scriptTag.type = "application/ld+json";
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    }
    return () => {
      document.title = "AchoQ - Expectativa Coletiva do Brasil";
      // Reset meta tags
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical) canonical.setAttribute("href", "https://achoq.com.br/");
      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) ogUrl.setAttribute("content", "https://achoq.com.br/");
      // Remove JSON-LD
      const scriptTag = document.getElementById("jsonld-market");
      if (scriptTag) scriptTag.remove();
    };
  }, [market, stats]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
        <Footer />
      </div>
    );
  }

  if (!market || error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold text-foreground">Enquete não encontrada</h1>
          <p className="text-muted-foreground">A enquete que você procura não existe ou foi desativada.</p>
          <Link href="/"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" />Voltar para a home</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const createdDate = market.createdAt ? new Date(market.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-card border-b border-border/50">
          <div className="container py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-brand transition-colors">Mercados</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href={`/categoria/${market.category}`} className={`px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${categoryChipClasses(market.category)}`}>
                {categoryLabel(market.category)}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground font-medium truncate max-w-[200px]">{market.title}</span>
            </nav>
          </div>
        </div>

        {/* Banner de desafio */}
        {isChallenge && !hasVoted && (
          <div className="bg-gradient-to-r from-amber-400 to-orange-400 text-white">
            <div className="container py-3 flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <p className="text-sm font-semibold">
                Alguém te desafiou! Veja o que o Brasil acha e dê sua opinião.
              </p>
            </div>
          </div>
        )}

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Título */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Imagem da enquete */}
                {market.imageUrl && (
                  <div className="relative h-48 md:h-64 overflow-hidden">
                    <img
                      src={market.imageUrl}
                      alt={market.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                )}
                <div className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${categoryChipClasses(market.category)}`}>
                        {categoryLabel(market.category)}
                      </span>
                      {market.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Ativo
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{market.title}</h1>
                  </div>
                  <button onClick={() => setShareOpen(true)} className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors shrink-0" title="Compartilhar" aria-label="Compartilhar enquete">
                    <Share2 className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                {market.description && <p className="text-muted-foreground leading-relaxed mb-5">{market.description}</p>}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="w-4 h-4" /><span className="font-semibold text-foreground">{stats?.total ?? 0}</span><span>opiniões</span></div>
                  <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-4 h-4" /><span>Criado em {createdDate}</span></div>
                  {market.endsAt && (
                    <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-4 h-4" /><span>Encerra em {new Date(market.endsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span></div>
                  )}
                </div>
                </div>
              </div>

              {/* Gráfico */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-brand" /><h2 className="font-bold text-foreground">Evolução das opiniões</h2></div>
                <VoteChart history={history || []} optionA={market.optionA} optionB={market.optionB} />
              </div>

              {/* Resultados */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center gap-2 mb-5"><TrendingUp className="w-5 h-5 text-brand" /><h2 className="font-bold text-foreground">Resultados em tempo real</h2></div>
                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <div><span className="text-3xl font-black text-vote-a">{stats?.pctA ?? 50}%</span><p className="text-sm text-muted-foreground mt-0.5">{market.optionA}</p></div>
                    <div className="text-right"><span className="text-3xl font-black text-vote-b">{stats?.pctB ?? 50}%</span><p className="text-sm text-muted-foreground mt-0.5">{market.optionB}</p></div>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden flex">
                    <motion.div className="bg-vote-a rounded-l-full" initial={{ width: "50%" }} animate={{ width: `${stats?.pctA ?? 50}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                    <motion.div className="bg-vote-b rounded-r-full" initial={{ width: "50%" }} animate={{ width: `${stats?.pctB ?? 50}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-vote-a/5 rounded-xl p-4 border border-vote-a/15">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{market.labelA}</p>
                    <p className="text-2xl font-bold text-vote-a">{stats?.countA ?? 0}</p>
                    <p className="text-xs text-muted-foreground">opiniões</p>
                  </div>
                  <div className="bg-vote-b/5 rounded-xl p-4 border border-vote-b/15">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{market.labelB}</p>
                    <p className="text-2xl font-bold text-vote-b">{stats?.countB ?? 0}</p>
                    <p className="text-xs text-muted-foreground">opiniões</p>
                  </div>
                </div>
              </div>

              {/* News - Apenas a notícia mais recente */}
              {newsItems && newsItems.length > 0 && (() => {
                const latestNews = (newsItems as any[])[0]; // já ordenado por newsDate DESC no backend
                return (
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold text-white bg-vote-a px-2 py-0.5 rounded uppercase tracking-wider">News</span>
                      <h2 className="font-bold text-foreground">Notícia Recente</h2>
                    </div>
                    <div className="bg-muted rounded-xl p-4 border border-border/50">
                      <p className="text-sm text-foreground/80 leading-relaxed mb-3">{latestNews.contextText}</p>
                      <div className="flex items-center justify-between">
                        <a href={latestNews.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline font-medium flex items-center gap-1">
                          <Link2 className="w-3 h-3" />{latestNews.sourceName}
                        </a>
                        {latestNews.newsDate && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(latestNews.newsDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Comentários */}
              <CommentsSection marketId={market.id} />

              {/* Mercados relacionados */}
              {relatedMarkets && relatedMarkets.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h2 className="font-bold text-foreground mb-4">Veja também</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relatedMarkets.map((rm: any) => (
                      <Link key={rm.id} href={`/mercado/${rm.slug}`} className="group flex items-center gap-3 p-4 rounded-xl border border-border/50 hover:border-brand/30 hover:bg-brand/5 transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors line-clamp-2">{rm.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-muted-foreground">{rm.stats.total} opiniões</span>
                            <span className="text-xs font-medium text-vote-a">{rm.stats.pctA}%</span>
                            <span className="text-xs text-muted-foreground/70">vs</span>
                            <span className="text-xs font-medium text-vote-b">{rm.stats.pctB}%</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-brand transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                  <h3 className="font-bold text-foreground mb-1">Qual é a sua opinião?</h3>
                  <p className="text-sm text-muted-foreground mb-5">Registre sua opinião de forma anônima</p>
                  <AnimatePresence mode="wait">
                    {showConfirmation ? (
                      <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center py-6 gap-3">
                        <div className="relative">
                          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                          <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.2 }} className="absolute -top-2 -right-2"><PartyPopper className="w-6 h-6 text-amber-500" /></motion.div>
                        </div>
                        <p className="font-bold text-emerald-600 text-lg">Opinião registrada!</p>
                        <p className="text-sm text-muted-foreground">Obrigado por participar</p>
                      </motion.div>
                    ) : hasVoted ? (
                      <motion.div key="voted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-4">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Você já opinou nesta enquete</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between"><span className="text-sm font-medium text-foreground/80">{market.optionA}</span><span className="text-sm font-bold text-vote-a">{stats?.pctA ?? 50}%</span></div>
                          <div className="h-3 rounded-full bg-muted overflow-hidden"><motion.div className="h-full bg-vote-a rounded-full" initial={{ width: 0 }} animate={{ width: `${stats?.pctA ?? 50}%` }} transition={{ duration: 0.6 }} /></div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between"><span className="text-sm font-medium text-foreground/80">{market.optionB}</span><span className="text-sm font-bold text-vote-b">{stats?.pctB ?? 50}%</span></div>
                          <div className="h-3 rounded-full bg-muted overflow-hidden"><motion.div className="h-full bg-vote-b rounded-full" initial={{ width: 0 }} animate={{ width: `${stats?.pctB ?? 50}%` }} transition={{ duration: 0.6 }} /></div>
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-3">{stats?.total ?? 0} opiniões registradas</p>
                      </motion.div>
                    ) : (
                      <motion.div key="voting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <button onClick={() => handleVote("A")} disabled={votingFor !== null} className="w-full flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4 rounded-xl border-2 border-vote-a/30 bg-vote-a/5 hover:bg-vote-a/10 hover:border-vote-a transition-all group disabled:opacity-60">
                          <div className="text-left"><p className="font-bold text-vote-a text-base sm:text-lg">{market.optionA}</p><p className="text-xs text-muted-foreground">{market.labelA}</p></div>
                          {votingFor === "A" ? <Loader2 className="w-5 h-5 animate-spin text-vote-a" /> : <div className="w-8 h-8 rounded-full border-2 border-vote-a/30 group-hover:border-vote-a group-hover:bg-vote-a/10 transition-all" />}
                        </button>
                        <div className="flex items-center gap-3"><div className="flex-1 h-px bg-border" /><span className="text-xs text-muted-foreground font-medium">ou</span><div className="flex-1 h-px bg-border" /></div>
                        <button onClick={() => handleVote("B")} disabled={votingFor !== null} className="w-full flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4 rounded-xl border-2 border-vote-b/30 bg-vote-b/5 hover:bg-vote-b/10 hover:border-vote-b transition-all group disabled:opacity-60">
                          <div className="text-left"><p className="font-bold text-vote-b text-base sm:text-lg">{market.optionB}</p><p className="text-xs text-muted-foreground">{market.labelB}</p></div>
                          {votingFor === "B" ? <Loader2 className="w-5 h-5 animate-spin text-vote-b" /> : <div className="w-8 h-8 rounded-full border-2 border-vote-b/30 group-hover:border-vote-b group-hover:bg-vote-b/10 transition-all" />}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-2">Compartilhe</h3>
                  <p className="text-sm text-muted-foreground mb-4">Convide amigos para participar desta enquete</p>
                  <Button onClick={() => setShareOpen(true)} variant="outline" className="w-full gap-2"><Share2 className="w-4 h-4" />Compartilhar enquete</Button>
                  <Button
                    onClick={() => watchMutation.mutate({ fingerprint, marketId: market.id })}
                    disabled={!fingerprint || watchMutation.isPending}
                    variant="outline"
                    className="w-full gap-2 mt-2"
                  >
                    {watchStatus?.watching ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    {watchStatus?.watching ? "Deixar de seguir" : "Seguir enquete"}
                  </Button>
                </div>

                {market.isActive && (
                  <div className="bg-card rounded-2xl border border-qs/30 p-6">
                    <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-qs" />
                      Impulsionar
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Coloque esta enquete em destaque na home por 24h usando seus Qs.
                    </p>
                    <Button
                      onClick={() => boostMutation.mutate({ fingerprint, marketId: market.id })}
                      disabled={!fingerprint || boostMutation.isPending}
                      variant="outline"
                      className="w-full gap-2 border-qs/40 text-qs hover:bg-qs/10 hover:text-qs"
                    >
                      {boostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                      Impulsionar por 200 Qs
                    </Button>
                  </div>
                )}

                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="font-bold text-foreground mb-3">Sobre esta enquete</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium text-emerald-600 dark:text-emerald-400">Ativo</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span className="font-medium text-foreground">{categoryLabel(market.category)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Criado em</span><span className="font-medium text-foreground">{createdDate}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Total de opiniões</span><span className="font-medium text-foreground">{stats?.total ?? 0}</span></div>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-4">
                  <p className="text-xs text-amber-700 dark:text-amber-300 dark:text-amber-300 leading-relaxed">
                    <strong>Aviso:</strong> Esta enquete reflete apenas a opinião dos participantes. Não é pesquisa eleitoral. Não constitui plataforma de apostas. Os resultados refletem a opinião/expectativa dos usuários participantes.
                    <Link href="/legal" className="underline ml-1 hover:text-amber-900">Saiba mais</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <AnimatePresence>
        <SharePopup
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          shareText={`📊 ${market.title} — Veja o que o Brasil acha no AchoQ!`}
          shareUrl={`${window.location.origin}/mercado/${market.slug}`}
        />
        <PostVoteShareModal
          open={postVoteShareOpen}
          onClose={() => setPostVoteShareOpen(false)}
          market={market}
          choice={justVotedChoice}
        />
      </AnimatePresence>
    </div>
  );
}
