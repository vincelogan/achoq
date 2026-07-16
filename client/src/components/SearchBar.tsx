import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { Search } from "lucide-react";

/**
 * Busca de enquetes: submete para /busca?q=...
 * Usada no header (desktop) e no menu mobile.
 */
export default function SearchBar({ className = "", autoFocus = false }: { className?: string; autoFocus?: boolean }) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length === 0) return;
    navigate(`/busca?q=${encodeURIComponent(q)}`);
    setQuery("");
  };

  return (
    <form onSubmit={handleSubmit} role="search" className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar enquetes..."
        aria-label="Buscar enquetes"
        autoFocus={autoFocus}
        className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40 transition-all"
      />
    </form>
  );
}
