import { useState } from "react";
import { toast } from "sonner";
import { Check, Code2, Copy, X } from "lucide-react";

/**
 * Modal "Incorporar": gera o código <iframe> do widget /embed/:slug
 * (padrão Polymarket: preview + tema claro/escuro + copiar).
 */
export default function EmbedModal({
  open,
  onClose,
  slug,
  title,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  title: string;
}) {
  const [dark, setDark] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://achoq.com.br";
  const src = `${origin}/embed/${slug}${dark ? "?tema=dark" : ""}`;
  const code = `<iframe src="${src}" title="${title.replace(/"/g, "&quot;")} — AchoQ" width="400" height="220" frameborder="0" style="border:1px solid #e5e5e5;border-radius:12px;max-width:100%"></iframe>`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Código copiado! Cole no seu site ou newsletter.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg overflow-hidden pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Incorporar enquete"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <h3 className="font-bold text-foreground text-base flex items-center gap-2">
              <Code2 className="w-4 h-4 text-brand" /> Incorporar no seu site
            </h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted" aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              O widget mostra o placar ao vivo e se atualiza sozinho. Perfeito para portais, blogs e newsletters.
            </p>

            {/* Tema */}
            <div className="flex gap-2">
              <button
                onClick={() => setDark(false)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${!dark ? "bg-brand text-brand-foreground border-brand" : "bg-card text-muted-foreground border-border"}`}
              >
                ☀️ Claro
              </button>
              <button
                onClick={() => setDark(true)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${dark ? "bg-brand text-brand-foreground border-brand" : "bg-card text-muted-foreground border-border"}`}
              >
                🌙 Escuro
              </button>
            </div>

            {/* Preview */}
            <iframe
              src={src}
              title={`Prévia do widget: ${title}`}
              width="100%"
              height="220"
              className="rounded-xl border border-border"
            />

            {/* Código */}
            <div className="relative">
              <textarea
                readOnly
                value={code}
                rows={4}
                aria-label="Código de incorporação"
                className="w-full px-3 py-2 pr-12 rounded-lg border border-border bg-muted font-mono text-xs text-foreground/80 resize-none focus:outline-none"
                onFocus={(e) => e.target.select()}
              />
              <button
                onClick={copy}
                className="absolute top-2 right-2 p-2 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
                aria-label="Copiar código"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
