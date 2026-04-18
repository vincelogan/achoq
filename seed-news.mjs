import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const url = new URL(DATABASE_URL);
const pool = await mysql.createPool({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: true },
});

// Buscar IDs dos mercados por slug
const [markets] = await pool.query("SELECT id, slug FROM markets WHERE isActive = 1");
const slugToId = {};
for (const m of markets) {
  slugToId[m.slug] = m.id;
}

console.log("Markets found:", Object.keys(slugToId));

const newsData = [
  {
    slug: "eleicoes-2026",
    tickerText: "Quaest: Flávio Bolsonaro 42% x Lula 40% no 2º turno; empate técnico (Quaest/Genial, abr/2026)",
    contextText: "Pesquisa Genial/Quaest de 15/abr mostra pela 1ª vez Flávio Bolsonaro (42%) numericamente à frente de Lula (40%) no 2º turno, dentro da margem de erro. No 1º turno, Lula lidera com 28%. Datafolha aponta rejeição de 48% a Lula. Cenário eleitoral segue aberto e volátil.",
    sourceName: "Genial/Quaest",
    sourceUrl: "https://g1.globo.com/politica/eleicoes/2026/",
    newsDate: "2026-04-15",
  },
  {
    slug: "copa-2026",
    tickerText: "Brasil no Grupo C: estreia contra Marrocos em 13/jun. Convocação em 18/mai (GE, abr/2026)",
    contextText: "Brasil classificado no Grupo C da Copa 2026 ao lado de Marrocos, Haiti e Escócia. Ancelotti anuncia convocação em 18/mai. Preparação na Granja Comary começa em 25/mai. Amistosos contra França e Croácia em Orlando antes da estreia.",
    sourceName: "GE / Globo Esporte",
    sourceUrl: "https://ge.globo.com/futebol/copa-do-mundo/",
    newsDate: "2026-04-18",
  },
  {
    slug: "neymar-copa",
    tickerText: "Datafolha: 53% dos brasileiros apoiam convocação de Neymar para a Copa (Datafolha, abr/2026)",
    contextText: "Pesquisa Datafolha (7-9/abr) aponta 53% favoráveis à convocação de Neymar e 34% contra. Ancelotti afirmou que Neymar pode ir à Copa se estiver 100% fisicamente. Neymar tem 9 jogos pelo Santos para provar condição física até a convocação.",
    sourceName: "Datafolha / CNN Brasil",
    sourceUrl: "https://www.cnnbrasil.com.br/esportes/",
    newsDate: "2026-04-18",
  },
  {
    slug: "bbb-26-campeao",
    tickerText: "Final do BBB 26 em 21/abr: Juliano Floss é 1º finalista; Ana Paula favorita com 43,97% (UOL, abr/2026)",
    contextText: "Final do BBB 26 confirmada para 21/abr. Juliano Floss venceu prova do finalista e é o 1º confirmado. Ana Paula Renault lidera favoritismo com 43,97% na enquete UOL. Prêmio de R$5,44 milhões. Último paredão define os demais finalistas.",
    sourceName: "UOL / O Globo",
    sourceUrl: "https://oglobo.globo.com/cultura/televisao/bbb/",
    newsDate: "2026-04-18",
  },
  {
    slug: "dolar-2026-acima-6",
    tickerText: "Boletim Focus: mercado projeta dólar a R$5,40 no fim de 2026 (Banco Central, abr/2026)",
    contextText: "Boletim Focus do Banco Central projeta dólar a R$5,40 no fim de 2026 e R$5,45 em 2027. IPCA projetado em 4,71%, acima da meta. Dólar recuou ao menor patamar em 2 anos recentemente, mas analistas alertam para volatilidade com cenário fiscal e guerra comercial.",
    sourceName: "Banco Central / XP",
    sourceUrl: "https://www.bcb.gov.br/publicacoes/focus",
    newsDate: "2026-04-14",
  },
  {
    slug: "gasolina-2026-acima-7",
    tickerText: "Gasolina a R$6,77/litro em média no Brasil; ICMS subiu para R$1,57/litro em 2026 (ANP, abr/2026)",
    contextText: "Preço médio da gasolina comum no Brasil é R$6,77/litro segundo ANP (10/abr). ICMS da gasolina subiu para R$1,57/litro em 2026 (+6,8%). Governo prepara medidas contra alta. Para chegar a R$7,00, faltam R$0,23/litro — cenário possível com nova alta do petróleo.",
    sourceName: "ANP / Agência Brasil",
    sourceUrl: "https://economia.uol.com.br/noticias/redacao/2026/04/10/balanco-anp---10-de-abril-de-2026.ghtm",
    newsDate: "2026-04-10",
  },
  {
    slug: "artista-brasileiro-top10-spotify-2026",
    tickerText: "Anitta no #143 global do Spotify; 'Choka Choka' c/ Shakira estreou no #89 global (Spotify, abr/2026)",
    contextText: "Anitta ocupa #143 no ranking diário global do Spotify e #22 no Brasil. 'Choka Choka' com Shakira estreou em #89 global com 1,75M streams. Anitta foi a 1ª brasileira no #1 global do Spotify (2022). Desafio: manter-se no Top 10 ao longo de 2026.",
    sourceName: "Spotify Charts",
    sourceUrl: "https://kworb.net/spotify/country/br_weekly.html",
    newsDate: "2026-04-16",
  },
  {
    slug: "flamengo-campeao-brasileirao-2026",
    tickerText: "Flamengo é vice-líder do Brasileirão 2026 com 20 pts, 6 atrás do Palmeiras (Estadão, abr/2026)",
    contextText: "Após 11 rodadas, Flamengo é vice-líder do Brasileirão 2026 com 20 pontos (6V, 2E, 3D), 6 pontos atrás do líder Palmeiras (26 pts). São Paulo e Fluminense empatados com 20 pontos completam o G4. Campeonato ainda no início com 27 rodadas restantes.",
    sourceName: "Estadão / UOL Esporte",
    sourceUrl: "https://www.estadao.com.br/esportes/futebol/campeonatos/brasileirao-serie-a-2026/",
    newsDate: "2026-04-18",
  },
];

let inserted = 0;
for (const news of newsData) {
  const marketId = slugToId[news.slug];
  if (!marketId) {
    console.warn(`Market not found for slug: ${news.slug}`);
    continue;
  }

  await pool.query(
    "INSERT INTO market_news (marketId, tickerText, contextText, sourceName, sourceUrl, newsDate, isActive) VALUES (?, ?, ?, ?, ?, ?, 1)",
    [marketId, news.tickerText, news.contextText, news.sourceName, news.sourceUrl, news.newsDate]
  );
  inserted++;
  console.log(`✅ Inserted news for: ${news.slug}`);
}

console.log(`\nTotal: ${inserted} news items inserted.`);
await pool.end();
