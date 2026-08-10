import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowDown, ArrowUp, Clock, Info, Loader2, Trophy } from "lucide-react";
import InstitutionalLayout from "@/components/InstitutionalLayout";
import { QCoin } from "@/components/QsBalance";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";

type Division = "bronze" | "prata" | "ouro" | "diamante";

const DIVISION_META: Record<Division, { label: string; emoji: string; chip: string }> = {
  bronze: { label: "Bronze", emoji: "🥉", chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  prata: { label: "Prata", emoji: "🥈", chip: "bg-muted text-foreground/80 border-border" },
  ouro: { label: "Ouro", emoji: "🥇", chip: "bg-qs/10 text-qs border-qs/30" },
  diamante: { label: "Diamante", emoji: "💎", chip: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" },
};

function Countdown({ endsAt }: { endsAt: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = new Date(endsAt).getTime() - Date.now();
      if (ms <= 0) {
        setLabel("Encerrando...");
        return;
      }
      const d = Math.floor(ms / 86_400_000);
      const h = Math.floor((ms % 86_400_000) / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setLabel(d > 0 ? `${d}d ${h}h ${m}min` : `${h}h ${m}min`);
    };
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [endsAt]);
  return <span className="font-mono font-bold tabular-nums">{label}</span>;
}

export default function Liga() {
  const fingerprint = useFingerprint();
  const [division, setDivision] = useState<Division | undefined>(undefined);

  useEffect(() => {
    document.title = "Liga Semanal | AchoQ";
  }, []);

  const { data: league, isLoading } = trpc.league.current.useQuery(
    { fingerprint: fingerprint || undefined, division },
    { enabled: !!fingerprint, refetchInterval: 60_000 }
  );

  const shown = (league?.division ?? "bronze") as Division;
  const standings = league?.standings ?? [];
  const promoteCount = standings.length >= 20 ? 10 : Math.max(1, Math.floor(standings.length * 0.2));

  return (
    <InstitutionalLayout
      title="Liga Semanal"
      subtitle="Ganhe Qs opinando e acertando previsões durante a semana. Os melhores de cada divisão sobem; os últimos descem. Zera toda segunda-feira."
      badge="Liga"
      breadcrumbs={[{ label: "Liga" }]}
    >
      {isLoading || !league ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Carregando liga...</span>
        </div>
      ) : (
        <>
          {/* Cabeçalho da temporada */}
          <div className="mb-6 panel-exchange rounded-2xl p-5 text-white flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-200 text-sm font-medium mb-1">Sua divisão</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl">{DIVISION_META[(league.myDivision ?? "bronze") as Division].emoji}</span>
                <span className="text-2xl font-black">
                  {DIVISION_META[(league.myDivision ?? "bronze") as Division].label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm font-medium mb-1 flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5" /> Semana termina em
              </p>
              <Countdown endsAt={league.endsAt} />
            </div>
          </div>

          {/* Abas de divisão */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {(league.divisions as readonly Division[]).map((d) => (
              <button
                key={d}
                onClick={() => setDivision(d)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                  shown === d ? DIVISION_META[d].chip : "bg-card text-muted-foreground border-border hover:text-foreground/80"
                }`}
              >
                {DIVISION_META[d].emoji} {DIVISION_META[d].label}
              </button>
            ))}
          </div>

          {/* Classificação */}
          {standings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Ninguém pontuou nesta divisão ainda.</p>
              <p className="text-xs mt-1">
                <Link href="/" className="underline">Vote nas enquetes</Link> para entrar na disputa!
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border/60">
              {standings.map((entry: any) => {
                const inPromotion = standings.length > 1 && entry.rank <= promoteCount;
                const inDemotion = standings.length > 1 && entry.rank > standings.length - promoteCount;
                return (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between px-4 py-3 ${entry.isMe ? "bg-brand/5" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 text-lg font-black font-mono text-muted-foreground/70 shrink-0">
                        #{entry.rank}
                      </span>
                      {inPromotion && <ArrowUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-label="Zona de promoção" />}
                      {inDemotion && <ArrowDown className="w-4 h-4 text-vote-a shrink-0" aria-label="Zona de rebaixamento" />}
                      <span className={`text-sm truncate ${entry.isMe ? "font-bold text-brand" : "font-medium text-foreground"}`}>
                        {entry.displayName}
                        {entry.isMe && <span className="ml-2 text-[10px] font-bold bg-brand text-brand-foreground px-1.5 py-0.5 rounded-full uppercase">Você</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <QCoin className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold text-qs tabular-nums">{entry.weeklyQs.toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA bolão */}
          <div className="mt-6 bg-card border border-brand/30 rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-foreground/80">
              <strong className="text-foreground">Quer disputar só com os amigos?</strong> Crie um bolão privado
              e convide pelo código.
            </p>
            <Link
              href="/boloes"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 transition-colors"
            >
              Meus bolões
            </Link>
          </div>

          {/* Legenda */}
          <div className="mt-6 bg-muted/50 border border-border rounded-xl p-4 flex gap-3">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              A pontuação da liga são os <strong>Qs ganhos na semana</strong> (votos, check-ins, acertos e
              conquistas). No fim da semana, <span className="text-emerald-600 dark:text-emerald-400 font-semibold">os primeiros sobem de divisão</span> e{" "}
              <span className="text-vote-a font-semibold">os últimos descem</span>. Sem prêmios em dinheiro —
              é pela glória. <Link href="/legal" className="underline">Saiba mais</Link>.
            </p>
          </div>
        </>
      )}
    </InstitutionalLayout>
  );
}
