import { trpc } from "@/lib/trpc";
import { setFingerprint } from "@/hooks/useFingerprint";

/**
 * Sessão de conta real (e-mail/senha ou Google) — não confundir com o
 * fingerprint anônimo, que continua existindo e é usado por baixo dos panos
 * pela carteira/badges/comentários/etc. Ao autenticar (ver Entrar.tsx), o
 * fingerprint canônico da conta é sincronizado com o localStorage.
 */
export function useAuth() {
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user: meQuery.data ?? null,
    isAuthenticated: !!meQuery.data,
    isLoading: meQuery.isLoading,
  };
}

/**
 * Depois de um login/cadastro bem-sucedido, sincroniza o fingerprint da conta
 * no localStorage e faz um reload completo — não uma navegação client-side.
 * `useFingerprint` é um estado lazy (useState(readOrCreateFingerprint)):
 * componentes já montados manteriam o fingerprint antigo em memória mesmo
 * depois de sobrescrever o localStorage, então navegação suave não basta.
 */
export function completeAuthAndRedirect(accountFingerprint: string | null | undefined, returnPath: string) {
  if (accountFingerprint) setFingerprint(accountFingerprint);
  window.location.assign(returnPath && returnPath.startsWith("/") && !returnPath.startsWith("//") ? returnPath : "/");
}
