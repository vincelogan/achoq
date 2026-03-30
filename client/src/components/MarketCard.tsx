import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, TrendingUp, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";
import { toast } from "sonner";

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
  /** Se true, exibe como card hero (maior) */
  hero?: boolean;
};

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
}: MarketCardProps) {
  const fingerprint = useFingerprint();
  const [localStats, setLocalStats] = useState(initialStats);
  const [hasVoted, setHasVoted] = useState(false);
  const [myChoice, setMyChoice] = useState<"A" | "B" | null>(null);

  // Verificar se já votou neste mercado
  const { data: checkData } = trpc.markets.checkVote.useQuery(
    { marketId, fingerprint },
    { enabled: !!fingerprint, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (checkData?.voted) {
      setHasVoted(true);
      // Recuperar a escolha salva localmente
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
      setHasVoted(true);
      toast.success("Voto registrado com sucesso!");
    },
    onError: (err) => {
      if (err.message.includes("já votou")) {
        setHasVoted(true);
        toast.info("Você já votou neste mercado.");
      } else {
        toast.error("Erro ao registrar voto. Tente novamente.");
      }
    },
  });

  const handleVote = (choice: "A" | "B") => {
    if (!fingerprint || hasVoted || voteMutation.isPending) return;
    setMyChoice(choice);
    localStorage.setItem(`achoq_vote_${marketId}`, choice);
    voteMutation.mutate({ marketId, choice, fingerprint });
  };

  const shareText = `No AchoQ: "${title}" — ${localStats.pctA}% acham ${optionA} vs ${localStats.pctB}% acham ${optionB}. E você?`;
  const shareUrl = typeof window !== "undefined" ? window.location.origin : "https://achoq.com.br";

  const colorA = "#B91C1C"; // Vermelho para opção A (Esquerda / Não)
  const colorB = "#002B5C"; // Azul BTG para opção B (Direita / Sim)

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col ${hero ? "w-full" : ""}`}>
      {/* Header do card */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{category}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <TrendingUp className="w-3 h-3" />
          <span>{localStats.total.toLocaleString("pt-BR")} votos</span>
        </div>
      </div>

      {/* Corpo do card */}
      <div className={`flex-1 flex flex-col ${hero ? "p-6 md:p-8" : "p-5"}`}>
        <h3 className={`font-bold text-gray-900 mb-5 ${hero ? "text-2xl md:text-3xl" : "text-lg"}`}>
          {title}
        </h3>

        <AnimatePresence mode="wait">
          {!hasVoted ? (
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
                className="group w-full bg-white border border-gray-200 hover:border-[#B91C1C] hover:bg-[#B91C1C]/5 transition-all duration-200 rounded-lg p-4 flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-gray-900 group-hover:text-[#B91C1C] transition-colors">{optionA}</span>
                  <span className="text-xs text-gray-500">{labelA}</span>
                </div>
                <div className="bg-gray-50 group-hover:bg-[#B91C1C]/10 text-gray-700 group-hover:text-[#B91C1C] px-4 py-2 rounded-md font-mono font-bold transition-colors">
                  {localStats.pctA}%
                </div>
              </button>

              {/* Botão Opção B */}
              <button
                onClick={() => handleVote("B")}
                disabled={voteMutation.isPending || !fingerprint}
                className="group w-full bg-white border border-gray-200 hover:border-[#002B5C] hover:bg-[#002B5C]/5 transition-all duration-200 rounded-lg p-4 flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-gray-900 group-hover:text-[#002B5C] transition-colors">{optionB}</span>
                  <span className="text-xs text-gray-500">{labelB}</span>
                </div>
                <div className="bg-gray-50 group-hover:bg-[#002B5C]/10 text-gray-700 group-hover:text-[#002B5C] px-4 py-2 rounded-md font-mono font-bold transition-colors">
                  {localStats.pctB}%
                </div>
              </button>

              {voteMutation.isPending && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando voto...
                </div>
              )}
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
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Sua previsão:</span>
                  <span
                    className="font-bold text-sm px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: myChoice === "A" ? "#B91C1C20" : "#002B5C20",
                      color: myChoice === "A" ? colorA : colorB,
                    }}
                  >
                    {myChoice === "A" ? optionA : optionB}
                  </span>
                </div>
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
                  <div
                    className="h-full transition-all duration-1000"
                    style={{ width: `${localStats.pctA}%`, backgroundColor: colorA }}
                  />
                  <div
                    className="h-full transition-all duration-1000"
                    style={{ width: `${localStats.pctB}%`, backgroundColor: colorB }}
                  />
                </div>

                <div className="text-xs text-center text-gray-400">
                  {localStats.total.toLocaleString("pt-BR")} votos registrados
                </div>
              </div>

              {/* Botão compartilhar */}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs"
                  onClick={() =>
                    window.open(
                      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
                      "_blank"
                    )
                  }
                >
                  <Share2 className="mr-1.5 h-3.5 w-3.5" />
                  Compartilhar
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
