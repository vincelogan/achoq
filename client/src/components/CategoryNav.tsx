import { Link } from "wouter";
import { CATEGORY_ORDER, categoryLabel } from "@/lib/categories";

/**
 * Chips de navegação por categoria. `active` marca a categoria atual
 * (página /categoria/:categoria); sem active, nenhum chip fica destacado.
 */
export default function CategoryNav({ active, className = "" }: { active?: string; className?: string }) {
  return (
    <nav aria-label="Categorias" className={`flex gap-2 overflow-x-auto pb-1 ${className}`}>
      <Link
        href="/"
        className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
          !active
            ? "bg-brand text-brand-foreground border-brand"
            : "bg-card text-muted-foreground border-border hover:border-brand/40 hover:text-brand"
        }`}
      >
        Todas
      </Link>
      {CATEGORY_ORDER.map((cat) => (
        <Link
          key={cat}
          href={`/categoria/${cat}`}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            active === cat
              ? "bg-brand text-brand-foreground border-brand"
              : "bg-card text-muted-foreground border-border hover:border-brand/40 hover:text-brand"
          }`}
        >
          {categoryLabel(cat)}
        </Link>
      ))}
    </nav>
  );
}
