import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";

function timeAgo(date: string | Date): string {
  const ms = Date.now() - new Date(date).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const TYPE_EMOJI: Record<string, string> = {
  market_resolved: "🎯",
  majority_flip: "🔄",
  badge_earned: "🏅",
  suggestion_reviewed: "💡",
  league_moved: "🏆",
};

/** Sininho do header com contagem de não lidas e painel dropdown. */
export default function NotificationBell() {
  const fingerprint = useFingerprint();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: unread } = trpc.notifications.unreadCount.useQuery(
    { fingerprint },
    { enabled: !!fingerprint, refetchInterval: 60_000, refetchOnWindowFocus: true }
  );

  const { data: list, isLoading } = trpc.notifications.list.useQuery(
    { fingerprint, limit: 15 },
    { enabled: !!fingerprint && open }
  );

  const markAllMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.notifications.unreadCount.invalidate({ fingerprint });
      utils.notifications.list.invalidate();
    },
  });

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!fingerprint) return null;
  const count = unread?.count ?? 0;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label={count > 0 ? `Notificações: ${count} não lidas` : "Notificações"}
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-vote-a text-white text-[10px] font-bold flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h3 className="font-bold text-foreground text-sm">Notificações</h3>
            {count > 0 && (
              <button
                onClick={() => markAllMutation.mutate({ fingerprint })}
                className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Marcar lidas
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-xs">Carregando...</span>
              </div>
            ) : !list || list.items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 px-4">
                Nada por aqui ainda. Vote nas enquetes — a gente te avisa quando algo acontecer.
              </p>
            ) : (
              (list.items as any[]).map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setOpen(false);
                    if (count > 0) markAllMutation.mutate({ fingerprint });
                    if (n.linkUrl) navigate(n.linkUrl);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-border/40 last:border-0 hover:bg-muted/60 transition-colors ${
                    !n.isRead ? "bg-brand/5" : ""
                  }`}
                >
                  <div className="flex gap-2.5">
                    <span className="text-lg shrink-0" aria-hidden="true">{TYPE_EMOJI[n.type] ?? "🔔"}</span>
                    <div className="min-w-0">
                      <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
