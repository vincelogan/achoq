import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
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
  X,
  PartyPopper,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CATEGORY_LABELS: Record<string, string> = {
  politica: "Política",
  esportes: "Esportes",
  entretenimento: "Entretenimento",
  economia: "Economia",
  tecnologia: "Tecnologia",
  geral: "Geral",
};

const CATEGORY_COLORS: Record<string, string> = {
  politica: "bg-blue-100 text-blue-700",
  esportes: "bg-green-100 text-green-700",
  entretenimento: "bg-purple-100 text-purple-700",
  economia: "bg-amber-100 text-amber-700",
  tecnologia: "bg-cyan-100 text-cyan-700",
  geral: "bg-gray-100 text-gray-700",
};

function SharePopup({ open, onClose, title, slug }: { open: boolean; onClose: () => void; title: string; slug: string }) {
  if (!open) return null;
  const url = `${window.location.origin}/mercado/${slug}`;
  const text = `📊 ${title} — Veja o que o Brasil acha no AchoQ!`;
  const share = (platform: string) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    const links: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      x: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    };
    if (platform === "instagram") {
      navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Texto copiado! Cole nos Stories ou Direct do Instagram.");
      onClose();
      return;
    }
    if (platform === "copy") {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
      onClose();
      return;
    }
    window.open(links[platform], "_blank", "noopener,noreferrer");
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-900">Compartilhar</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-500 mb-5 line-clamp-2">{title}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => share("whatsapp")} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
            <span className="text-xl">🟢</span><span className="text-sm font-medium text-green-700">WhatsApp</span>
          </button>
          <button onClick={() => share("facebook")} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
            <span className="text-xl">🔵</span><span className="text-sm font-medium text-blue-700">Facebook</span>
          </button>
          <button onClick={() => share("instagram")} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors">
            <span className="text-xl">📷</span><span className="text-sm font-medium text-pink-700">Instagram</span>
          </button>
          <button onClick={() => share("x")} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
            <span className="text-xl">✖️</span><span className="text-sm font-medium text-gray-700">X (Twitter)</span>
          </button>
        </div>
        <button onClick={() => share("copy")} className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
          <Link2 className="w-4 h-4 text-gray-500" /><span className="text-sm font-medium text-gray-600">Copiar link</span>
        </button>
      </motion.div>
    </div>
  );
}

