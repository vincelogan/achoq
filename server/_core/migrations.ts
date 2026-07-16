import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { sql } from "drizzle-orm";
import { getDb } from "../db";

/**
 * Executa as migrations pendentes do drizzle em runtime (endpoint do admin).
 *
 * Existe porque o banco de produção (TiDB provisionado pela plataforma) não é
 * acessível fora do Lambda — o build do Amplify não roda migrations e o dono
 * não tem acesso ao console do banco. O botão no /admin chama isto.
 *
 * Robustez:
 * - Localiza a pasta drizzle/ tanto em dev (repo) quanto no bundle do Lambda.
 * - Se o banco nunca teve o journal (__drizzle_migrations) mas as tabelas
 *   antigas existem (setup via outro fluxo), faz backfill das migrations
 *   0000–0005 antes de aplicar as novas — senão o migrator tentaria recriar
 *   tabelas existentes.
 * - Idempotente: re-executar sem migrations pendentes é no-op.
 */

const dirnameCompat = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

/** Migrations que existiam antes do journal poder estar ausente (0000–0005). */
const LEGACY_MIGRATION_COUNT = 6;

export function findMigrationsFolder(): string | null {
  const candidates = [
    path.resolve(dirnameCompat, "drizzle"), // Lambda: compute/default/drizzle
    path.resolve(dirnameCompat, "../../drizzle"), // dev: server/_core → repo/drizzle
    path.resolve(process.cwd(), "drizzle"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "meta", "_journal.json"))) {
      return candidate;
    }
  }
  return null;
}

type JournalEntry = { idx: number; tag: string; when: number };

function readJournal(folder: string): JournalEntry[] {
  const journal = JSON.parse(fs.readFileSync(path.join(folder, "meta", "_journal.json"), "utf-8"));
  return journal.entries as JournalEntry[];
}

async function countJournalRows(db: any): Promise<number | null> {
  try {
    const result = await db.execute(sql`SELECT COUNT(*) AS n FROM __drizzle_migrations`);
    const rows: any[] = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];
    return Number(rows[0]?.n ?? 0);
  } catch {
    return null; // tabela de journal não existe
  }
}

async function tableExists(db: any, name: string): Promise<boolean> {
  try {
    const result = await db.execute(
      sql`SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ${name}`
    );
    const rows: any[] = Array.isArray(result[0]) ? result[0] : (result as any).rows ?? [];
    return Number(rows[0]?.n ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function runPendingMigrations(): Promise<{
  journalBefore: number;
  journalAfter: number;
  applied: number;
  backfilled: boolean;
  folder: string;
}> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível (DATABASE_URL não configurada).");

  const folder = findMigrationsFolder();
  if (!folder) throw new Error("Pasta de migrations não encontrada no deploy.");

  const entries = readJournal(folder);

  // Garantir a tabela de journal (mesma DDL que o migrator do drizzle usa)
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )`
  );

  let journalBefore = (await countJournalRows(db)) ?? 0;
  let backfilled = false;

  // Banco antigo sem journal: se as tabelas legadas existem, registrar
  // 0000–0005 como aplicadas para o migrator não tentar recriá-las.
  if (journalBefore === 0 && (await tableExists(db, "user_scores"))) {
    for (const entry of entries.slice(0, LEGACY_MIGRATION_COUNT)) {
      const content = fs.readFileSync(path.join(folder, `${entry.tag}.sql`), "utf-8");
      const hash = crypto.createHash("sha256").update(content).digest("hex");
      await db.execute(
        sql`INSERT INTO __drizzle_migrations (hash, created_at) VALUES (${hash}, ${entry.when})`
      );
    }
    backfilled = true;
    journalBefore = LEGACY_MIGRATION_COUNT;
  }

  const { migrate } = await import("drizzle-orm/mysql2/migrator");
  await migrate(db, { migrationsFolder: folder });

  const journalAfter = (await countJournalRows(db)) ?? 0;
  return {
    journalBefore,
    journalAfter,
    applied: Math.max(0, journalAfter - journalBefore),
    backfilled,
    folder,
  };
}
