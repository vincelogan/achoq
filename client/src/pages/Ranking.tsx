import InstitutionalLayout from "@/components/InstitutionalLayout";
import { trpc } from "@/lib/trpc";
import { Trophy, TrendingUp, Info, Loader2, Medal, Star, Zap, Target, Crown, Edit3, Check, X } from "lucide-react";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import { useFingerprint } from "@/hooks/useFingerprint";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Tab = "acertadores" | "enquetes";

// ─── Medalha por posição ──────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-muted-foreground" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
  return <span className="text-lg font-black font-mono text-muted-foreground/70">#{rank}</span>;
}

// ─── Barra de acurácia ────────────────────────────────────────────────────────
function AccuracyBar({ accuracy }: { accuracy: number }) {
  const color = accuracy >= 70 ? "bg-emerald-500" : accuracy >= 50 ? "bg-blue-500" : "bg-orange-400";
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${accuracy}%` }} />
      </div>
      <span className="text-xs font-semibold text-muted-foreground w-8 text-right">{accuracy}%</span>
    </div>
  );
}

// ─── Card do usuário no ranking ───────────────────────────────────────────────
// Molduras compradas na loja de Qs (aplicadas ao redor do card)
const FRAME_CLASSES: Record<string, string> = {
  "frame-bronze": "border-amber-600/60 border-2",
  "frame-prata": "border-slate-400/70 border-2",
  "frame-ouro": "border-qs border-2 shadow-[0_0_12px_rgba(217,119,6,0.25)]",
  "frame-fogo": "border-orange-500/80 border-2 shadow-[0_0_12px_rgba(249,115,22,0.3)]",
};

function RankingCard({
  entry,
  isMe,
}: {
  entry: { rank: number; displayName: string; totalVotes: number; correctVotes: number; accuracy: number; points: number; streak: number; maxStreak: number; equippedFrame?: string | null; equippedTitle?: string | null };
  isMe: boolean;
}) {
  const frameClass = entry.equippedFrame ? FRAME_CLASSES[entry.equippedFrame] : null;
  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all ${
      frameClass
        ? `${frameClass} bg-card`
        : isMe
        ? "border-vote-b bg-vote-b/10 shadow-sm"
        : entry.rank <= 3
        ? "border-yellow-500/40 bg-yellow-500/5"
        : "border-border bg-card hover:border-muted-foreground/40"
    }`}>
      <div className="w-8 flex justify-center shrink-0">
        <RankBadge rank={entry.rank} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground truncate">{entry.displayName}</span>
          {entry.equippedTitle && (
            <span className="text-[10px] font-bold text-qs bg-qs/10 border border-qs/30 px-1.5 py-0.5 rounded-full shrink-0">
              {entry.equippedTitle}
            </span>
          )}
          {isMe && (
            <span className="text-[10px] font-bold bg-vote-b text-white px-1.5 py-0.5 rounded-full shrink-0">
              VOCÊ
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground">{entry.totalVotes} votos</span>
          {entry.streak > 1 && (
            <span className="text-xs text-orange-500 flex items-center gap-0.5">
              <Zap className="w-3 h-3" />{entry.streak} seguidos
            </span>
          )}
        </div>
      </div>
      <div className="hidden sm:block">
        <AccuracyBar accuracy={entry.accuracy} />
      </div>
      <div className="text-right shrink-0">
        <div className="text-lg font-black text-vote-b">{entry.points}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">pts</div>
      </div>
    </div>
  );
}

