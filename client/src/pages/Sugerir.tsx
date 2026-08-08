import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { CheckCircle2, Clock, Lightbulb, Loader2, XCircle } from "lucide-react";
import InstitutionalLayout from "@/components/InstitutionalLayout";
import { QCoin } from "@/components/QsBalance";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";
import { CATEGORY_ORDER, categoryLabel } from "@/lib/categories";

const STATUS_META: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  pending: { label: "Em revisão", classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: <Clock className="w-3.5 h-3.5" /> },
  approved: { label: "Aprovada", classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected: { label: "Recusada (Qs devolvidos)", classes: "bg-vote-a/10 text-vote-a", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const EMPTY_FORM = {
  title: "",
  category: "geral",
  optionA: "Sim",
  optionB: "Não",
  labelA: "Acho que sim",
  labelB: "Acho que não",
  description: "",
};

export default function Sugerir() {
  const fingerprint = useFingerprint();
  const utils = trpc.useUtils();
  const [form, setForm] = useState(EMPTY_FORM);
  const [nicknameInput, setNicknameInput] = useState("");
  const [needsNickname, setNeedsNickname] = useState(false);

  useEffect(() => {
    document.title = "Sugerir Enquete | AchoQ";
  }, []);

  const { data: costData } = trpc.suggestions.cost.useQuery();
  const cost = costData?.cost ?? 100;
  const { data: wallet } = trpc.wallet.get.useQuery({ fingerprint }, { enabled: !!fingerprint });
  const { data: mine } = trpc.suggestions.mine.useQuery({ fingerprint }, { enabled: !!fingerprint });
  const { data: myPos } = trpc.ranking.myPosition.useQuery({ fingerprint }, { enabled: !!fingerprint });
  const hasNickname = !!myPos?.nickname;

  const nicknameMutation = trpc.ranking.setNickname.useMutation({
    onSuccess: () => {
      toast.success("Apelido salvo!");
      setNeedsNickname(false);
      utils.ranking.myPosition.invalidate({ fingerprint });
    },
    onError: () => toast.error("Apelido inválido."),
  });

  const createMutation = trpc.suggestions.create.useMutation({
    onSuccess: () => {
      toast.success("Sugestão enviada para revisão! Se aprovada, vira enquete no ar.");
      setForm(EMPTY_FORM);
      utils.suggestions.mine.invalidate({ fingerprint });
      utils.wallet.get.invalidate({ fingerprint });
    },
    onError: (err) => {
      if (err.message.includes("apelido")) setNeedsNickname(true);
      else toast.error(err.message);
    },
  });

  const set = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const canSubmit =
    form.title.trim().length >= 10 &&
    form.optionA.trim() &&
    form.optionB.trim() &&
    form.labelA.trim() &&
    form.labelB.trim() &&
    (wallet?.qBalance ?? 0) >= cost;

  const handleSubmit = () => {
    if (!hasNickname) {
      setNeedsNickname(true);
      return;
    }
    createMutation.mutate({
      fingerprint,
      title: form.title.trim(),
      category: form.category,
      optionA: form.optionA.trim(),
      optionB: form.optionB.trim(),
      labelA: form.labelA.trim(),
      labelB: form.labelB.trim(),
      description: form.description.trim() || undefined,
    });
  };

  const inputClasses =
    "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40";

  return (
    <InstitutionalLayout
      title="Sugira uma enquete"
      subtitle={`Tem uma pergunta que o Brasil deveria responder? Sugira por ${cost} Qs. Nossa equipe revisa; se aprovada, ela vai ao ar — se recusada, seus Qs voltam.`}
      badge="Comunidade"
      breadcrumbs={[{ label: "Sugerir enquete" }]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            {needsNickname && !hasNickname && (
              <div className="bg-muted rounded-xl p-4 border border-border">
                <p className="text-sm font-medium text-foreground mb-2">Antes, escolha um apelido público</p>
                <div className="flex gap-2">
                  <input
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder="Seu apelido..."
                    maxLength={32}
                    className={inputClasses}
                  />
                  <Button
                    onClick={() => nicknameInput.trim() && nicknameMutation.mutate({ fingerprint, nickname: nicknameInput.trim() })}
                    disabled={nicknameMutation.isPending}
                    className="bg-brand hover:bg-brand/90 text-brand-foreground shrink-0"
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5" htmlFor="sug-title">
                Pergunta <span className="text-muted-foreground font-normal">(termine com "?")</span>
              </label>
              <input
                id="sug-title"
                value={form.title}
                onChange={set("title")}
                placeholder="Você acha que ... até o fim de 2026?"
                maxLength={200}
                className={inputClasses}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5" htmlFor="sug-cat">Categoria</label>
              <select id="sug-cat" value={form.category} onChange={set("category")} className={inputClasses}>
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-vote-a block mb-1.5" htmlFor="sug-a">Opção A</label>
                <input id="sug-a" value={form.optionA} onChange={set("optionA")} maxLength={128} className={inputClasses} />
                <input value={form.labelA} onChange={set("labelA")} maxLength={64} placeholder="Rótulo (ex.: Acho que sim)" className={`${inputClasses} mt-2`} aria-label="Rótulo da opção A" />
              </div>
              <div>
                <label className="text-sm font-semibold text-vote-b block mb-1.5" htmlFor="sug-b">Opção B</label>
                <input id="sug-b" value={form.optionB} onChange={set("optionB")} maxLength={128} className={inputClasses} />
                <input value={form.labelB} onChange={set("labelB")} maxLength={64} placeholder="Rótulo (ex.: Acho que não)" className={`${inputClasses} mt-2`} aria-label="Rótulo da opção B" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground block mb-1.5" htmlFor="sug-desc">
                Contexto <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                id="sug-desc"
                value={form.description}
                onChange={set("description")}
                rows={3}
                maxLength={1000}
                placeholder="Por que essa pergunta importa? Como saberemos a resposta?"
                className={`${inputClasses} resize-none`}
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Custo:</span>
                <QCoin className="w-4 h-4" />
                <span className="font-bold text-qs">{cost} Qs</span>
                <span className="text-muted-foreground ml-2">Seu saldo: {(wallet?.qBalance ?? 0).toLocaleString("pt-BR")}</span>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!fingerprint || !canSubmit || createMutation.isPending}
                className="bg-brand hover:bg-brand/90 text-brand-foreground"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lightbulb className="w-4 h-4 mr-2" />}
                {(wallet?.qBalance ?? 0) < cost ? "Qs insuficientes" : "Enviar sugestão"}
              </Button>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            Regras: a pergunta precisa ter resposta verificável no futuro (sim/não ou A/B), sem conteúdo
            ofensivo ou ilegal. A equipe pode ajustar texto e data de encerramento ao publicar.
            Ganhe Qs <Link href="/" className="underline">opinando nas enquetes</Link> e com o
            check-in diário. Se a sugestão for recusada, os {cost} Qs voltam integralmente.
          </p>
        </div>

        {/* Minhas sugestões */}
        <div>
          <h2 className="font-bold text-foreground mb-3">Minhas sugestões</h2>
          {!mine || (mine as any[]).length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-5 text-sm text-muted-foreground">
              Nenhuma sugestão ainda. A sua primeira pode estar no ar ainda hoje!
            </div>
          ) : (
            <div className="space-y-3">
              {(mine as any[]).map((s) => {
                const meta = STATUS_META[s.status] ?? STATUS_META.pending;
                return (
                  <div key={s.id} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{s.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.classes}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground uppercase">{categoryLabel(s.category)}</span>
                    </div>
                    {s.status === "rejected" && s.reviewNote && (
                      <p className="text-xs text-muted-foreground mt-2">Motivo: {s.reviewNote}</p>
                    )}
                    {s.status === "approved" && s.marketId && (
                      <p className="text-xs mt-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">No ar! 🎉</span>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </InstitutionalLayout>
  );
}
