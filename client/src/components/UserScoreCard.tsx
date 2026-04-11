import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";
import { Trophy, Target, CheckCircle2, XCircle, Clock, ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function UserScoreCard() {
  const fingerprint = useFingerprint();
  const { data: score, isLoading: scoreLoading } = trpc.score.get.useQuery(
    { fingerprint },
    { enabled: !!fingerprint }
  );
  const { data: history, isLoading: historyLoading } = trpc.score.history.useQuery(
    { fingerprint },
    { enabled: !!fingerprint }
  );

  const isLoading = scoreLoading || historyLoading;
  const hasVotes = history && history.length > 0;

  if (!fingerprint || isLoading) {
    return null;
  }

  if (!hasVotes) {
    return null;
  }

  const resolvedVotes = history?.filter((v: any) => v.isResolved) ?? [];
  const pendingVotes = history?.filter((v: any) => !v.isResolved) ?? [];

  return (
    <section className="w-full py-8 md:py-12 bg-white border-t border-gray-100">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Seu Score de Acerto
          </h2>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-black text-[#1a4971]">
                {score?.score ?? 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Taxa de Acerto</p>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600">
                {score?.correct ?? 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Acertos</p>
            </div>
            <div>
              <div className="text-3xl font-black text-gray-400">
                {score?.totalResolved ?? 0}
              </div>
              <p className="text-xs text-gray-500 mt-1">Resolvidas</p>
            </div>
          </div>

          {/* Barra de progresso */}
          {(score?.totalResolved ?? 0) > 0 && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${score?.score ?? 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Histórico de votos */}
        <div className="space-y-2">
          {/* Enquetes resolvidas */}
          {resolvedVotes.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Enquetes Resolvidas ({resolvedVotes.length})
              </h3>
              <div className="space-y-2">
                {resolvedVotes.map((vote: any) => (
                  <Link
                    key={vote.marketId}
                    href={`/mercado/${vote.slug}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all group"
                  >
                    {vote.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#1a4971] transition-colors">
                        {vote.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        Você votou: {vote.userChoice === "A" ? vote.optionA : vote.optionB}
                        {" · "}
                        Resultado: {vote.resolvedChoice === "A" ? vote.optionA : vote.optionB}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        vote.isCorrect
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-red-50 text-red-500"
                      }`}
                    >
                      {vote.isCorrect ? "Acertou" : "Errou"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1a4971] shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Enquetes pendentes */}
          {pendingVotes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Aguardando Resultado ({pendingVotes.length})
              </h3>
              <div className="space-y-2">
                {pendingVotes.map((vote: any) => (
                  <Link
                    key={vote.marketId}
                    href={`/mercado/${vote.slug}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all group"
                  >
                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#1a4971] transition-colors">
                        {vote.title}
                      </p>
                      <p className="text-xs text-gray-400">
                        Você votou: {vote.userChoice === "A" ? vote.optionA : vote.optionB}
                      </p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                      Pendente
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1a4971] shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
