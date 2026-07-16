import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useFingerprint } from "@/hooks/useFingerprint";

/** Ícone da moeda Q. */
export function QCoin({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-full bg-qs text-qs-foreground font-black leading-none select-none`}
      aria-hidden="true"
      style={{ fontSize: "0.65em" }}
    >
      Q
    </span>
  );
}

/**
 * Chip de saldo de Qs no header. Clique leva à carteira.
 */
export default function QsBalance() {
  const fingerprint = useFingerprint();
  const { data: wallet } = trpc.wallet.get.useQuery(
    { fingerprint },
    { enabled: !!fingerprint, staleTime: 30_000, refetchOnWindowFocus: false }
  );

  if (!fingerprint) return null;

  return (
    <Link
      href="/carteira"
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-qs/30 bg-qs/10 hover:bg-qs/20 transition-colors"
      aria-label={`Sua carteira: ${wallet?.qBalance ?? 0} Qs`}
      title="Sua carteira de Qs"
    >
      <QCoin className="w-4 h-4" />
      <span className="text-sm font-bold text-qs tabular-nums">
        {(wallet?.qBalance ?? 0).toLocaleString("pt-BR")}
      </span>
    </Link>
  );
}
