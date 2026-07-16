import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";

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
}: {
  marketId: number | undefined;
  onVoted?: (choice: Choice, stats: VoteStats) => void;
}) {
  const fingerprint = useFingerprint();
  const [votingChoice, setVotingChoice] = useState<Choice | null>(null);
  const [justVoted, setJustVoted] = useState<Choice | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [myChoice, setMyChoice] = useState<Choice | null>(null);

  const enabled = !!marketId && !!fingerprint;
  const { data: checkData } = trpc.markets.checkVote.useQuery(
    { marketId: marketId ?? 0, fingerprint },
    { enabled, refetchOnWindowFocus: false }
  );

  useEffect(() => {
    if (checkData?.voted && marketId) {
      setAlreadyVoted(true);
      const saved = localStorage.getItem(`achoq_vote_${marketId}`);
      if (saved === "A" || saved === "B") setMyChoice(saved);
    }
  }, [checkData, marketId]);

  const voteMutation = trpc.markets.vote.useMutation({
    onSuccess: (data, variables) => {
      if (marketId) localStorage.setItem(`achoq_vote_${marketId}`, variables.choice);
      setJustVoted(variables.choice);
      setMyChoice(variables.choice);
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
    if (!enabled || alreadyVoted || justVoted || voteMutation.isPending) return;
    setVotingChoice(choice);
    setMyChoice(choice);
    voteMutation.mutate({ marketId: marketId!, choice, fingerprint });
  };

  return {
    fingerprint,
    vote,
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
