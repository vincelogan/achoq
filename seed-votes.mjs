import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Buscar todos os mercados ativos
  const [markets] = await connection.execute('SELECT id, slug, title FROM markets WHERE isActive = 1');
  console.log(`Encontrados ${markets.length} mercados ativos`);
  
  // Regiões brasileiras para simular dados demográficos
  const regions = [
    'São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná',
    'Rio Grande do Sul', 'Pernambuco', 'Ceará', 'Pará', 'Santa Catarina',
    'Goiás', 'Maranhão', 'Amazonas', 'Espírito Santo', 'Paraíba',
    'Mato Grosso', 'Distrito Federal', 'Mato Grosso do Sul', 'Alagoas', 'Piauí'
  ];
  
  // Distribuição de votos por enquete (percentual de votos em A)
  const voteDistributions = {
    'eleicoes-2026': 0.65,           // 65% Esquerda
    'copa-2026': 0.40,               // 40% Sim (Brasil ganha)
    'neymar-copa-2026': 0.20,        // 20% Sim (Neymar convocado)
    'bbb-26': 0.45,                  // 45% Ana Paula
    'dolar-2026-acima-6': 0.72,      // 72% Sim (dólar acima de 6)
    'gasolina-2026-acima-7': 0.58,   // 58% Sim (gasolina acima de 7)
    'artista-brasileiro-top10-spotify-2026': 0.65, // 65% Sim
    'flamengo-campeao-brasileirao-2026': 0.35,     // 35% Sim (Flamengo campeão)
  };
  
  let totalInserted = 0;
  
  for (const market of markets) {
    // Gerar entre 200 e 300 votos aleatórios
    const numVotes = Math.floor(Math.random() * 101) + 200; // 200-300
    const pctA = voteDistributions[market.slug] || 0.50;
    
    console.log(`\nMercado: ${market.title} (${market.slug})`);
    console.log(`  Inserindo ${numVotes} votos (${Math.round(pctA * 100)}% opção A)...`);
    
    // Gerar votos em lotes de 50 para performance
    const batchSize = 50;
    let inserted = 0;
    
    for (let batch = 0; batch < Math.ceil(numVotes / batchSize); batch++) {
      const currentBatchSize = Math.min(batchSize, numVotes - inserted);
      const values = [];
      const placeholders = [];
      
      for (let i = 0; i < currentBatchSize; i++) {
        const choice = Math.random() < pctA ? 'A' : 'B';
        const region = regions[Math.floor(Math.random() * regions.length)];
        // Gerar fingerprint aleatório único
        const fp = `sim_${market.id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        // Data aleatória nos últimos 30 dias
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
        
        placeholders.push('(?, ?, ?, ?, ?, ?)');
        values.push(market.id, choice, fp, 'BR', region, date.toISOString().slice(0, 19).replace('T', ' '));
      }
      
      const sql = `INSERT INTO votes (marketId, choice, fingerprint, country, region, createdAt) VALUES ${placeholders.join(', ')}`;
      await connection.execute(sql, values);
      inserted += currentBatchSize;
    }
    
    totalInserted += inserted;
    console.log(`  ✓ ${inserted} votos inseridos`);
  }
  
  console.log(`\n✅ Total: ${totalInserted} votos inseridos em ${markets.length} enquetes`);
  
  // Verificar contagem final
  const [counts] = await connection.execute(`
    SELECT m.slug, m.title, COUNT(v.id) as total,
      SUM(CASE WHEN v.choice = 'A' THEN 1 ELSE 0 END) as votesA,
      SUM(CASE WHEN v.choice = 'B' THEN 1 ELSE 0 END) as votesB
    FROM markets m
    LEFT JOIN votes v ON v.marketId = m.id
    GROUP BY m.id, m.slug, m.title
    ORDER BY m.id
  `);
  
  console.log('\n📊 Contagem final de votos:');
  for (const row of counts) {
    const pctA = row.total > 0 ? Math.round((row.votesA / row.total) * 100) : 0;
    console.log(`  ${row.slug}: ${row.total} votos (A: ${pctA}%, B: ${100 - pctA}%)`);
  }
  
  await connection.end();
}

main().catch(console.error);
