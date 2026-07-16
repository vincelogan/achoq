import { useEffect, useMemo } from "react";
import { useSearch } from "wouter";
import { Loader2, SearchX } from "lucide-react";
import InstitutionalLayout from "@/components/InstitutionalLayout";
import CategoryNav from "@/components/CategoryNav";
import SearchBar from "@/components/SearchBar";
import MarketGrid from "@/components/MarketGrid";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";

export default function Busca() {
  const search = useSearch();
  const fingerprint = useFingerprint();
  const query = useMemo(() => new URLSearchParams(search).get("q")?.trim() ?? "", [search]);

  useEffect(() => {
    document.title = query ? `Busca: ${query} | AchoQ` : "Buscar enquetes | AchoQ";
  }, [query]);

  const { data: markets, isLoading } = trpc.markets.list.useQuery(
    { search: query || undefined, fingerprint: fingerprint || undefined },
    { enabled: query.length > 0 }
  );

  return (
    <InstitutionalLayout
      title={query ? `Resultados para “${query}”` : "Buscar enquetes"}
      subtitle="Encontre enquetes por tema, palavra-chave ou assunto."
      badge="Busca"
      breadcrumbs={[{ label: "Busca" }]}
    >
      <div className="mb-6 max-w-md">
        <SearchBar autoFocus={!query} />
      </div>
      <CategoryNav className="mb-8" />

      {!query ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Digite acima o que você procura — ex.: “dólar”, “eleições”, “Copa”.
        </p>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Buscando...</span>
        </div>
      ) : !markets || markets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <SearchX className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma enquete encontrada para “{query}”.</p>
          <p className="text-xs mt-1">Tente outra palavra-chave ou navegue pelas categorias acima.</p>
        </div>
      ) : (
        <MarketGrid markets={markets as any} />
      )}
    </InstitutionalLayout>
  );
}
