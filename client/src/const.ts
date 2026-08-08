export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * URL do fluxo de login com Google (servidor troca o code e cria a sessão —
 * ver server/_core/googleAuth.ts). `returnPath` é para onde o usuário volta
 * depois de autenticar; `fingerprint` é o anônimo atual do navegador, para o
 * servidor tentar adotá-lo como identidade permanente da conta no primeiro
 * login (preserva Qs/badges de quem já opinava antes de criar conta).
 */
export const getGoogleAuthStartUrl = (returnPath?: string, fingerprint?: string) => {
  const params = new URLSearchParams();
  if (returnPath) params.set("returnPath", returnPath);
  if (fingerprint) params.set("fp", fingerprint);
  const query = params.toString();
  return `/api/auth/google/start${query ? `?${query}` : ""}`;
};
