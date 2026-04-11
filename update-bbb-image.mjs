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

const newBBBImage = "https://d2xsxph8kpxj0f.cloudfront.net/310419663028794623/X5pkFNdVA2a4EtC5Ypx3aG/bbb-brasil-2026_32fc6206.png";

// Update the BBB market image
const [result] = await conn.execute(
  "UPDATE markets SET imageUrl = ? WHERE slug = ?",
  [newBBBImage, "bbb-26-campeao"]
);
console.log("Updated BBB image:", result.affectedRows, "rows affected");

// Also list all markets to verify
const [rows] = await conn.execute("SELECT id, slug, imageUrl FROM markets");
console.log("\nAll markets:");
for (const row of rows) {
  console.log(`  ${row.id}: ${row.slug} -> ${row.imageUrl ? 'has image' : 'no image'}`);
}

await conn.end();
console.log("\nDone!");
