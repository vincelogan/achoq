import { useEffect } from "react";
import { useParams } from "wouter";
import { Loader2, FolderOpen } from "lucide-react";
import InstitutionalLayout from "@/components/InstitutionalLayout";
import CategoryNav from "@/components/CategoryNav";
import MarketGrid from "@/components/MarketGrid";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";
import { categoryLabel } from "@/lib/categories";

export default function Categoria() {
  const params = useParams<{ categoria: string }>();
  const categoria = decodeURIComponent(params.categoria || "");
  const fingerprint = useFingerprint();
  const label = categoryLabel(categoria);

  useEffect(() => {
    document.title = `${label} | AchoQ`;
  }, [label]);

  const { data: markets, isLoading } = trpc.markets.list.useQuery(
    { category: categoria, fingerprint: fingerprint || undefined },
    { enabled: categoria.length > 0 }
  );

  return (
    <InstitutionalLayout
      title={`Enquetes de ${label}`}
      subtitle={`Veja o que o Brasil acha sobre ${label.toLowerCase()} — e registre a sua opinião.`}
      badge="Categoria"
      breadcrumbs={[{ label }]}
    >
      <CategoryNav active={categoria} className="mb-8" />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Carregando enquetes...</span>
        </div>
      ) : !markets || markets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Ainda não há enquetes ativas em {label}.</p>
          <p className="text-xs mt-1">Explore as outras categorias acima.</p>
        </div>
      ) : (
        <MarketGrid markets={markets as any} />
      )}
    </InstitutionalLayout>
  );
}
