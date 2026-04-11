import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("score.get", () => {
  it("returns score data for a fingerprint", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.score.get({ fingerprint: "test_fingerprint_12345" });

    expect(result).toHaveProperty("totalResolved");
    expect(result).toHaveProperty("correct");
    expect(result).toHaveProperty("score");
    expect(typeof result.totalResolved).toBe("number");
    expect(typeof result.correct).toBe("number");
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns zero score for unknown fingerprint", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.score.get({ fingerprint: "nonexistent_fp_99999" });

    expect(result.totalResolved).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.score).toBe(0);
  });

  it("rejects fingerprint that is too short", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.score.get({ fingerprint: "abc" })).rejects.toThrow();
  });
});

describe("score.history", () => {
  it("returns vote history for a fingerprint", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.score.history({ fingerprint: "test_fingerprint_12345" });

    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array for unknown fingerprint", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.score.history({ fingerprint: "nonexistent_fp_99999" });

    expect(result).toEqual([]);
  });
});

describe("markets.list", () => {
  it("returns markets with stats", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.markets.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    const market = result[0];
    expect(market).toHaveProperty("id");
    expect(market).toHaveProperty("slug");
    expect(market).toHaveProperty("title");
    expect(market).toHaveProperty("stats");
    expect(market.stats).toHaveProperty("countA");
    expect(market.stats).toHaveProperty("countB");
    expect(market.stats).toHaveProperty("total");
    expect(market.stats).toHaveProperty("pctA");
    expect(market.stats).toHaveProperty("pctB");
  });

  it("includes new markets (dolar, gasolina, spotify, flamengo)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.markets.list();
    const slugs = result.map((m: any) => m.slug);

    expect(slugs).toContain("dolar-2026-acima-6");
    expect(slugs).toContain("gasolina-2026-acima-7");
    expect(slugs).toContain("artista-brasileiro-top10-spotify-2026");
    expect(slugs).toContain("flamengo-campeao-brasileirao-2026");
  });
});
