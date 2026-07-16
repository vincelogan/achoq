import type { Request } from "express";

/**
 * Rate limiter em memória por janela deslizante.
 *
 * Caveat (documentado por design): em ambientes serverless com múltiplas
 * instâncias (AWS Lambda), cada instância tem seu próprio contador — o limite
 * efetivo é "por instância". Ainda assim reduz abuso de forma barata; se um
 * dia for necessário limite global, trocar por armazenamento compartilhado
 * (tabela/Redis) sem mudar a interface.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

// Limpeza periódica para não acumular chaves antigas indefinidamente
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(now: number, windowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  buckets.forEach((bucket, key) => {
    bucket.timestamps = bucket.timestamps.filter((t: number) => now - t < windowMs);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  });
}

export class RateLimitError extends Error {
  constructor(message = "Muitas tentativas. Aguarde um pouco e tente novamente.") {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Registra um hit para a chave e lança RateLimitError se exceder `max` hits
 * na janela `windowMs`.
 */
export function checkRateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  cleanup(now, windowMs);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= max) {
    throw new RateLimitError();
  }
  bucket.timestamps.push(now);
}

/** Extrai o IP do cliente considerando proxies (Amplify/CloudFront). */
export function getClientIp(req: Pick<Request, "headers" | "ip"> | undefined): string {
  if (!req) return "unknown";
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip ?? "unknown";
}

// Limites padrão por rota (hits, janela em ms)
export const RATE_LIMITS = {
  vote: { max: 30, windowMs: 60 * 60 * 1000 },
  adminLogin: { max: 5, windowMs: 15 * 60 * 1000 },
  nickname: { max: 5, windowMs: 60 * 60 * 1000 },
  comments: { max: 10, windowMs: 60 * 60 * 1000 },
  shop: { max: 30, windowMs: 60 * 60 * 1000 },
} as const;

/** Apenas para testes: limpa todos os contadores. */
export function resetRateLimits(): void {
  buckets.clear();
}