// ─── Modal pós-voto: compartilhamento com mensagem personalizada ─────────────
function PostVoteShareModal({
  open,
  onClose,
  market,
  choice,
}: {
  open: boolean;
  onClose: () => void;
  market: { title: string; slug: string; optionA: string; optionB: string };
  choice: "A" | "B" | null;
}) {
  if (!open || !choice) return null;

  const chosenOption = choice === "A" ? market.optionA : market.optionB;
  const url = `${window.location.origin}/mercado/${market.slug}?challenge=1`;
  const shareText = `Eu acho que "${chosenOption}" — e você? Vote no AchoQ!`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(url);

  const handleShare = (platform: string) => {
    if (platform === "whatsapp") {
      window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, "_blank", "noopener,noreferrer");
    } else if (platform === "x") {
      window.open(`https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, "_blank", "noopener,noreferrer");
    } else if (platform === "copy") {
      navigator.clipboard.writeText(`${shareText} ${url}`);
      toast.success("Link copiado!");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 w-full sm:max-w-sm mx-0 sm:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PartyPopper className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-gray-900">Opinião registrada!</span>
            </div>
            <p className="text-xs text-gray-400">Desafie seus amigos a opinar também</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Mensagem personalizada */}
        <div className="bg-gray-50 rounded-xl p-4 mb-5 border border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed">
            <span className="font-semibold text-[#002B5C]">Eu acho que &ldquo;{chosenOption}&rdquo;</span>
            {" — e você? Vote no AchoQ!"}
          </p>
        </div>

        {/* Botões de compartilhamento */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleShare("whatsapp")}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-green-50 hover:bg-green-100 transition-colors border border-green-200"
          >
            <span className="text-xl">🟢</span>
            <span className="text-sm font-semibold text-green-700">WhatsApp</span>
          </button>
          <button
            onClick={() => handleShare("x")}
            className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            <span className="text-xl">✖️</span>
            <span className="text-sm font-semibold text-gray-700">X (Twitter)</span>
          </button>
        </div>
        <button
          onClick={() => handleShare("copy")}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <Link2 className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-600">Copiar link de desafio</span>
        </button>
        <button onClick={onClose} className="mt-2 w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors">
          Agora não
        </button>
      </motion.div>
    </div>
  );
}

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
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        <Clock className="w-4 h-4 mr-2" />
        Dados de evolução aparecerão após mais opiniões
      </div>
    );
  }

  const maxBars = 14;
  const displayData = chartData.slice(-maxBars);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#B91C1C]" /><span>{optionA || "Opção A"}</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#002B5C]" /><span>{optionB || "Opção B"}</span></div>
      </div>
      <div className="flex items-end gap-1 h-32">
        {displayData.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full flex flex-col gap-px" style={{ height: "100%" }}>
              <div className="bg-[#B91C1C] rounded-t-sm transition-all duration-500" style={{ height: `${d.pctA}%`, minHeight: d.pctA > 0 ? "2px" : "0" }} title={`${d.pctA}%`} />
              <div className="bg-[#002B5C] rounded-b-sm transition-all duration-500" style={{ height: `${d.pctB}%`, minHeight: d.pctB > 0 ? "2px" : "0" }} title={`${d.pctB}%`} />
            </div>
            <span className="text-[9px] text-gray-400 truncate w-full text-center">
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
  const [, navigate] = useLocation();
  const fingerprint = useFingerprint();
  const [shareOpen, setShareOpen] = useState(false);
  const [postVoteShareOpen, setPostVoteShareOpen] = useState(false);
  // Detectar se o usuário chegou via link de desafio
  const isChallenge = useMemo(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("challenge") === "1";
  }, []);
  const [votingFor, setVotingFor] = useState<"A" | "B" | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [justVotedChoice, setJustVotedChoice] = useState<"A" | "B" | null>(null);

  const { data: market, isLoading, error } = trpc.markets.bySlug.useQuery({ slug }, { enabled: !!slug });
  const { data: voteCheck } = trpc.markets.checkVote.useQuery({ marketId: market?.id ?? 0, fingerprint }, { enabled: !!market && !!fingerprint });
  const { data: history } = trpc.markets.voteHistory.useQuery({ marketId: market?.id ?? 0 }, { enabled: !!market });
  const { data: relatedMarkets } = trpc.markets.related.useQuery({ marketId: market?.id ?? 0, category: market?.category ?? "" }, { enabled: !!market });
  const { data: newsItems } = trpc.news.byMarket.useQuery({ marketId: market?.id ?? 0 }, { enabled: !!market });

  const utils = trpc.useUtils();
  const voteMutation = trpc.markets.vote.useMutation({
    onSuccess: (_result, variables) => {
      setJustVotedChoice(variables.choice);
      setShowConfirmation(true);
      setTimeout(() => {
        setShowConfirmation(false);
        // Abrir modal de compartilhamento pós-voto após a confirmação
        setPostVoteShareOpen(true);
      }, 2000);
      utils.markets.bySlug.invalidate({ slug });
      utils.markets.checkVote.invalidate({ marketId: market?.id ?? 0, fingerprint });
      utils.markets.voteHistory.invalidate({ marketId: market?.id ?? 0 });
    },
    onError: (err) => { toast.error(err.message || "Erro ao registrar opinião"); },
    onSettled: () => { setVotingFor(null); },
  });

  const handleVote = (choice: "A" | "B") => {
    if (!market || !fingerprint || voteCheck?.voted) return;
    setVotingFor(choice);
    voteMutation.mutate({ marketId: market.id, choice, fingerprint });
  };

  const hasVoted = voteCheck?.voted || justVotedChoice !== null;
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
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1a4971]" /></div>
        <Footer />
      </div>
    );
  }

  if (!market || error) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Enquete não encontrada</h1>
          <p className="text-gray-500">A enquete que você procura não existe ou foi desativada.</p>
          <Link href="/"><Button variant="outline" className="gap-2"><ArrowLeft className="w-4 h-4" />Voltar para a home</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const createdDate = market.createdAt ? new Date(market.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="container py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#1a4971] transition-colors">Mercados</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[market.category] || CATEGORY_COLORS.geral}`}>
                {CATEGORY_LABELS[market.category] || market.category}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-900 font-medium truncate max-w-[200px]">{market.title}</span>
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
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
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
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_COLORS[market.category] || CATEGORY_COLORS.geral}`}>
                        {CATEGORY_LABELS[market.category] || market.category}
                      </span>
                      {market.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Ativo
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{market.title}</h1>
                  </div>
                  <button onClick={() => setShareOpen(true)} className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors shrink-0" title="Compartilhar">
                    <Share2 className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                {market.description && <p className="text-gray-600 leading-relaxed mb-5">{market.description}</p>}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-500"><Users className="w-4 h-4" /><span className="font-semibold text-gray-900">{stats?.total ?? 0}</span><span>opiniões</span></div>
                  <div className="flex items-center gap-1.5 text-gray-500"><Calendar className="w-4 h-4" /><span>Criado em {createdDate}</span></div>
                  {market.endsAt && (
                    <div className="flex items-center gap-1.5 text-gray-500"><Clock className="w-4 h-4" /><span>Encerra em {new Date(market.endsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span></div>
                  )}
                </div>
                </div>
              </div>

              {/* Gráfico */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4"><BarChart3 className="w-5 h-5 text-[#1a4971]" /><h2 className="font-bold text-gray-900">Evolução das opiniões</h2></div>
                <VoteChart history={history || []} optionA={market.optionA} optionB={market.optionB} />
              </div>

              {/* Resultados */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-5"><TrendingUp className="w-5 h-5 text-[#1a4971]" /><h2 className="font-bold text-gray-900">Resultados em tempo real</h2></div>
                <div className="mb-6">
                  <div className="flex justify-between items-end mb-2">
                    <div><span className="text-3xl font-black text-[#B91C1C]">{stats?.pctA ?? 50}%</span><p className="text-sm text-gray-500 mt-0.5">{market.optionA}</p></div>
                    <div className="text-right"><span className="text-3xl font-black text-[#002B5C]">{stats?.pctB ?? 50}%</span><p className="text-sm text-gray-500 mt-0.5">{market.optionB}</p></div>
                  </div>
                  <div className="h-4 rounded-full bg-gray-100 overflow-hidden flex">
                    <motion.div className="bg-[#B91C1C] rounded-l-full" initial={{ width: "50%" }} animate={{ width: `${stats?.pctA ?? 50}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                    <motion.div className="bg-[#002B5C] rounded-r-full" initial={{ width: "50%" }} animate={{ width: `${stats?.pctB ?? 50}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{market.labelA}</p>
                    <p className="text-2xl font-bold text-[#B91C1C]">{stats?.countA ?? 0}</p>
                    <p className="text-xs text-gray-400">opiniões</p>
                  </div>
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{market.labelB}</p>
                    <p className="text-2xl font-bold text-[#002B5C]">{stats?.countB ?? 0}</p>
                    <p className="text-xs text-gray-400">opiniões</p>
                  </div>
                </div>
              </div>

              {/* News - Apenas a notícia mais recente */}
              {newsItems && newsItems.length > 0 && (() => {
                const latestNews = (newsItems as any[])[0]; // já ordenado por newsDate DESC no backend
                return (
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold text-white bg-[#B91C1C] px-2 py-0.5 rounded uppercase tracking-wider">News</span>
                      <h2 className="font-bold text-gray-900">Notícia Recente</h2>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed mb-3">{latestNews.contextText}</p>
                      <div className="flex items-center justify-between">
                        <a href={latestNews.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1a4971] hover:underline font-medium flex items-center gap-1">
                          <Link2 className="w-3 h-3" />{latestNews.sourceName}
                        </a>
                        {latestNews.newsDate && (
                          <span className="text-xs text-gray-400">
                            {new Date(latestNews.newsDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Mercados relacionados */}
              {relatedMarkets && relatedMarkets.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h2 className="font-bold text-gray-900 mb-4">Veja também</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relatedMarkets.map((rm: any) => (
                      <Link key={rm.id} href={`/mercado/${rm.slug}`} className="group flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#1a4971]/30 hover:bg-blue-50/30 transition-all">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1a4971] transition-colors line-clamp-2">{rm.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-gray-400">{rm.stats.total} opiniões</span>
                            <span className="text-xs font-medium text-[#B91C1C]">{rm.stats.pctA}%</span>
                            <span className="text-xs text-gray-300">vs</span>
                            <span className="text-xs font-medium text-[#002B5C]">{rm.stats.pctB}%</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1a4971] transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-1">Qual é a sua opinião?</h3>
                  <p className="text-sm text-gray-500 mb-5">Registre sua opinião de forma anônima</p>
                  <AnimatePresence mode="wait">
                    {showConfirmation ? (
                      <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col items-center py-6 gap-3">
                        <div className="relative">
                          <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                          <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ delay: 0.2 }} className="absolute -top-2 -right-2"><PartyPopper className="w-6 h-6 text-amber-500" /></motion.div>
                        </div>
                        <p className="font-bold text-emerald-600 text-lg">Opinião registrada!</p>
                        <p className="text-sm text-gray-500">Obrigado por participar</p>
                      </motion.div>
                    ) : hasVoted ? (
                      <motion.div key="voted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 mb-4">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-sm font-medium text-emerald-700">Você já opinou nesta enquete</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">{market.optionA}</span><span className="text-sm font-bold text-[#B91C1C]">{stats?.pctA ?? 50}%</span></div>
                          <div className="h-3 rounded-full bg-gray-100 overflow-hidden"><motion.div className="h-full bg-[#B91C1C] rounded-full" initial={{ width: 0 }} animate={{ width: `${stats?.pctA ?? 50}%` }} transition={{ duration: 0.6 }} /></div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">{market.optionB}</span><span className="text-sm font-bold text-[#002B5C]">{stats?.pctB ?? 50}%</span></div>
                          <div className="h-3 rounded-full bg-gray-100 overflow-hidden"><motion.div className="h-full bg-[#002B5C] rounded-full" initial={{ width: 0 }} animate={{ width: `${stats?.pctB ?? 50}%` }} transition={{ duration: 0.6 }} /></div>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-3">{stats?.total ?? 0} opiniões registradas</p>
                      </motion.div>
                    ) : (
                      <motion.div key="voting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <button onClick={() => handleVote("A")} disabled={votingFor !== null} className="w-full flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4 rounded-xl border-2 border-[#B91C1C]/30 bg-red-50/50 hover:bg-red-100/60 hover:border-[#B91C1C] transition-all group disabled:opacity-60">
                          <div className="text-left"><p className="font-bold text-[#B91C1C] text-base sm:text-lg">{market.optionA}</p><p className="text-xs text-gray-500">{market.labelA}</p></div>
                          {votingFor === "A" ? <Loader2 className="w-5 h-5 animate-spin text-[#B91C1C]" /> : <div className="w-8 h-8 rounded-full border-2 border-[#B91C1C]/30 group-hover:border-[#B91C1C] group-hover:bg-[#B91C1C]/10 transition-all" />}
                        </button>
                        <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400 font-medium">ou</span><div className="flex-1 h-px bg-gray-200" /></div>
                        <button onClick={() => handleVote("B")} disabled={votingFor !== null} className="w-full flex items-center justify-between px-3 py-3 sm:px-5 sm:py-4 rounded-xl border-2 border-[#002B5C]/30 bg-blue-50/50 hover:bg-blue-100/60 hover:border-[#002B5C] transition-all group disabled:opacity-60">
                          <div className="text-left"><p className="font-bold text-[#002B5C] text-base sm:text-lg">{market.optionB}</p><p className="text-xs text-gray-500">{market.labelB}</p></div>
                          {votingFor === "B" ? <Loader2 className="w-5 h-5 animate-spin text-[#002B5C]" /> : <div className="w-8 h-8 rounded-full border-2 border-[#002B5C]/30 group-hover:border-[#002B5C] group-hover:bg-[#002B5C]/10 transition-all" />}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-2">Compartilhe</h3>
                  <p className="text-sm text-gray-500 mb-4">Convide amigos para participar desta enquete</p>
                  <Button onClick={() => setShareOpen(true)} variant="outline" className="w-full gap-2"><Share2 className="w-4 h-4" />Compartilhar enquete</Button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-3">Sobre esta enquete</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium text-emerald-600">Ativo</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Categoria</span><span className="font-medium text-gray-900">{CATEGORY_LABELS[market.category] || market.category}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Criado em</span><span className="font-medium text-gray-900">{createdDate}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Total de opiniões</span><span className="font-medium text-gray-900">{stats?.total ?? 0}</span></div>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50/50 border border-amber-200/50 p-4">
                  <p className="text-xs text-amber-700 leading-relaxed">
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
        <SharePopup open={shareOpen} onClose={() => setShareOpen(false)} title={market.title} slug={market.slug} />
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
