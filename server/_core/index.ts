import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolver __dirname para ESM (dev) e CJS (produção/Lambda)
const __dirnameCompat = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

// Carregar .env do mesmo diretório do index.js (necessário no Lambda do Amplify)
dotenv.config({ path: path.resolve(__dirnameCompat, ".env") });

import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health check / diagnostic endpoint
  app.get("/api/health", async (_req, res) => {
    const info: Record<string, any> = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + "..." : "NOT SET",
    };
    try {
      const db = await getDb();
      info.dbConnected = !!db;
      if (db) {
        const { sql } = await import("drizzle-orm");
        const result = await db.execute(sql`SELECT COUNT(*) as cnt FROM markets`);
        info.marketsCount = result[0]?.[0]?.cnt ?? result[0]?.cnt ?? "unknown";
      }
    } catch (e: any) {
      info.dbError = e.message;
    }
    res.json(info);
  });
  // Sitemap XML dinâmico para Google Search Console
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const db = await getDb();
      const { sql } = await import("drizzle-orm");
      const result = await db.execute(sql`SELECT slug, updatedAt, createdAt FROM markets WHERE isActive = 1`);
      const rows = Array.isArray(result[0]) ? result[0] : (result.rows || []);
      const baseUrl = "https://achoq.com.br";
      const today = new Date().toISOString().split("T")[0];
      const staticPages = [
        { loc: "/", priority: "1.0", changefreq: "daily", lastmod: today },
        { loc: "/como-funciona", priority: "0.7", changefreq: "monthly", lastmod: "2026-04-01" },
        { loc: "/ranking", priority: "0.8", changefreq: "daily", lastmod: today },
        { loc: "/metodologia", priority: "0.6", changefreq: "monthly", lastmod: "2026-04-01" },
        { loc: "/legal", priority: "0.5", changefreq: "monthly", lastmod: "2026-04-01" },
        { loc: "/termos", priority: "0.5", changefreq: "monthly", lastmod: "2026-04-01" },
        { loc: "/privacidade", priority: "0.5", changefreq: "monthly", lastmod: "2026-04-01" },
      ];
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      for (const page of staticPages) {
        xml += `  <url>\n    <loc>${baseUrl}${page.loc}</loc>\n    <lastmod>${page.lastmod}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
      }
      for (const row of rows) {
        const slug = (row as any).slug;
        const updatedAt = (row as any).updatedAt || (row as any).createdAt;
        const lastmod = updatedAt ? new Date(updatedAt).toISOString().split("T")[0] : today;
        if (slug) {
          xml += `  <url>\n    <loc>${baseUrl}/mercado/${slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
        }
      }
      xml += `</urlset>`;
      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (e) {
      res.status(500).send("Error generating sitemap");
    }
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