// ─── Painel "Minha Posição" ───────────────────────────────────────────────────
function MyPositionPanel({ fingerprint }: { fingerprint: string }) {
  const utils = trpc.useUtils();
  const { data: myPos } = trpc.ranking.myPosition.useQuery(
    { fingerprint },
    { enabled: !!fingerprint }
  );
  const setNicknameMutation = trpc.ranking.setNickname.useMutation({
    onSuccess: () => {
      toast.success("Apelido salvo!");
      setEditing(false);
      utils.ranking.top.invalidate();
      utils.ranking.myPosition.invalidate({ fingerprint });
    },
    onError: () => toast.error("Apelido inválido."),
  });

  const [editing, setEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");

  const handleSave = () => {
    if (!nicknameInput.trim()) return;
    setNicknameMutation.mutate({ fingerprint, nickname: nicknameInput.trim() });
  };

  if (!myPos) return null;

  return (
    <div className="mb-8 bg-gradient-to-r from-vote-b to-brand rounded-2xl p-5 text-white">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-blue-200 text-sm font-medium mb-1">Sua posição</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">#{myPos.position}</span>
            <span className="text-blue-200 text-sm">no ranking global</span>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-black">{myPos.points}</div>
            <div className="text-blue-200 text-xs uppercase tracking-wide">pontos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black">{myPos.accuracy}%</div>
            <div className="text-blue-200 text-xs uppercase tracking-wide">acurácia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-black">{myPos.streak}</div>
            <div className="text-blue-200 text-xs uppercase tracking-wide">sequência</div>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-blue-400/30">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              value={nicknameInput}
              onChange={e => setNicknameInput(e.target.value)}
              placeholder="Seu apelido no ranking..."
              className="bg-card/10 border-white/20 text-white placeholder:text-blue-200 h-8 text-sm"
              maxLength={32}
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
            <button onClick={handleSave} className="p-1.5 rounded-lg bg-card/20 hover:bg-card/30 transition-colors">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg bg-card/20 hover:bg-card/30 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setNicknameInput(myPos.nickname || ""); setEditing(true); }}
            className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm"
          >
            <Edit3 className="w-3.5 h-3.5" />
            {myPos.nickname ? `Apelido: ${myPos.nickname}` : "Definir apelido no ranking"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Ranking() {
  const [tab, setTab] = useState<Tab>("acertadores");
  const fingerprint = useFingerprint();

  const { data: markets, isLoading: loadingMarkets } = trpc.markets.list.useQuery();
  const { data: topRanking, isLoading: loadingRanking } = trpc.ranking.top.useQuery();

  const sortedMarkets = useMemo(
    () => markets?.slice().sort((a, b) => b.stats.total - a.stats.total) ?? [],
    [markets]
  );

  return (
    <InstitutionalLayout
      title="Ranking AchoQ"
      subtitle="Veja quem mais acerta as previsões e acompanhe as enquetes mais movimentadas."
      badge="Comunidade"
      breadcrumbs={[{ label: "Ranking" }]}
    >
      {/* Aviso legal */}
      <div className="mb-8 bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
          O ranking reflete engajamento e acurácia de opiniões — não representa capacidade preditiva científica
          nem qualquer recompensa econômica.{" "}
          <Link href="/legal" className="underline">Saiba mais</Link>.
        </p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-8 bg-muted p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab("acertadores")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "acertadores"
              ? "bg-card text-vote-b shadow-sm"
              : "text-muted-foreground hover:text-foreground/80"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Melhores Acertadores
        </button>
        <button
          onClick={() => setTab("enquetes")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "enquetes"
              ? "bg-card text-vote-b shadow-sm"
              : "text-muted-foreground hover:text-foreground/80"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Enquetes em Atividade
        </button>
      </div>

      {/* ─── Aba: Melhores Acertadores ─── */}
      {tab === "acertadores" && (
        <div>
          {fingerprint && <MyPositionPanel fingerprint={fingerprint} />}

          {/* Como funciona a pontuação */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { icon: <Target className="w-4 h-4 text-emerald-600" />, label: "+10 pts", desc: "por acerto" },
              { icon: <Star className="w-4 h-4 text-blue-600" />, label: "+2 pts", desc: "por participação" },
              { icon: <Zap className="w-4 h-4 text-orange-500" />, label: "Sequência", desc: "acertos seguidos" },
            ].map(item => (
              <div key={item.label} className="bg-card border border-border rounded-xl p-3 text-center">
                <div className="flex justify-center mb-1">{item.icon}</div>
                <div className="font-bold text-foreground text-sm">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Lista do ranking */}
          {loadingRanking ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm">Carregando ranking...</span>
            </div>
          ) : !topRanking || topRanking.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">O ranking será populado conforme as enquetes forem resolvidas.</p>
              <p className="text-xs mt-1 text-muted-foreground/70">Vote nas enquetes ativas para garantir sua posição!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topRanking.map((entry: { rank: number; displayName: string; totalVotes: number; correctVotes: number; accuracy: number; points: number; streak: number; maxStreak: number }) => (
                <RankingCard
                  key={entry.rank}
                  entry={entry}
                  isMe={false}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Aba: Enquetes em Atividade ─── */}
      {tab === "enquetes" && (
        <div>
          {loadingMarkets ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm">Carregando dados...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMarkets.map((market, index) => (
                <Link
                  key={market.id}
                  href={`/mercado/${market.slug}`}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center gap-4 hover:border-muted-foreground/40 hover:shadow-md transition-all duration-200 cursor-pointer block"
                >
                  <div className="flex items-center gap-4 md:w-12 shrink-0">
                    <span className={`text-2xl font-black font-mono ${
                      index === 0 ? "text-yellow-500" :
                      index === 1 ? "text-muted-foreground" :
                      index === 2 ? "text-amber-600" :
                      "text-muted-foreground/70"
                    }`}>
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{market.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">{market.category}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-xs text-muted-foreground">{market.stats.total} opiniões</span>
                    </div>
                  </div>
                  <div className="flex gap-4 md:gap-6 shrink-0">
                    <div className="text-center">
                      <div className="text-base font-bold text-vote-a">{market.stats.pctA}%</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[60px]">{market.optionA}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-vote-b">{market.stats.pctB}%</div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[60px]">{market.optionB}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </InstitutionalLayout>
  );
}
