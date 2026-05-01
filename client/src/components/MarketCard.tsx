import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, TrendingUp, CheckCircle2, Loader2, Link2, X, PartyPopper, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";
import { toast } from "sonner";
import { Link } from "wouter";

type MarketCardProps = {
  marketId: number;
  slug: string;
  title: string;
  category: string;
  optionA: string;
  optionB: string;
  labelA: string;
  labelB: string;
  initialStats: {
    countA: number;
    countB: number;
    total: number;
    pctA: number;
    pctB: number;
  };
  hero?: boolean;
  endsAt?: string | Date | null;
  imageUrl?: string | null;
  tickerItems?: Array<{ tickerText: string; sourceName: string }> | null;
};

function SharePopup({
  open,
  onClose,
  shareText,
  shareUrl,
}: {
  open: boolean;
  onClose: () => void;
  shareText: string;
  shareUrl: string;
}) {
  if (!open) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado!");
      onClose();
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      toast.success("Link copiado!");
      onClose();
    }
  };

  const handleWhatsApp = () => {
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`,
      "_blank"
    );
    onClose();
  };

  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      "_blank"
    );
    onClose();
  };

  const handleInstagram = () => {
    navigator.clipboard
      .writeText(shareText + "\n\n" + shareUrl)
      .then(() => {
        toast.success("Texto copiado! Cole no Instagram Stories ou Direct.");
      })
      .catch(() => {
        toast.info("Copie o link acima e cole no Instagram.");
      });
    onClose();
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">Compartilhar</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-[#25D366]/5 hover:border-[#25D366]/30 transition-all group"
            >
              <svg className="w-6 h-6 text-[#25D366] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span className="font-medium text-sm text-gray-700 group-hover:text-[#25D366]">WhatsApp</span>
            </button>
            <button
              onClick={handleFacebook}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-[#1877F2]/5 hover:border-[#1877F2]/30 transition-all group"
            >
              <svg className="w-6 h-6 text-[#1877F2] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="font-medium text-sm text-gray-700 group-hover:text-[#1877F2]">Facebook</span>
            </button>
            <button
              onClick={handleInstagram}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-[#E4405F]/5 hover:border-[#E4405F]/30 transition-all group"
            >
              <svg className="w-6 h-6 text-[#E4405F] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z"/>
              </svg>
              <span className="font-medium text-sm text-gray-700 group-hover:text-[#E4405F]">Instagram</span>
            </button>
            <button
              onClick={handleTwitter}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-black/5 hover:border-black/20 transition-all group"
            >
              <svg className="w-6 h-6 text-black shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="font-medium text-sm text-gray-700 group-hover:text-black">X (Twitter)</span>
            </button>
          </div>
          <div className="px-5 pb-5">
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-all text-gray-700"
            >
              <Link2 className="w-4 h-4" />
              <span className="font-medium text-sm">Copiar link</span>
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

/** Mini confetti burst — lightweight CSS-only particles */
function ConfettiBurst() {
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360;
    const distance = 40 + Math.random() * 30;
    const colors = ["#B91C1C", "#002B5C", "#16a34a", "#eab308", "#7c3aed", "#0ea5e9"];
    const color = colors[i % colors.length];
    const size = 4 + Math.random() * 4;
    return { angle, distance, color, size, delay: Math.random() * 0.15 };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            left: "50%",
            top: "50%",
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0.3,
          }}
          transition={{ duration: 0.7, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default function MarketCard({
  marketId,
  slug,
  title,
  category,
  optionA,
  optionB,
  labelA,
  labelB,
  initialStats,
  hero = false,
  endsAt,
  imageUrl,
  tickerItems,
}: MarketCardProps) {
  const fingerprint = useFingerprint();
  const [localStats, setLocalStats] = useState(initialStats);
  const [hasVoted, setHasVoted] = useState(false);
  const [myChoice, setMyChoice] = useState<"A" | "B" | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [votingChoice, setVotingChoice] = useState<"A" | "B" | null>(null);

  // Verificar se já votou neste mercado
  const { data: checkData } = trpc.markets.checkVote.useQuery(
    { marketId, fingerprint },
    { enabled: !!fingerprint, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (checkData?.voted) {
      setHasVoted(true);
      const savedChoice = localStorage.getItem(`achoq_vote_${marketId}`);
      if (savedChoice === "A" || savedChoice === "B") {
        setMyChoice(savedChoice);
      }
    }
  }, [checkData, marketId]);

  // Mutation para votar
  const voteMutation = trpc.markets.vote.useMutation({
    onSuccess: (data) => {
      setLocalStats(data.stats);
      // Mostrar feedback visual antes de transicionar
      setShowConfirmation(true);
      setShowConfetti(true);
      // Após 2 segundos, transicionar para os resultados
      setTimeout(() => {
        setHasVoted(true);
        setShowConfirmation(false);
      }, 2200);
      // Confetti desaparece sozinho via animação
      setTimeout(() => setShowConfetti(false), 1000);
    },
    onError: (err) => {
      setVotingChoice(null);
      if (err.message.includes("já votou")) {
        setHasVoted(true);
        toast.info("Você já opinou nesta enquete.");
      } else {
        toast.error("Erro ao registrar opinião. Tente novamente.");
      }
    },
  });

  const handleVote = (choice: "A" | "B") => {
    if (!fingerprint || hasVoted || voteMutation.isPending) return;
    setMyChoice(choice);
    setVotingChoice(choice);
    localStorage.setItem(`achoq_vote_${marketId}`, choice);
    voteMutation.mutate({ marketId, choice, fingerprint });
  };

  const shareText = `No AchoQ: "${title}" — ${localStats.pctA}% acham ${optionA} vs ${localStats.pctB}% acham ${optionB}. E você?`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/mercado/${slug}` : "";

  const colorA = "#B91C1C";
  const colorB = "#002B5C";

  return (
    <div className={`relative bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col ${hero ? "w-full" : ""}`}>
      {/* Confetti burst */}
      <AnimatePresence>
        {showConfetti && <ConfettiBurst />}
      </AnimatePresence>

      {/* Imagem da enquete */}
      {imageUrl && (
        <Link href={`/mercado/${slug}`}>
          <div className={`relative overflow-hidden ${hero ? "h-40 md:h-52" : "h-28"}`}>
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </Link>
      )}

      {/* Header do card */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{category}</span>
        </div>
        <div className="flex items-center gap-3">
          {endsAt && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>Encerra {new Date(endsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <TrendingUp className="w-3 h-3" />
            <span>{localStats.total.toLocaleString("pt-BR")} opiniões</span>
          </div>
        </div>
      </div>

      {/* Corpo do card */}
      <div className={`flex-1 flex flex-col ${hero ? "p-6 md:p-8" : "p-5"}`}>
        <Link href={`/mercado/${slug}`}>
          <h3 className={`font-bold text-gray-900 mb-3 hover:text-[#1a4971] transition-colors cursor-pointer ${hero ? "text-2xl md:text-3xl" : "text-lg"}`}>
            {title}
          </h3>
        </Link>

        {/* Ticker de notícias scrolling */}
        {tickerItems && tickerItems.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-lg bg-gray-50 border border-gray-100 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-bold text-white bg-[#B91C1C] px-1.5 py-0.5 rounded uppercase tracking-wider">News</span>
              <div className="overflow-hidden flex-1">
                <div className="animate-marquee whitespace-nowrap text-xs text-gray-600">
                  {tickerItems.map((item, idx) => (
                    <span key={idx}>
                      {item.tickerText}
                      <span className="text-gray-400 ml-1">({item.sourceName})</span>
                      {idx < tickerItems.length - 1 && <span className="mx-4 text-gray-300">|</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Estado: Confirmação de voto (feedback visual) */}
          {showConfirmation && !hasVoted ? (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mt-auto"
            >
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                {/* Ícone animado de sucesso */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                >
                  <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.25 }}
                    >
                      <CheckCircle2 className="w-9 h-9 text-green-600" />
                    </motion.div>
                  </div>
                </motion.div>

                {/* Texto de confirmação */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-center"
                >
                  <p className="text-lg font-bold text-gray-900">Opinião registrada!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Você escolheu{" "}
                    <span
                      className="font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: myChoice === "A" ? "#B91C1C15" : "#002B5C15",
                        color: myChoice === "A" ? colorA : colorB,
                      }}
                    >
                      {myChoice === "A" ? optionA : optionB}
                    </span>
                  </p>
                </motion.div>

                {/* Barra de progresso animada */}
                <motion.div
                  initial={{ opacity: 0, width: "60%" }}
                  animate={{ opacity: 1, width: "100%" }}
                  transition={{ delay: 0.5 }}
                  className="w-full max-w-xs"
                >
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <motion.div
                      className="h-full rounded-l-full"
                      style={{ backgroundColor: colorA }}
                      initial={{ width: "50%" }}
                      animate={{ width: `${localStats.pctA}%` }}
                      transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                    />
                    <motion.div
                      className="h-full rounded-r-full"
                      style={{ backgroundColor: colorB }}
                      initial={{ width: "50%" }}
                      animate={{ width: `${localStats.pctB}%` }}
                      transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <motion.span
                      className="text-xs font-bold"
                      style={{ color: colorA }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      {localStats.pctA}% {optionA}
                    </motion.span>
                    <motion.span
                      className="text-xs font-bold"
                      style={{ color: colorB }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      {localStats.pctB}% {optionB}
                    </motion.span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

          ) : !hasVoted ? (
            <motion.div
              key="voting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-auto space-y-3"
            >
              {/* Botão Opção A */}
              <button
                onClick={() => handleVote("A")}
                disabled={voteMutation.isPending || !fingerprint}
                className={`group w-full border-2 border-[#B91C1C] transition-all duration-200 rounded-lg px-3 py-2.5 sm:p-4 flex justify-between items-center disabled:cursor-not-allowed ${
                  votingChoice === "A"
                    ? "bg-[#B91C1C]/20 scale-[0.98]"
                    : votingChoice === "B"
                    ? "opacity-40"
                    : "bg-[#B91C1C]/5 hover:bg-[#B91C1C]/10"
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-[#B91C1C]">
                    {votingChoice === "A" && voteMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {optionA}
                      </span>
                    ) : (
                      optionA
                    )}
                  </span>
                  <span className="text-xs text-[#B91C1C]/70">{labelA}</span>
                </div>
                <div className="bg-[#B91C1C]/10 text-[#B91C1C] px-2.5 py-1 sm:px-4 sm:py-2 rounded-md font-mono font-bold text-sm shrink-0">
                  {localStats.pctA}%
                </div>
              </button>

              {/* Botão Opção B */}
              <button
                onClick={() => handleVote("B")}
                disabled={voteMutation.isPending || !fingerprint}
                className={`group w-full border-2 border-[#002B5C] transition-all duration-200 rounded-lg px-3 py-2.5 sm:p-4 flex justify-between items-center disabled:cursor-not-allowed ${
                  votingChoice === "B"
                    ? "bg-[#002B5C]/20 scale-[0.98]"
                    : votingChoice === "A"
                    ? "opacity-40"
                    : "bg-[#002B5C]/5 hover:bg-[#002B5C]/10"
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-[#002B5C]">
                    {votingChoice === "B" && voteMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {optionB}
                      </span>
                    ) : (
                      optionB
                    )}
                  </span>
                  <span className="text-xs text-[#002B5C]/70">{labelB}</span>
                </div>
                <div className="bg-[#002B5C]/10 text-[#002B5C] px-2.5 py-1 sm:px-4 sm:py-2 rounded-md font-mono font-bold text-sm shrink-0">
                  {localStats.pctB}%
                </div>
              </button>

              {/* Botão compartilhar */}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Compartilhar
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-auto space-y-5"
            >
              {/* Badge da escolha do usuário */}
              {myChoice && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 bg-green-50 px-4 py-2.5 rounded-lg border border-green-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-sm text-green-800">Sua opinião:</span>
                  <span
                    className="font-bold text-sm px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: myChoice === "A" ? "#B91C1C20" : "#002B5C20",
                      color: myChoice === "A" ? colorA : colorB,
                    }}
                  >
                    {myChoice === "A" ? optionA : optionB}
                  </span>
                </motion.div>
              )}

              {/* Resultados */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-2xl font-bold" style={{ color: colorA }}>{localStats.pctA}%</div>
                    <div className="text-xs font-medium text-gray-500 uppercase">{optionA}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: colorB }}>{localStats.pctB}%</div>
                    <div className="text-xs font-medium text-gray-500 uppercase">{optionB}</div>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: colorA }}
                    initial={{ width: 0 }}
                    animate={{ width: `${localStats.pctA}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <motion.div
                    className="h-full"
                    style={{ backgroundColor: colorB }}
                    initial={{ width: 0 }}
                    animate={{ width: `${localStats.pctB}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>

                <div className="text-xs text-center text-gray-400">
                  {localStats.total.toLocaleString("pt-BR")} opiniões registradas
                </div>
              </div>

              {/* Botão compartilhar */}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Compartilhar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Popup de compartilhamento */}
      <AnimatePresence>
        {shareOpen && (
          <SharePopup
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            shareText={shareText}
            shareUrl={shareUrl}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
