import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";
import { useAuth } from "@/hooks/useAuth";

const PENDING_VOTE_KEY = "achoq_pending_vote";

type PendingVote = { marketId: number; choice: Choice };

function readPendingVote(): PendingVote | null {
  try {
    const raw = sessionStorage.getItem(PENDING_VOTE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.marketId === "number" && (parsed.choice === "A" || parsed.choice === "B")) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writePendingVote(vote: PendingVote | null) {
  try {
    if (vote) sessionStorage.setItem(PENDING_VOTE_KEY, JSON.stringify(vote));
    else sessionStorage.removeItem(PENDING_VOTE_KEY);
  } catch {
    /* sessionStorage indisponível */
  }
}

type Choice = "A" | "B";

type VoteStats = {
  countA: number;
  countB: number;
  total: number;
  pctA: number;
  pctB: number;
};

/**
 * Lógica de voto unificada (antes duplicada e divergente entre MarketCard e
 * MarketDetail): checkVote, persistência da escolha em localStorage,
 * mutation com tratamento de "já opinou" e estado de pending por opção.
 */
export function useVote({
  marketId,
  onVoted,
  initialVoted,
}: {
  marketId: number | undefined;
  onVoted?: (choice: Choice, stats: VoteStats) => void;
  /**
   * Quando o chamador já sabe se o usuário votou (viewerHasVoted vindo do
   * markets.list), a query individual de checkVote é dispensada.
   */
  initialVoted?: boolean;
}) {
  const fingerprint = useFingerprint();
  const { isAuthenticated } = useAuth();
  const [votingChoice, setVotingChoice] = useState<Choice | null>(null);
  const [justVoted, setJustVoted] = useState<Choice | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(initialVoted === true);
  const [myChoice, setMyChoice] = useState<Choice | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  const canVote = !!marketId && !!fingerprint && isAuthenticated;
  // A query individual de checkVote só roda quando o chamador não informou
  // initialVoted (ex.: MarketDetail); na home o markets.list já respondeu.
  const checkEnabled = canVote && initialVoted === undefined;
  const { data: checkData } = trpc.markets.checkVote.useQuery(
    { marketId: marketId ?? 0, fingerprint },
    { enabled: checkEnabled, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if ((checkData?.voted || initialVoted) && marketId) {
      setAlreadyVoted(true);
      const saved = localStorage.getItem(`achoq_vote_${marketId}`);
      if (saved === "A" || saved === "B") setMyChoice(saved);
    }
  }, [checkData, initialVoted, marketId]);

  const utils = trpc.useUtils();
  const voteMutation = trpc.markets.vote.useMutation({
    onSuccess: (data, variables) => {
      if (marketId) localStorage.setItem(`achoq_vote_${marketId}`, variables.choice);
      setJustVoted(variables.choice);
      setMyChoice(variables.choice);
      // Recompensa em Qs (economia fictícia)
      const earned = (data as any).qsEarned as number | undefined;
      if (earned && earned > 0) {
        const streak = (data as any).dailyStreak as number | undefined;
        toast.success(`+${earned} Qs!`, {
          description:
            streak && streak > 1
              ? `Check-in de ${streak} dias seguidos. Veja seu saldo na carteira.`
              : "Obrigado por opinar. Veja seu saldo na carteira.",
        });
        utils.wallet.get.invalidate();
      }
      onVoted?.(variables.choice, data.stats);
    },
    onError: (err) => {
      setVotingChoice(null);
      if (err.message.includes("já opinou") || err.message.includes("já votou")) {
        setAlreadyVoted(true);
        toast.info("Você já opinou nesta enquete.");
      } else {
        toast.error("Erro ao registrar opinião. Tente novamente.");
      }
    },
    onSettled: () => {
      setVotingChoice(null);
    },
  });

  const vote = (choice: Choice) => {
    if (!marketId || alreadyVoted || justVoted || voteMutation.isPending) return;
    if (!isAuthenticated) {
      // Guarda a intenção e leva para o login; ao voltar autenticado, o
      // effect abaixo completa este mesmo voto automaticamente.
      writePendingVote({ marketId, choice });
      setNeedsAuth(true);
      return;
    }
    setVotingChoice(choice);
    setMyChoice(choice);
    voteMutation.mutate({ marketId, choice });
  };

  // Retoma um voto pendente (guardado antes de mandar para o login) assim
  // que a sessão autenticada estiver confirmada.
  useEffect(() => {
    if (!isAuthenticated || !marketId || alreadyVoted || justVoted || voteMutation.isPending) return;
    const pending = readPendingVote();
    if (!pending || pending.marketId !== marketId) return;
    writePendingVote(null);
    setVotingChoice(pending.choice);
    setMyChoice(pending.choice);
    voteMutation.mutate({ marketId, choice: pending.choice });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, marketId, alreadyVoted, justVoted]);

  return {
    fingerprint,
    vote,
    /** true quando o clique em votar precisa de login — abre o modal de entrada */
    needsAuth,
    dismissAuthPrompt: () => setNeedsAuth(false),
    /** true se o usuário já tinha votado OU acabou de votar */
    hasVoted: alreadyVoted || justVoted !== null,
    /** escolha do usuário (persistida em localStorage) */
    myChoice,
    /** opção com request em andamento (para spinner por botão) */
    votingChoice,
    isPending: voteMutation.isPending,
    /** true apenas para o voto feito nesta sessão de página */
    justVoted,
  };
}
