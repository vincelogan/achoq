import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { createUserSessionToken } from "./userSession";
import { ENV } from "./env";

/**
 * Login direto com Google (substitui o antigo fluxo "Manus OAuth", que
 * dependia de conta no Manus.im e nunca foi usado por visitante real — ver
 * server/_core/userSession.ts). Sem SDK de terceiros: troca o `code` por
 * token via fetch nativo e verifica o `id_token` com o JWKS público do
 * Google usando `jose` (já era dependência do projeto).
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const STATE_COOKIE = "google_oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

function getStateSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "dev-only-secret-not-for-production";
  return new TextEncoder().encode(secret);
}

/** Só aceita paths internos relativos — bloqueia open redirect (inclusive `//evil.com`). */
function sanitizeReturnPath(path: string | undefined): string {
  if (!path) return "/";
  if (!path.startsWith("/") || path.startsWith("//")) return "/";
  return path;
}

function getRedirectUri(req: Request): string {
  const proto = req.headers["x-forwarded-proto"]?.toString().split(",")[0]?.trim() || req.protocol;
  const host = req.headers["x-forwarded-host"]?.toString() || req.get("host");
  return `${proto}://${host}/api/auth/google/callback`;
}

export function registerGoogleAuthRoutes(app: Express) {
  app.get("/api/auth/google/start", async (req: Request, res: Response) => {
    if (!ENV.googleClientId) {
      res.status(503).send("Login com Google ainda não configurado neste ambiente.");
      return;
    }

    const returnPath = sanitizeReturnPath(getQueryParam(req, "returnPath"));
    const fingerprint = getQueryParam(req, "fp") ?? null;

    // Nonce assinado em cookie de curta duração — verificado no callback para
    // impedir CSRF (o `state` antigo do fluxo Manus era só dado ida-e-volta,
    // nunca validado contra nada que o servidor tivesse emitido).
    const nonce = randomUUID();
    const stateToken = await new SignJWT({ nonce, returnPath, fingerprint })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(Math.floor((Date.now() + STATE_TTL_MS) / 1000))
      .sign(getStateSecret());

    res.cookie(STATE_COOKIE, nonce, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: req.protocol === "https",
      maxAge: STATE_TTL_MS,
    });

    const params = new URLSearchParams({
      client_id: ENV.googleClientId,
      redirect_uri: getRedirectUri(req),
      response_type: "code",
      scope: "openid email profile",
      state: stateToken,
      prompt: "select_account",
    });
    res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const stateToken = getQueryParam(req, "state");
    const cookieNonce = (req as any).cookies?.[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, { path: "/" });

    if (!code || !stateToken) {
      res.status(400).send("Parâmetros ausentes no retorno do Google.");
      return;
    }

    let statePayload: { nonce: string; returnPath: string; fingerprint: string | null };
    try {
      const { payload } = await jwtVerify(stateToken, getStateSecret(), { algorithms: ["HS256"] });
      statePayload = payload as any;
    } catch {
      res.status(400).send("Sessão de login expirada ou inválida. Tente novamente.");
      return;
    }

    if (!cookieNonce || cookieNonce !== statePayload.nonce) {
      res.status(400).send("Falha na verificação de segurança do login. Tente novamente.");
      return;
    }

    const returnPath = sanitizeReturnPath(statePayload.returnPath);

    try {
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: getRedirectUri(req),
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) throw new Error(`Google token exchange failed: ${tokenRes.status}`);
      const tokenData = (await tokenRes.json()) as { id_token?: string };
      if (!tokenData.id_token) throw new Error("Google não retornou id_token");

      const { payload } = await jwtVerify(tokenData.id_token, GOOGLE_JWKS, {
        issuer: ["https://accounts.google.com", "accounts.google.com"],
        audience: ENV.googleClientId,
      });

      const googleSub = payload.sub as string;
      const email = payload.email as string | undefined;
      const name = (payload.name as string | undefined) ?? null;
      if (!googleSub || !email) throw new Error("Perfil do Google incompleto (sem sub/email)");

      const user = await db.upsertGoogleUser({
        googleSub,
        email,
        name,
        fingerprintCandidate: statePayload.fingerprint,
      });

      const sessionToken = await createUserSessionToken(user.id);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, returnPath);
    } catch (error) {
      console.error("[GoogleAuth] Callback failed:", error);
      res.status(500).send("Não foi possível concluir o login com Google. Tente novamente.");
    }
  });
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}
