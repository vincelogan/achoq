import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Power,
  PowerOff,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  XCircle,
  Lock,
  LogOut,
  Database,
} from "lucide-react";
import { Link } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/logowhite_07ee886e.png";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 128);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MarketFormData {
  slug: string;
  title: string;
  description: string;
  category: string;
  optionA: string;
  optionB: string;
  labelA: string;
  labelB: string;
}

const emptyForm: MarketFormData = {
  slug: "",
  title: "",
  description: "",
  category: "geral",
  optionA: "",
  optionB: "",
  labelA: "",
  labelB: "",
};

// ─── Market Form ──────────────────────────────────────────────────────────────

function MarketForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: {
  initial: MarketFormData;
  onSubmit: (data: MarketFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  const [form, setForm] = useState<MarketFormData>(initial);

  const handleTitleChange = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: initial.slug ? f.slug : slugify(title),
    }));
  };

  return (
    <Card className="border-2 border-brand/20">
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground/80 mb-1 block">Pergunta da enquete *</label>
            <Input
              placeholder="Ex: Quem vai ganhar as eleições 2026?"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground/80 mb-1 block">Slug (URL) *</label>
            <Input
              placeholder="ex: eleicoes-2026"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">Apenas letras minúsculas, números e hífens</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground/80 mb-1 block">Categoria</label>
            <select
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="politica">Política</option>
              <option value="esportes">Esportes</option>
              <option value="entretenimento">Entretenimento</option>
              <option value="economia">Economia</option>
              <option value="tecnologia">Tecnologia</option>
              <option value="geral">Geral</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground/80 mb-1 block">Descrição</label>
            <Input
              placeholder="Descrição opcional da enquete"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>

        <div className="border-t border-border/50 pt-4">
          <p className="text-sm font-semibold text-foreground/80 mb-3">Opções de resposta</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-3 rounded-lg bg-vote-a/5 border border-vote-a/15">
              <label className="text-sm font-medium text-red-700 block">Opção A (Vermelho) *</label>
              <Input
                placeholder="Ex: Sim / Esquerda / Ana Paula"
                value={form.optionA}
                onChange={(e) => setForm((f) => ({ ...f, optionA: e.target.value }))}
              />
              <label className="text-xs font-medium text-red-600 block">Subtítulo da opção A</label>
              <Input
                placeholder="Ex: Campo Progressista"
                value={form.labelA}
                onChange={(e) => setForm((f) => ({ ...f, labelA: e.target.value }))}
              />
            </div>
            <div className="space-y-2 p-3 rounded-lg bg-brand/5 border border-brand/15">
              <label className="text-sm font-medium text-vote-b block">Opção B (Azul) *</label>
              <Input
                placeholder="Ex: Não / Direita / Outros"
                value={form.optionB}
                onChange={(e) => setForm((f) => ({ ...f, optionB: e.target.value }))}
              />
              <label className="text-xs font-medium text-vote-b block">Subtítulo da opção B</label>
              <Input
                placeholder="Ex: Campo Conservador"
                value={form.labelB}
                onChange={(e) => setForm((f) => ({ ...f, labelB: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => onSubmit(form)}
            disabled={isLoading || !form.title || !form.slug || !form.optionA || !form.optionB || !form.labelA || !form.labelB}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {submitLabel}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLogin();
      } else {
        setError(data.error || "Senha incorreta");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="max-w-sm w-full mx-4 shadow-lg">
        <CardHeader className="text-center pb-2">
          <img src={LOGO_URL} alt="AchoQ" className="h-16 w-16 rounded-xl mx-auto mb-3 object-cover" />
          <CardTitle className="text-xl text-brand">Painel Admin</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">AchoQ — Plataforma de Expectativa Coletiva</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1 block">Senha de administrador</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Digite a senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            {error && (
              <p className="text-sm text-vote-a bg-vote-a/10 px-3 py-2 rounded-md">{error}</p>
            )}
            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-brand hover:bg-brand/90 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Entrar
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/">
              <button className="text-xs text-muted-foreground hover:text-muted-foreground flex items-center gap-1 mx-auto">
                <ArrowLeft className="w-3 h-3" /> Voltar ao site
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

export default function Admin() {
  const [adminAuth, setAdminAuth] = useState<boolean | null>(null); // null = checking
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Check if already authenticated as admin
  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setAdminAuth(data.authenticated === true))
      .catch(() => setAdminAuth(false));
  }, []);

  const utils = trpc.useUtils();
  const { data: markets, isLoading } = trpc.admin.listAll.useQuery(undefined, {
    enabled: adminAuth === true,
  });

  const createMutation = trpc.admin.create.useMutation({
    onSuccess: () => {
      toast.success("Enquete criada com sucesso!");
      setShowCreate(false);
      utils.admin.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.update.useMutation({
    onSuccess: () => {
      toast.success("Enquete atualizada!");
      setEditingId(null);
      utils.admin.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deactivateMutation = trpc.admin.deactivate.useMutation({
    onSuccess: () => {
      toast.success("Enquete desativada.");
      utils.admin.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const activateMutation = trpc.admin.activate.useMutation({
    onSuccess: () => {
      toast.success("Enquete reativada!");
      utils.admin.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resolveMutation = trpc.admin.resolve.useMutation({
    onSuccess: () => {
      toast.success("Enquete resolvida! Pontos e Qs dos acertadores creditados.");
      utils.admin.listAll.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleResolve = (marketId: number, title: string, choice: "A" | "B", label: string) => {
    if (window.confirm(`Resolver "${title}" com resultado "${label}"? Isso desativa a enquete e credita os acertadores.`)) {
      resolveMutation.mutate({ id: marketId, resolvedChoice: choice });
    }
  };

  const { data: reportedComments } = trpc.admin.commentsReported.useQuery(undefined, {
    enabled: adminAuth === true,
  });

  const moderateMutation = trpc.admin.moderateComment.useMutation({
    onSuccess: () => {
      toast.success("Comentário moderado.");
      utils.admin.commentsReported.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [migrating, setMigrating] = useState(false);
  const handleRunMigrations = async () => {
    if (!window.confirm("Aplicar as migrations pendentes no banco de dados? A operação é segura e re-executável.")) return;
    setMigrating(true);
    try {
      const res = await fetch("/api/admin/run-migrations", { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao rodar migrations");
      if (data.applied > 0) {
        toast.success(`Banco atualizado! ${data.applied} migration(s) aplicada(s)${data.backfilled ? " (journal reconstruído)" : ""}.`);
      } else {
        toast.info("Banco já está atualizado — nenhuma migration pendente.");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setMigrating(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    setAdminAuth(false);
    toast.success("Sessão encerrada.");
  };

  // Checking auth state
  if (adminAuth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  // Not authenticated → show login form
  if (!adminAuth) {
    return <AdminLogin onLogin={() => setAdminAuth(true)} />;
  }

  // Authenticated → show admin panel
  return (
    <div className="min-h-screen bg-muted">
      {/* Admin Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src={LOGO_URL} alt="AchoQ" className="h-8 w-8 rounded-md object-cover" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-bold text-brand">Admin</span>
              <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full">Painel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunMigrations}
              disabled={migrating}
              title="Aplicar migrations pendentes no banco de dados"
              className="text-emerald-600 hover:text-emerald-700 hover:border-emerald-400"
            >
              {migrating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Database className="w-3.5 h-3.5 mr-1" />}
              Atualizar banco
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Site
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 hover:border-red-300"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-brand">{markets?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total de enquetes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-green-600">{markets?.filter(m => m.isActive).length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{markets?.filter(m => !m.isActive).length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Inativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{markets?.reduce((sum, m) => sum + (m.voteCount ?? 0), 0) ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total de opiniões</p>
            </CardContent>
          </Card>
        </div>

        {/* Create button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-foreground">Enquetes</h2>
          {!showCreate && (
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-brand hover:bg-brand/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Enquete
            </Button>
          )}
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Criar nova enquete</h3>
            <MarketForm
              initial={emptyForm}
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowCreate(false)}
              isLoading={createMutation.isPending}
              submitLabel="Criar Enquete"
            />
          </div>
        )}

        {/* Markets list */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          </div>
        ) : (
          <div className="space-y-3">
            {markets?.map((market) => (
              <div key={market.id}>
                {editingId === market.id ? (
                  <MarketForm
                    initial={{
                      slug: market.slug,
                      title: market.title,
                      description: market.description ?? "",
                      category: market.category,
                      optionA: market.optionA,
                      optionB: market.optionB,
                      labelA: market.labelA,
                      labelB: market.labelB,
                    }}
                    onSubmit={(data) => updateMutation.mutate({ id: market.id, ...data })}
                    onCancel={() => setEditingId(null)}
                    isLoading={updateMutation.isPending}
                    submitLabel="Salvar Alterações"
                  />
                ) : (
                  <Card className={`transition-all ${!market.isActive ? "opacity-60 border-dashed" : ""}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {market.isActive ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <h3 className="font-semibold text-foreground truncate">{market.title}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span className="bg-muted px-2 py-0.5 rounded">{market.category}</span>
                            <span>/{market.slug}</span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" /> {market.voteCount} opiniões
                            </span>
                          </div>
                          <div className="flex gap-3 mt-2 text-xs">
                            <span className="text-red-600 font-medium">A: {market.optionA} ({market.stats.countA})</span>
                            <span className="text-vote-b font-medium">B: {market.optionB} ({market.stats.countB})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {market.isActive && !market.resolvedChoice && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolve(market.id, market.title, "A", market.optionA)}
                                title={`Resolver: ${market.optionA}`}
                                className="text-vote-a hover:border-vote-a/50 text-xs font-bold"
                              >
                                ✓A
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleResolve(market.id, market.title, "B", market.optionB)}
                                title={`Resolver: ${market.optionB}`}
                                className="text-vote-b hover:border-vote-b/50 text-xs font-bold"
                              >
                                ✓B
                              </Button>
                            </>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(market.id)}
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {market.isActive ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deactivateMutation.mutate({ id: market.id })}
                              title="Desativar"
                              className="text-red-500 hover:text-red-700 hover:border-red-300"
                            >
                              <PowerOff className="w-3.5 h-3.5" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => activateMutation.mutate({ id: market.id })}
                              title="Reativar"
                              className="text-green-500 hover:text-green-700 hover:border-green-300"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Moderação de comentários */}
        <div className="mt-12">
          <h2 className="text-lg font-bold text-foreground mb-4">
            Moderação de comentários
            {reportedComments && reportedComments.length > 0 && (
              <span className="ml-2 text-xs bg-vote-a text-white px-2 py-0.5 rounded-full align-middle">
                {reportedComments.length}
              </span>
            )}
          </h2>
          {!reportedComments || reportedComments.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhum comentário denunciado. Tudo em ordem por aqui.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reportedComments.map((comment: any) => (
                <Card key={comment.id} className={comment.status === "hidden" ? "border-amber-500/40" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-1.5">
                          <span className="font-semibold text-foreground">{comment.nickname ?? "Anônimo"}</span>
                          <span className="bg-vote-a/10 text-vote-a px-2 py-0.5 rounded-full font-semibold">
                            {comment.reportCount} denúncia{comment.reportCount > 1 ? "s" : ""}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            comment.status === "hidden" ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                          }`}>
                            {comment.status === "hidden" ? "Oculto" : "Visível"}
                          </span>
                          <span>enquete #{comment.marketId}</span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed break-words">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {comment.status !== "hidden" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moderateMutation.mutate({ id: comment.id, action: "hide" })}
                            className="text-amber-600 hover:border-amber-400 text-xs"
                          >
                            Ocultar
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moderateMutation.mutate({ id: comment.id, action: "restore" })}
                          className="text-emerald-600 hover:border-emerald-400 text-xs"
                        >
                          Restaurar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Excluir este comentário definitivamente?")) {
                              moderateMutation.mutate({ id: comment.id, action: "delete" });
                            }
                          }}
                          className="text-vote-a hover:border-vote-a/50 text-xs"
                        >
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
