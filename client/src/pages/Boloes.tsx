import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { ChevronRight, Crown, Loader2, Plus, Users } from "lucide-react";
import InstitutionalLayout from "@/components/InstitutionalLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";

export default function Boloes() {
  const fingerprint = useFingerprint();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [nicknameInput, setNicknameInput] = useState("");
  const [needsNickname, setNeedsNickname] = useState(false);

  useEffect(() => {
    document.title = "Bolões | AchoQ";
  }, []);

  const { data: myGroups, isLoading } = trpc.groups.mine.useQuery({ fingerprint }, { enabled: !!fingerprint });
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

  const createMutation = trpc.groups.create.useMutation({
    onSuccess: (data) => {
      toast.success("Bolão criado! Compartilhe o código com os amigos.");
      utils.groups.mine.invalidate({ fingerprint });
      navigate(`/bolao/${data.code}`);
    },
    onError: (err) => {
      if (err.message.includes("apelido")) setNeedsNickname(true);
      else toast.error(err.message);
    },
  });

  const joinMutation = trpc.groups.join.useMutation({
    onSuccess: (data) => {
      toast.success(`Você entrou no bolão "${data.name}"!`);
      utils.groups.mine.invalidate({ fingerprint });
      navigate(`/bolao/${data.code}`);
    },
    onError: (err) => {
      if (err.message.includes("apelido")) setNeedsNickname(true);
      else toast.error(err.message);
    },
  });

  const inputClasses =
    "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40";

  return (
    <InstitutionalLayout
      title="Bolões com amigos"
      subtitle="Crie um grupo privado, convide a galera pelo código e disputem quem entende mais do futuro. Ranking entre vocês, zero aposta — só moral."
      badge="Comunidade"
      breadcrumbs={[{ label: "Bolões" }]}
    >
      {needsNickname && !hasNickname && (
        <div className="mb-6 bg-muted rounded-xl p-4 border border-border max-w-md">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {/* Criar */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand" /> Criar bolão
          </h2>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do bolão (ex.: Família Silva)"
              maxLength={64}
              aria-label="Nome do bolão"
              className={inputClasses}
              onKeyDown={(e) => e.key === "Enter" && name.trim().length >= 3 && createMutation.mutate({ fingerprint, name: name.trim() })}
            />
            <Button
              onClick={() => createMutation.mutate({ fingerprint, name: name.trim() })}
              disabled={!fingerprint || name.trim().length < 3 || createMutation.isPending}
              className="bg-brand hover:bg-brand/90 text-brand-foreground shrink-0"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Grátis. Você recebe um código para convidar até 50 pessoas.</p>
        </div>

        {/* Entrar */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand" /> Entrar com código
          </h2>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Código (ex.: X7KP2M)"
              maxLength={12}
              aria-label="Código do bolão"
              className={`${inputClasses} font-mono tracking-widest uppercase`}
              onKeyDown={(e) => e.key === "Enter" && code.trim().length >= 4 && joinMutation.mutate({ fingerprint, code: code.trim() })}
            />
            <Button
              onClick={() => joinMutation.mutate({ fingerprint, code: code.trim() })}
              disabled={!fingerprint || code.trim().length < 4 || joinMutation.isPending}
              variant="outline"
              className="shrink-0"
            >
              {joinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Recebeu um link ou código de um amigo? Cole aqui.</p>
        </div>
      </div>

      {/* Meus bolões */}
      <h2 className="font-bold text-foreground text-lg mb-4">Meus bolões</h2>
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">Carregando...</span>
        </div>
      ) : !myGroups || (myGroups as any[]).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Você ainda não participa de nenhum bolão.</p>
          <p className="text-xs mt-1">Crie um e chame os amigos — quem acerta mais leva a moral da semana.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(myGroups as any[]).map((g) => (
            <Link
              key={g.id}
              href={`/bolao/${g.code}`}
              className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:border-brand/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-black shrink-0 uppercase">
                  {g.name.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate flex items-center gap-1.5">
                    {g.name}
                    {g.isOwner && <Crown className="w-3.5 h-3.5 text-qs shrink-0" aria-label="Você é o dono" />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {g.members} participante{g.members !== 1 ? "s" : ""} · código <span className="font-mono font-semibold">{g.code}</span>
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/70 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </InstitutionalLayout>
  );
}
