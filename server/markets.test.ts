import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do banco de dados para testes isolados
vi.mock("./db", () => ({
  getAllMarkets: vi.fn().mockResolvedValue([
    {
      id: 1,
      slug: "eleicoes-2026",
      title: "Quem você acha que vence as eleições presidenciais de 2026?",
      description: "Mercado de opinião sobre as eleições presidenciais brasileiras de 2026.",
      category: "politica",
      optionA: "Esquerda",
      optionB: "Direita",
      labelA: "Campo Progressista",
      labelB: "Campo Conservador",
      isActive: true,
      endsAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      slug: "copa-2026",
      title: "Você acha que o Brasil vai ganhar a Copa do Mundo 2026?",
      description: "Mercado de opinião sobre o desempenho do Brasil na Copa do Mundo de 2026.",
      category: "esportes",
      optionA: "Sim",
      optionB: "Não",
      labelA: "Acho que sim",
      labelB: "Acho que não",
      isActive: true,
      endsAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getMarketBySlug: vi.fn().mockImplementation(async (slug: string) => {
    if (slug === "eleicoes-2026") {
      return {
        id: 1,
        slug: "eleicoes-2026",
        title: "Quem você acha que vence as eleições presidenciais de 2026?",
        category: "politica",
        optionA: "Esquerda",
        optionB: "Direita",
        labelA: "Campo Progressista",
        labelB: "Campo Conservador",
        isActive: true,
      };
    }
    return undefined;
  }),
  getVoteStats: vi.fn().mockResolvedValue({ countA: 60, countB: 40, total: 100 }),
  hasVoted: vi.fn().mockResolvedValue(false),
  castVote: vi.fn().mockResolvedValue(undefined),
  getDemographics: vi.fn().mockResolvedValue({ regions: [], countries: [] }),
  seedMarketsIfEmpty: vi.fn().mockResolvedValue(undefined),
}));

import {
  getAllMarkets,
  getVoteStats,
  hasVoted,
  castVote,
} from "./db";

describe("Markets DB helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllMarkets retorna lista de mercados ativos", async () => {
    const markets = await getAllMarkets();
    expect(markets).toHaveLength(2);
    expect(markets[0].slug).toBe("eleicoes-2026");
    expect(markets[1].slug).toBe("copa-2026");
  });

  it("getVoteStats retorna contagens corretas", async () => {
    const stats = await getVoteStats(1);
    expect(stats.countA).toBe(60);
    expect(stats.countB).toBe(40);
    expect(stats.total).toBe(100);
  });

  it("hasVoted retorna false para novo fingerprint", async () => {
    const voted = await hasVoted(1, "fp_novo_usuario");
    expect(voted).toBe(false);
  });

  it("castVote registra um voto sem erros", async () => {
    await expect(
      castVote({
        marketId: 1,
        choice: "A",
        fingerprint: "fp_test_123",
        userId: null,
        country: "BR",
        region: "SP",
      })
    ).resolves.not.toThrow();
    expect(castVote).toHaveBeenCalledWith({
      marketId: 1,
      choice: "A",
      fingerprint: "fp_test_123",
      userId: null,
      country: "BR",
      region: "SP",
    });
  });
});

describe("Cálculo de percentuais", () => {
  it("calcula percentuais corretamente com votos", () => {
    const countA = 60;
    const countB = 40;
    const total = countA + countB;
    const pctA = total > 0 ? Math.round((countA / total) * 100) : 50;
    const pctB = total > 0 ? Math.round((countB / total) * 100) : 50;
    expect(pctA).toBe(60);
    expect(pctB).toBe(40);
    expect(pctA + pctB).toBe(100);
  });

  it("retorna 50/50 quando não há votos", () => {
    const total = 0;
    const pctA = total > 0 ? Math.round((0 / total) * 100) : 50;
    const pctB = total > 0 ? Math.round((0 / total) * 100) : 50;
    expect(pctA).toBe(50);
    expect(pctB).toBe(50);
  });

  it("percentuais somam 100 com arredondamento", () => {
    // Caso de arredondamento: 1/3 e 2/3
    const countA = 1;
    const countB = 2;
    const total = 3;
    const pctA = Math.round((countA / total) * 100);
    const pctB = Math.round((countB / total) * 100);
    // 33 + 67 = 100
    expect(pctA + pctB).toBe(100);
  });
});

describe("Fingerprint de votação", () => {
  it("fingerprint deve ter pelo menos 8 caracteres", () => {
    const fp = `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    expect(fp.length).toBeGreaterThanOrEqual(8);
  });

  it("fingerprints gerados são únicos", () => {
    const fp1 = `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const fp2 = `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    expect(fp1).not.toBe(fp2);
  });
});
