import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "server/_core/.env") });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  ssl: url.hostname.includes("tidbcloud.com") ? { rejectUnauthorized: true } : undefined,
};

const conn = await mysql.createConnection(config);

const newMarkets = [
  {
    slug: "dolar-2026-acima-6",
    title: "Você acha que o dólar fechará 2026 acima de R$6,00?",
    description: "Enquete sobre a cotação do dólar ao final de 2026. Resolução: Dezembro 2026. Fonte: Banco Central do Brasil.",
    category: "economia",
    optionA: "SIM",
    optionB: "NÃO",
    labelA: "Acima de R$6,00",
    labelB: "Abaixo de R$6,00",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/dolar-2026-Xm2V86be7CTGS4LNdVmnha.webp",
    endsAt: "2026-12-31 23:59:59",
  },
  {
    slug: "gasolina-2026-acima-7",
    title: "Você acha que a gasolina fechará acima de R$7,00 em 2026?",
    description: "Enquete sobre o preço médio da gasolina no Brasil em 2026. Resolução: 2026. Fonte: ANP.",
    category: "economia",
    optionA: "SIM",
    optionB: "NÃO",
    labelA: "Acima de R$7,00",
    labelB: "Abaixo de R$7,00",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/gasolina-2026-d2pmHsFnBZJ6eMqdYem8Ss.webp",
    endsAt: "2026-12-31 23:59:59",
  },
  {
    slug: "artista-brasileiro-top10-spotify-2026",
    title: "Você acha que algum artista brasileiro ficará no TOP 10 global do Spotify em 2026?",
    description: "Enquete sobre a presença de artistas brasileiros nos rankings globais do Spotify. Resolução: rankings oficiais 2026. Fonte: Spotify Charts Globais.",
    category: "entretenimento",
    optionA: "SIM",
    optionB: "NÃO",
    labelA: "Sim, terá brasileiro",
    labelB: "Não terá brasileiro",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/spotify-brasil-2026-mpmzxxHSg7pstAQRkdnXvA.webp",
    endsAt: "2026-12-31 23:59:59",
  },
  {
    slug: "flamengo-campeao-brasileirao-2026",
    title: "Você acha que o Flamengo vai ser campeão do Brasileirão 2026?",
    description: "Enquete sobre o campeão do Campeonato Brasileiro Série A 2026. Resolução: final do Brasileirão 2026. Fonte: Campeonato Brasileiro Série A classificação oficial.",
    category: "esportes",
    optionA: "SIM",
    optionB: "NÃO",
    labelA: "Flamengo campeão",
    labelB: "Outro time campeão",
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/flamengo-brasileirao-2026-hakRj2ZbdyVuf6UTju4qWa.webp",
    endsAt: "2026-12-31 23:59:59",
  },
];

for (const m of newMarkets) {
  try {
    // Check if market already exists
    const [existing] = await conn.execute("SELECT id FROM markets WHERE slug = ?", [m.slug]);
    if (existing.length > 0) {
      console.log(`Market "${m.slug}" already exists, skipping.`);
      continue;
    }
    await conn.execute(
      `INSERT INTO markets (slug, title, description, category, optionA, optionB, labelA, labelB, imageUrl, isActive, endsAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [m.slug, m.title, m.description, m.category, m.optionA, m.optionB, m.labelA, m.labelB, m.imageUrl, m.endsAt]
    );
    console.log(`Inserted market: ${m.slug}`);
  } catch (e) {
    console.error(`Error inserting ${m.slug}:`, e.message);
  }
}

await conn.end();
console.log("Done!");
