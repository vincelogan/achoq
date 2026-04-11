import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
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
} from "lucide-react";
import { Link } from "wouter";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/logowhite_07ee886e.png";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 128);
}

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
    <Card className="border-2 border-[#1a4971]/20">
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Pergunta da enquete *</label>
            <Input
              placeholder="Ex: Quem vai ganhar as eleições 2026?"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Slug (URL) *</label>
            <Input
              placeholder="ex: eleicoes-2026"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-1">Apenas letras minúsculas, números e hífens</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Categoria</label>
            <select
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
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
            <label className="text-sm font-medium text-gray-700 mb-1 block">Descrição</label>
            <Input
              placeholder="Descrição opcional da enquete"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Opções de resposta</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-3 rounded-lg bg-red-50 border border-red-100">
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
            <div className="space-y-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
              <label className="text-sm font-medium text-[#002B5C] block">Opção B (Azul) *</label>
              <Input
                placeholder="Ex: Não / Direita / Outros"
                value={form.optionB}
                onChange={(e) => setForm((f) => ({ ...f, optionB: e.target.value }))}
              />
              <label className="text-xs font-medium text-[#002B5C] block">Subtítulo da opção B</label>
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
            className="bg-[#1a4971] hover:bg-[#0d3a5c] text-white"
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

export default function Admin() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: markets, isLoading } = trpc.admin.listAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
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

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a4971]" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <img src={LOGO_URL} alt="AchoQ" className="h-16 w-16 rounded-xl mx-auto mb-4 object-cover" />
            <CardTitle className="text-xl text-[#1a4971]">Painel Admin</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-500 text-sm">Faça login para acessar o painel de administração.</p>
            {getLoginUrl() === "#login-unavailable" ? (
              <p className="text-amber-600 text-sm bg-amber-50 p-3 rounded-lg">
                Autenticação não disponível neste domínio. Acesse pelo painel Manus.
              </p>
            ) : (
              <Button
                className="w-full bg-[#1a4971] hover:bg-[#0d3a5c] text-white"
                onClick={() => { window.location.href = getLoginUrl(); }}
              >
                Entrar com Manus
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-2" />
            <CardTitle className="text-xl text-gray-800">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-500 text-sm">
              Você está logado como <strong>{user?.name || user?.email}</strong>, mas não tem permissão de administrador.
            </p>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao site
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <img src={LOGO_URL} alt="AchoQ" className="h-8 w-8 rounded-md object-cover" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1a4971]">Admin</span>
              <span className="text-xs bg-[#1a4971] text-white px-2 py-0.5 rounded-full">Painel</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{user?.name || user?.email}</span>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Site
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-[#1a4971]">{markets?.length ?? 0}</p>
              <p className="text-xs text-gray-500">Total de enquetes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-green-600">{markets?.filter(m => m.isActive).length ?? 0}</p>
              <p className="text-xs text-gray-500">Ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-gray-400">{markets?.filter(m => !m.isActive).length ?? 0}</p>
              <p className="text-xs text-gray-500">Inativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{markets?.reduce((sum, m) => sum + (m.voteCount ?? 0), 0) ?? 0}</p>
              <p className="text-xs text-gray-500">Total de opiniões</p>
            </CardContent>
          </Card>
        </div>

        {/* Create button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800">Enquetes</h2>
          {!showCreate && (
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-[#1a4971] hover:bg-[#0d3a5c] text-white"
            >
              <Plus className="w-4 h-4 mr-2" /> Nova Enquete
            </Button>
          )}
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Criar nova enquete</h3>
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
            <Loader2 className="w-6 h-6 animate-spin text-[#1a4971]" />
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
                              <XCircle className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                            <h3 className="font-semibold text-gray-800 truncate">{market.title}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                            <span className="bg-gray-100 px-2 py-0.5 rounded">{market.category}</span>
                            <span>/{market.slug}</span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" /> {market.voteCount} opiniões
                            </span>
                          </div>
                          <div className="flex gap-3 mt-2 text-xs">
                            <span className="text-red-600 font-medium">A: {market.optionA} ({market.stats.countA})</span>
                            <span className="text-[#002B5C] font-medium">B: {market.optionB} ({market.stats.countB})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
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
      </div>
    </div>
  );
}
