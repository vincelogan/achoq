export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

/**
 * Interruptor único da obrigatoriedade de conta para votar. O sistema de
 * login (e-mail/senha + Google) está pronto e funcional dos dois lados
 * (server/routers.ts markets.vote, client useVote/LoginGateModal) — só a
 * exigência está desligada por decisão do dono. Virar para `true` volta a
 * exigir sessão autenticada para opinar, sem mexer em mais nada.
 */
export const REQUIRE_ACCOUNT_TO_VOTE = false;
