import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Inserir enquete da Selic
const [result] = await conn.execute(
  `INSERT INTO markets (
    id, slug, title, description, optionA, optionB, labelA, labelB,
    category, imageUrl, endsAt,
    isActive, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    70001,
    'selic-abaixo-10-2026',
    'Você acha que a Selic ficará abaixo de 10% até dezembro de 2026?',
    'A taxa Selic é a taxa básica de juros da economia brasileira, definida pelo Comitê de Política Monetária (COPOM) do Banco Central. Atualmente em patamar elevado, a questão é se o BC conseguirá reduzi-la abaixo de 10% ao ano até o final de 2026.',
    'SIM',
    'NÃO',
    'SIM',
    'NÃO',
    'economia',
    'https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/selic-2026-HVX9KiYixzErQ6uBPkqW2F.webp',
    new Date('2026-12-31'),
    1,
    new Date(),
    new Date()
  ]
);

console.log('Selic enquete criada:', result.insertId || 70001);

// Inserir notícia de contexto
const [newsResult] = await conn.execute(
  `INSERT INTO market_news (
    marketId, tickerText, contextText, sourceName, sourceUrl,
    newsDate, isActive, createdAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    70001,
    'Selic em 14,75%: COPOM eleva juros em abril/2026 — debate sobre queda abaixo de 10% até dezembro (Banco Central)',
    'O COPOM elevou a Selic para 14,75% ao ano em abril de 2026, maior patamar em quase duas décadas. Analistas divergem sobre a possibilidade de queda abaixo de 10% até o final do ano, dado o cenário de inflação persistente e incertezas fiscais.',
    'Banco Central do Brasil',
    'https://www.bcb.gov.br/controleinflacao/copom',
    new Date('2026-04-24'),
    1,
    new Date()
  ]
);

console.log('Notícia da Selic inserida:', newsResult.insertId);

// Inserir votos aleatórios (200-300)
const totalVotes = Math.floor(Math.random() * 101) + 200; // 200-300
const simPct = 0.28 + Math.random() * 0.12; // 28-40% SIM (maioria acha que não vai cair abaixo de 10%)
const simVotes = Math.round(totalVotes * simPct);
const naoVotes = totalVotes - simVotes;

const states = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO', 'DF', 'PE'];
const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+'];
const genders = ['M', 'F'];

const votesToInsert = [];
for (let i = 0; i < simVotes; i++) {
  votesToInsert.push([
    70001,
    `anon-selic-sim-${Date.now()}-${i}`,
    'A',
    states[Math.floor(Math.random() * states.length)],
    ageGroups[Math.floor(Math.random() * ageGroups.length)],
    genders[Math.floor(Math.random() * genders.length)],
    new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    new Date()
  ]);
}
for (let i = 0; i < naoVotes; i++) {
  votesToInsert.push([
    70001,
    `anon-selic-nao-${Date.now()}-${i}`,
    'B',
    states[Math.floor(Math.random() * states.length)],
    ageGroups[Math.floor(Math.random() * ageGroups.length)],
    genders[Math.floor(Math.random() * genders.length)],
    new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    new Date()
  ]);
}

for (const vote of votesToInsert) {
  await conn.execute(
    `INSERT INTO votes (marketId, fingerprint, choice, state, ageGroup, gender, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    vote
  );
}

console.log(`${totalVotes} votos inseridos (${simVotes} SIM, ${naoVotes} NÃO)`);
await conn.end();
console.log('Enquete da Selic criada com sucesso!');
