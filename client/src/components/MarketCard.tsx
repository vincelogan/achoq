import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, TrendingUp, CheckCircle2, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVote } from "@/hooks/useVote";
import { SharePopup } from "@/components/SharePopup";
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
  const [localStats, setLocalStats] = useState(initialStats);
  const [shareOpen, setShareOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const { fingerprint, vote, hasVoted, myChoice, votingChoice, isPending } = useVote({
    marketId,
    onVoted: (_choice, stats) => {
      setLocalStats(stats);
      // Feedback visual antes de transicionar para os resultados
      setShowConfirmation(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfirmation(false), 2200);
      setTimeout(() => setShowConfetti(false), 1000);
    },
  });

  const handleVote = (choice: "A" | "B") => vote(choice);

  const shareText = `No AchoQ: "${title}" — ${localStats.pctA}% acham ${optionA} vs ${localStats.pctB}% acham ${optionB}. E você?`;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/mercado/${slug}` : "";

  // Cores via tokens CSS (respeitam dark mode)
  const colorA = "var(--vote-a)";
  const colorB = "var(--vote-b)";

  return (
    <div className={`relative bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col ${hero ? "w-full" : ""}`}>
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
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{category}</span>
        </div>
        <div className="flex items-center gap-3">
          {endsAt && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Encerra {new Date(endsAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>{localStats.total.toLocaleString("pt-BR")} opiniões</span>
          </div>
        </div>
      </div>

      {/* Corpo do card */}
      <div className={`flex-1 flex flex-col ${hero ? "p-6 md:p-8" : "p-5"}`}>
        <Link href={`/mercado/${slug}`}>
          <h3 className={`font-bold text-foreground mb-3 hover:text-brand transition-colors cursor-pointer ${hero ? "text-2xl md:text-3xl" : "text-lg"}`}>
            {title}
          </h3>
        </Link>

        {/* Ticker de notícias scrolling */}
        {tickerItems && tickerItems.length > 0 && (
          <div className="mb-4 overflow-hidden rounded-lg bg-muted border border-border/50 px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-bold text-white bg-vote-a px-1.5 py-0.5 rounded uppercase tracking-wider">News</span>
              <div className="overflow-hidden flex-1">
                <div className="animate-marquee whitespace-nowrap text-xs text-muted-foreground">
                  {tickerItems.map((item, idx) => (
                    <span key={idx}>
                      {item.tickerText}
                      <span className="text-muted-foreground ml-1">({item.sourceName})</span>
                      {idx < tickerItems.length - 1 && <span className="mx-4 text-muted-foreground/70">|</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Estado: Confirmação de voto (feedback visual) */}
          {showConfirmation ? (
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
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.25 }}
                    >
                      <CheckCircle2 className="w-9 h-9 text-emerald-600 dark:text-emerald-400" />
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
                  <p className="text-lg font-bold text-foreground">Opinião registrada!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Você escolheu{" "}
                    <span
                      className="font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: myChoice === "A" ? "color-mix(in srgb, var(--vote-a) 10%, transparent)" : "color-mix(in srgb, var(--vote-b) 10%, transparent)",
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
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
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

          ) : hasVoted ? (            <motion.div
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
                  className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2.5 rounded-lg border border-emerald-500/30"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">Sua opinião:</span>
                  <span
                    className="font-bold text-sm px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: myChoice === "A" ? "color-mix(in srgb, var(--vote-a) 14%, transparent)" : "color-mix(in srgb, var(--vote-b) 14%, transparent)",
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
                    <div className="text-xs font-medium text-muted-foreground uppercase">{optionA}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: colorB }}>{localStats.pctB}%</div>
                    <div className="text-xs font-medium text-muted-foreground uppercase">{optionB}</div>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
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

                <div className="text-xs text-center text-muted-foreground">
                  {localStats.total.toLocaleString("pt-BR")} opiniões registradas
                </div>
              </div>

              {/* Botão compartilhar */}
              <div className="flex justify-end pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-muted-foreground hover:bg-muted text-xs"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Compartilhar
                </Button>
              </div>
            </motion.div>
          ) : (

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
                disabled={isPending || !fingerprint}
                className={`group w-full border-2 border-vote-a transition-all duration-200 rounded-lg px-3 py-2.5 sm:p-4 flex justify-between items-center disabled:cursor-not-allowed ${
                  votingChoice === "A"
                    ? "bg-vote-a/20 scale-[0.98]"
                    : votingChoice === "B"
                    ? "opacity-40"
                    : "bg-vote-a/5 hover:bg-vote-a/10"
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-vote-a">
                    {votingChoice === "A" && isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {optionA}
                      </span>
                    ) : (
                      optionA
                    )}
                  </span>
                  <span className="text-xs text-vote-a/70">{labelA}</span>
                </div>
                <div className="bg-vote-a/10 text-vote-a px-2.5 py-1 sm:px-4 sm:py-2 rounded-md font-mono font-bold text-sm shrink-0">
                  {localStats.pctA}%
                </div>
              </button>

              {/* Botão Opção B */}
              <button
                onClick={() => handleVote("B")}
                disabled={isPending || !fingerprint}
                className={`group w-full border-2 border-vote-b transition-all duration-200 rounded-lg px-3 py-2.5 sm:p-4 flex justify-between items-center disabled:cursor-not-allowed ${
                  votingChoice === "B"
                    ? "bg-vote-b/20 scale-[0.98]"
                    : votingChoice === "A"
                    ? "opacity-40"
                    : "bg-vote-b/5 hover:bg-vote-b/10"
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-vote-b">
                    {votingChoice === "B" && isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {optionB}
                      </span>
                    ) : (
                      optionB
                    )}
                  </span>
                  <span className="text-xs text-vote-b/70">{labelB}</span>
                </div>
                <div className="bg-vote-b/10 text-vote-b px-2.5 py-1 sm:px-4 sm:py-2 rounded-md font-mono font-bold text-sm shrink-0">
                  {localStats.pctB}%
                </div>
              </button>

              {/* Botão compartilhar */}
              <div className="flex justify-end pt-2 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-muted-foreground hover:bg-muted text-xs"
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
