/**
 * Categorias das enquetes — labels e cores centralizados
 * (antes duplicados em Home.tsx e MarketDetail.tsx).
 */

export const CATEGORY_LABELS: Record<string, string> = {
  politica: "Política",
  esportes: "Esportes",
  entretenimento: "Entretenimento",
  economia: "Economia",
  tecnologia: "Tecnologia",
  geral: "Geral",
};

/** Classes de chip por categoria (compatíveis com dark mode). */
export const CATEGORY_COLORS: Record<string, string> = {
  politica: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  esportes: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  entretenimento: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  economia: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  tecnologia: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  geral: "bg-muted text-foreground/80",
};

/** Ordem canônica de exibição na navegação. */
export const CATEGORY_ORDER = ["politica", "economia", "esportes", "entretenimento", "tecnologia", "geral"];

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}

export function categoryChipClasses(category: string): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.geral;
}
