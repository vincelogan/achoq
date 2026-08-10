import { useEffect } from "react";
import { Link } from "wouter";
import { Flame, Loader2, ShieldCheck, ShoppingBag, TrendingDown, TrendingUp } from "lucide-react";
import InstitutionalLayout from "@/components/InstitutionalLayout";
import { QCoin } from "@/components/QsBalance";
import BadgeList from "@/components/BadgeList";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";

const TYPE_LABELS: Record<string, string> = {
  vote: "Opinião registrada",
  early_bird: "Bônus: opinou cedo",
  daily_checkin: "Check-in diário",
  correct: "Acertou a previsão",
  streak_bonus: "Bônus de sequência",
  badge_reward: "Conquista desbloqueada",
  migration: "Pontos migrados para Qs",
  shop_purchase: "Compra na loja",
  boost_purchase: "Impulso de enquete",
  reversal: "Estorno",
  admin_adjust: "Ajuste",
};

export default function Carteira() {
  const fingerprint = useFingerprint();

  useEffect(() => {
    document.title = "Minha Carteira de Qs | AchoQ";
  }, []);

  const { data: wallet, isLoading } = trpc.wallet.get.useQuery({ fingerprint }, { enabled: !!fingerprint });
  const { data: history } = trpc.wallet.history.useQuery(
    { fingerprint, limit: 50 },
    { enabled: !!fingerprint }
  );

  return (
    <InstitutionalLayout
      title="Minha Carteira"
      subtitle="Qs são a moeda fictícia do AchoQ: você ganha opinando e acertando previsões, e gasta em destaque e itens de perfil. Sem valor monetário — só diversão e reputação."
      badge="Carteira"
      breadcrumbs={[{ label: "Carteira" }]}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Carregando carteira...</span>
        </div>
      ) : (
        <>
          {/* Painel de saldo */}
          <div className="mb-8 panel-exchange rounded-2xl p-6 text-white">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">Saldo disponível</p>
                <div className="flex items-center gap-3">
                  <QCoin className="w-9 h-9" />
                  <span className="text-4xl font-black tabular-nums">
                    {(wallet?.qBalance ?? 0).toLocaleString("pt-BR")}
                  </span>
                  <span className="text-blue-200 text-lg font-semibold">Qs</span>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-black">
                    <Flame className="w-5 h-5 text-orange-300" />
                    {wallet?.dailyStreak ?? 0}
                  </div>
                  <div className="text-blue-200 text-xs uppercase tracking-wide">dias seguidos</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-2xl font-black">
                    <ShieldCheck className="w-5 h-5 text-emerald-300" />
                    {wallet?.streakShields ?? 0}
                  </div>
                  <div className="text-blue-200 text-xs uppercase tracking-wide">proteções</div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-400/30 flex flex-wrap gap-3">
              <Link
                href="/loja"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-sm font-semibold"
              >
                <ShoppingBag className="w-4 h-4" />
                Ir para a Loja
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-sm font-semibold"
              >
                <TrendingUp className="w-4 h-4" />
                Ganhar Qs opinando
              </Link>
            </div>
          </div>

          {/* Como ganhar */}
          <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "+5 Qs", desc: "por opinião (até 10/dia)" },
              { label: "+5 Qs", desc: "opinando nas primeiras 48h" },
              { label: "+10 a +25 Qs", desc: "check-in diário (streak)" },
              { label: "+20 Qs", desc: "por previsão certa" },
            ].map((item) => (
              <div key={item.desc} className="bg-card border border-border rounded-xl p-3 text-center">
                <div className="font-bold text-qs text-sm flex items-center justify-center gap-1">
                  <QCoin className="w-3.5 h-3.5" />
                  {item.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Extrato */}
          <h2 className="font-bold text-foreground text-lg mb-4">Extrato</h2>
          {!history || history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
              <p className="text-sm">Nenhuma movimentação ainda.</p>
              <p className="text-xs mt-1">Vote em uma enquete para ganhar seus primeiros Qs!</p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl divide-y divide-border/60">
              {(history as any[]).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {tx.amount >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-vote-a shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {TYPE_LABELS[tx.type] ?? tx.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold tabular-nums shrink-0 ${
                      tx.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-vote-a"
                    }`}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {tx.amount} Qs
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Conquistas */}
          <div className="mt-10">
            <BadgeList fingerprint={fingerprint} />
          </div>

          <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
            Os Qs são uma moeda fictícia de engajamento, sem valor monetário, não compráveis e não
            conversíveis em dinheiro ou prêmios. <Link href="/legal" className="underline">Saiba mais</Link>.
          </p>
        </>
      )}
    </InstitutionalLayout>
  );
}
