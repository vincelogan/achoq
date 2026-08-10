import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, Copy, Crown, Loader2, LogOut, Share2, Users } from "lucide-react";
import InstitutionalLayout from "@/components/InstitutionalLayout";
import { QCoin } from "@/components/QsBalance";
import { Button } from "@/components/ui/button";
import { SharePopup } from "@/components/SharePopup";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";

export default function BolaoDetalhe() {
  const params = useParams<{ code: string }>();
  const code = (params.code || "").toUpperCase();
  const fingerprint = useFingerprint();
  const utils = trpc.useUtils();
  const [shareOpen, setShareOpen] = useState(false);

  const { data: group, isLoading } = trpc.groups.get.useQuery(
    { code, fingerprint: fingerprint || undefined },
    { enabled: !!code, refetchInterval: 60_000 }
  );

  useEffect(() => {
    document.title = group ? `Bolão ${group.name} | AchoQ` : "Bolão | AchoQ";
  }, [group]);

  const joinMutation = trpc.groups.join.useMutation({
    onSuccess: () => {
      toast.success("Você entrou no bolão!");
      utils.groups.get.invalidate({ code });
      utils.groups.mine.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const leaveMutation = trpc.groups.leave.useMutation({
    onSuccess: () => {
      toast.success("Você saiu do bolão.");
      utils.groups.get.invalidate({ code });
      utils.groups.mine.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/bolao/${code}` : "";
  const shareText = group ? `Entra no meu bolão "${group.name}" no AchoQ! Código: ${code}` : "";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Código copiado!");
    } catch {
      toast.info(`Código: ${code}`);
    }
  };

  if (isLoading) {
    return (
      <InstitutionalLayout title="Bolão" badge="Comunidade" breadcrumbs={[{ label: "Bolões", href: "/boloes" }, { label: code }]}>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Carregando bolão...</span>
        </div>
      </InstitutionalLayout>
    );
  }

  if (!group) {
    return (
      <InstitutionalLayout title="Bolão não encontrado" badge="Comunidade" breadcrumbs={[{ label: "Bolões", href: "/boloes" }]}>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Este bolão não existe ou foi encerrado. Confira o código.</p>
          <Link href="/boloes">
            <Button variant="outline" className="mt-4 gap-2"><ArrowLeft className="w-4 h-4" />Meus bolões</Button>
          </Link>
        </div>
      </InstitutionalLayout>
    );
  }

  return (
    <InstitutionalLayout
      title={group.name}
      subtitle={`Ranking da semana entre ${group.members.length} participante${group.members.length !== 1 ? "s" : ""}. Ganhe Qs opinando e acertando para subir no bolão.`}
      badge="Bolão"
      breadcrumbs={[{ label: "Bolões", href: "/boloes" }, { label: group.name }]}
    >
      {/* Convite */}
      <div className="mb-6 panel-exchange rounded-2xl p-5 text-white flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-blue-200 text-sm font-medium mb-1">Código de convite</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black font-mono tracking-widest">{group.code}</span>
            <button onClick={copyCode} className="p-2 rounded-lg bg-white/15 hover:bg-white/25 transition-colors" aria-label="Copiar código">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {!group.viewerIsMember && (
            <Button
              onClick={() => joinMutation.mutate({ fingerprint, code })}
              disabled={!fingerprint || joinMutation.isPending}
              className="bg-white text-[#0a1424] hover:bg-white/90 font-bold"
            >
              <Users className="w-4 h-4 mr-2" /> Entrar no bolão
            </Button>
          )}
          <Button onClick={() => setShareOpen(true)} className="bg-white/15 hover:bg-white/25 text-white border-0">
            <Share2 className="w-4 h-4 mr-2" /> Convidar amigos
          </Button>
        </div>
      </div>

      {/* Ranking do bolão */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border/60 mb-6">
        {group.members.map((m: any) => (
          <div key={m.rank} className={`flex items-center justify-between px-4 py-3 ${m.isMe ? "bg-brand/5" : ""}`}>
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 text-lg font-black font-mono text-muted-foreground/70 shrink-0">
                {m.rank === 1 ? "🥇" : m.rank === 2 ? "🥈" : m.rank === 3 ? "🥉" : `#${m.rank}`}
              </span>
              <div className="min-w-0">
                <p className={`text-sm truncate flex items-center gap-1.5 ${m.isMe ? "font-bold text-brand" : "font-medium text-foreground"}`}>
                  {m.displayName}
                  {m.isOwner && <Crown className="w-3.5 h-3.5 text-qs shrink-0" aria-label="Dono do bolão" />}
                  {m.isMe && <span className="text-[10px] font-bold bg-brand text-brand-foreground px-1.5 py-0.5 rounded-full uppercase shrink-0">Você</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.totalVotes} opiniões · {m.accuracy}% de acerto
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <QCoin className="w-3.5 h-3.5" />
              <span className="text-sm font-bold text-qs tabular-nums">{m.weeklyQs.toLocaleString("pt-BR")}</span>
              <span className="text-[10px] text-muted-foreground uppercase">na semana</span>
            </div>
          </div>
        ))}
      </div>

      {group.viewerIsMember && (
        <button
          onClick={() => {
            if (window.confirm("Sair deste bolão?")) leaveMutation.mutate({ fingerprint, groupId: group.id });
          }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-vote-a transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Sair do bolão
        </button>
      )}

      {shareOpen && (
        <SharePopup open={shareOpen} onClose={() => setShareOpen(false)} shareText={shareText} shareUrl={inviteUrl} />
      )}
    </InstitutionalLayout>
  );
}
