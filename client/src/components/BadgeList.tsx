import { Award } from "lucide-react";
import { trpc } from "@/lib/trpc";

const TIER_CLASSES: Record<string, string> = {
  bronze: "border-amber-500/30 bg-amber-500/10",
  prata: "border-border bg-muted",
  ouro: "border-qs/40 bg-qs/10",
};

/**
 * Grade de conquistas: as do usuário coloridas, as demais em cinza
 * (catálogo completo com progresso implícito).
 */
export default function BadgeList({ fingerprint }: { fingerprint: string }) {
  const { data: all } = trpc.badges.all.useQuery();
  const { data: mine } = trpc.badges.mine.useQuery({ fingerprint }, { enabled: !!fingerprint });

  if (!all || (all as any[]).length === 0) return null;
  const ownedCodes = new Set(((mine as any[]) ?? []).map((b) => b.code));

  return (
    <div>
      <h2 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-qs" />
        Conquistas
        <span className="text-sm font-normal text-muted-foreground">
          ({ownedCodes.size}/{(all as any[]).length})
        </span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {(all as any[]).map((badge) => {
          const owned = ownedCodes.has(badge.code);
          return (
            <div
              key={badge.id}
              className={`rounded-xl border p-3 text-center transition-opacity ${
                owned ? TIER_CLASSES[badge.tier] ?? TIER_CLASSES.bronze : "border-border bg-card opacity-45"
              }`}
              title={badge.description ?? badge.name}
            >
              <div className="text-2xl mb-1" aria-hidden="true">
                {badge.tier === "ouro" ? "🏆" : badge.tier === "prata" ? "🥈" : "🎖️"}
              </div>
              <p className="text-xs font-bold text-foreground leading-tight">{badge.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight line-clamp-2">{badge.description}</p>
              {badge.qReward > 0 && (
                <p className="text-[10px] font-bold text-qs mt-1">+{badge.qReward} Qs</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
