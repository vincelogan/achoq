import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, getClientIp, RateLimitError, resetRateLimits } from "./rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("permite até `max` hits na janela", () => {
    for (let i = 0; i < 5; i++) {
      expect(() => checkRateLimit("k1", 5, 60_000)).not.toThrow();
    }
  });

  it("lança RateLimitError no hit que excede o limite", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("k2", 3, 60_000);
    expect(() => checkRateLimit("k2", 3, 60_000)).toThrow(RateLimitError);
  });

  it("chaves diferentes têm contadores independentes", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("a", 3, 60_000);
    expect(() => checkRateLimit("b", 3, 60_000)).not.toThrow();
  });

  it("hits fora da janela expiram", () => {
    // janela de 1ms: o hit antigo já expirou quando o próximo chega
    checkRateLimit("k3", 1, 1);
    const start = Date.now();
    while (Date.now() - start < 5) {
      /* espera ~5ms */
    }
    expect(() => checkRateLimit("k3", 1, 1)).not.toThrow();
  });
});

describe("getClientIp", () => {
  it("prefere o primeiro IP de x-forwarded-for", () => {
    const req = { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" }, ip: "10.0.0.1" } as any;
    expect(getClientIp(req)).toBe("203.0.113.7");
  });

  it("cai para req.ip sem x-forwarded-for", () => {
    const req = { headers: {}, ip: "198.51.100.2" } as any;
    expect(getClientIp(req)).toBe("198.51.100.2");
  });

  it("retorna 'unknown' sem req", () => {
    expect(getClientIp(undefined)).toBe("unknown");
  });
});
