import { Lock } from "lucide-react";
import { useLocation } from "wouter";

/**
 * Prompt leve exibido quando alguém tenta votar sem estar logado — não é um
 * formulário embutido (isso duplicaria Entrar.tsx); só direciona para
 * /entrar ou /cadastro levando o path atual como returnPath, para retomar o
 * voto pretendido assim que a sessão for confirmada (ver hooks/useVote.ts).
 */
export function LoginGateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();

  if (!open) return null;

  const returnPath = encodeURIComponent(location);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-sm overflow-hidden pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Entre para opinar"
        >
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Entre para opinar</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sua conta guarda seus Qs e sua sequência entre dispositivos. Leva alguns segundos.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href={`/entrar?returnPath=${returnPath}`}
                className="w-full py-2.5 rounded-xl bg-brand text-brand-foreground font-bold text-sm hover:bg-brand/90 transition-colors"
              >
                Entrar
              </a>
              <a
                href={`/cadastro?returnPath=${returnPath}`}
                className="w-full py-2.5 rounded-xl border border-border font-bold text-sm hover:bg-muted transition-colors"
              >
                Criar conta
              </a>
            </div>
            <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground/80">
              Agora não
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
