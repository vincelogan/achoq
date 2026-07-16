import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Check, Crown, Flame, Loader2, Medal, ShieldCheck, Sparkles, Tag, Wallet, Zap } from "lucide-react";
import InstitutionalLayout from "@/components/InstitutionalLayout";
import { QCoin } from "@/components/QsBalance";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";

type TabKey = "loja" | "meus";

const KIND_LABELS: Record<string, string> = {
  frame: "Moldura",
  title: "Título",
  streak_shield: "Proteção",
  boost: "Impulso",
};

function itemIcon(code: string) {
  if (code.startsWith("frame-ouro")) return <Crown className="w-6 h-6 text-qs" />;
  if (code.startsWith("frame-fogo")) return <Flame className="w-6 h-6 text-orange-500" />;
  if (code.startsWith("frame")) return <Medal className="w-6 h-6 text-muted-foreground" />;
  if (code.startsWith("title")) return <Tag className="w-6 h-6 text-brand" />;
  if (code.startsWith("shield")) return <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
  if (code.startsWith("boost")) return <Zap className="w-6 h-6 text-qs" />;
  return <Sparkles className="w-6 h-6 text-muted-foreground" />;
}

export default function Loja() {
  const fingerprint = useFingerprint();
  const [tab, setTab] = useState<TabKey>("loja");
  const utils = trpc.useUtils();

  useEffect(() => {
    document.title = "Loja de Qs | AchoQ";
  }, []);

  const { data: wallet } = trpc.wallet.get.useQuery({ fingerprint }, { enabled: !!fingerprint });
  const { data: items, isLoading } = trpc.shop.list.useQuery();
  const { data: myItems } = trpc.shop.myItems.useQuery({ fingerprint }, { enabled: !!fingerprint });

  const invalidate = () => {
    utils.wallet.get.invalidate({ fingerprint });
    utils.wallet.history.invalidate();
    utils.shop.myItems.invalidate({ fingerprint });
  };

  const buyMutation = trpc.shop.buy.useMutation({
    onSuccess: () => {
      toast.success("Compra realizada!");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const equipMutation = trpc.shop.equip.useMutation({
    onSuccess: () => {
      toast.success("Item equipado!");
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const unequipMutation = trpc.shop.unequip.useMutation({
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const ownedCodes = new Set((myItems as any[] | undefined)?.map((i) => i.code) ?? []);
  const balance = wallet?.qBalance ?? 0;

  const visibleItems = ((items as any[] | undefined) ?? []).filter((i) => i.kind !== "boost");

  return (
    <InstitutionalLayout
      title="Loja de Qs"
      subtitle="Troque seus Qs por molduras, títulos e vantagens de engajamento. Tudo fictício, sem valor monetário — puro prestígio."
      badge="Loja"
      breadcrumbs={[{ label: "Loja" }]}
    >
      {/* Saldo + abas */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
          <button
            onClick={() => setTab("loja")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === "loja" ? "bg-card text-vote-b shadow-sm" : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            Loja
          </button>
          <button
            onClick={() => setTab("meus")}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === "meus" ? "bg-card text-vote-b shadow-sm" : "text-muted-foreground hover:text-foreground/80"
            }`}
          >
            Meus Itens {ownedCodes.size > 0 ? `(${ownedCodes.size})` : ""}
          </button>
        </div>
        <Link
          href="/carteira"
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-qs/30 bg-qs/10 hover:bg-qs/20 transition-colors"
        >
          <Wallet className="w-4 h-4 text-qs" />
          <QCoin className="w-4 h-4" />
          <span className="text-sm font-bold text-qs tabular-nums">{balance.toLocaleString("pt-BR")}</span>
        </Link>
      </div>

      {tab === "loja" ? (
        isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="text-sm">Carregando itens...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleItems.map((item) => {
              const owned = ownedCodes.has(item.code);
              const isShield = item.kind === "streak_shield";
              const shieldCount = wallet?.streakShields ?? 0;
              const shieldMaxed = isShield && shieldCount >= 2;
              const canBuy = !owned || isShield;
              const affordable = balance >= item.price;
              return (
                <div key={item.id} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        {itemIcon(item.code)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{item.name}</p>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {KIND_LABELS[item.kind] ?? item.kind}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <QCoin className="w-3.5 h-3.5" />
                      <span className="font-bold text-qs text-sm tabular-nums">{item.price}</span>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  )}
                  {isShield && (
                    <p className="text-xs text-muted-foreground">
                      Em estoque: <strong>{shieldCount}/2</strong>
                    </p>
                  )}
                  <div className="mt-auto">
                    {owned && !isShield ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-4 h-4" /> Adquirido
                      </span>
                    ) : (
                      <button
                        onClick={() => buyMutation.mutate({ fingerprint, itemCode: item.code })}
                        disabled={!fingerprint || !affordable || buyMutation.isPending || shieldMaxed || !canBuy}
                        className="w-full px-4 py-2 rounded-lg bg-brand text-brand-foreground text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {shieldMaxed
                          ? "Máximo em estoque"
                          : affordable
                          ? "Comprar"
                          : "Qs insuficientes"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div>
          {!myItems || (myItems as any[]).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Você ainda não tem itens.</p>
              <p className="text-xs mt-1">Ganhe Qs opinando e volte para gastar aqui!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(myItems as any[]).map((item) => (
                <div key={item.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      {itemIcon(item.code)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{item.name}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {KIND_LABELS[item.kind] ?? item.kind}
                      </span>
                    </div>
                  </div>
                  {item.isEquipped ? (
                    <button
                      onClick={() => unequipMutation.mutate({ fingerprint, itemId: item.itemId })}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold hover:opacity-80 transition-opacity"
                    >
                      <Check className="w-3.5 h-3.5" /> Equipado
                    </button>
                  ) : (
                    <button
                      onClick={() => equipMutation.mutate({ fingerprint, itemId: item.itemId })}
                      disabled={equipMutation.isPending}
                      className="shrink-0 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground/80 hover:bg-muted transition-colors"
                    >
                      Equipar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-8 text-xs text-muted-foreground leading-relaxed">
        Itens da loja são cosméticos e fictícios, sem valor monetário. Qs não podem ser comprados com
        dinheiro real nem convertidos em prêmios. <Link href="/legal" className="underline">Saiba mais</Link>.
      </p>
    </InstitutionalLayout>
  );
}
