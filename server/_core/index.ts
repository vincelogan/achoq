import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolver __dirname para ESM (dev) e CJS (produção/Lambda)
const __dirnameCompat = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

// Carregar .env do mesmo diretório do index.js (necessário no Lambda do Amplify)
dotenv.config({ path: path.resolve(__dirnameCompat, ".env") });

import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { SignJWT, jwtVerify } from "jose";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";

// ─── Admin Auth Helpers ────────────────────────────────────────────────────────

const ADMIN_COOKIE = "admin_session";

function getAdminSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || "fallback-admin-secret-change-me";
  return new TextEncoder().encode(secret);
}

async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getAdminSecret());
}

async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getAdminSecret());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.[ADMIN_COOKIE];
  if (!token) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  const valid = await verifyAdminToken(token);
  if (!valid) {
    res.status(401).json({ error: "Sessão inválida ou expirada" });
    return;
  }
  next();
}

// ─── Port Helpers ──────────────────────────────────────────────────────────────

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

// ─── Server ────────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Cookie parser (necessário para ler req.cookies)
  const cookieParser = (await import("cookie-parser")).default;
  app.use(cookieParser());

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ── Admin Login ──────────────────────────────────────────────────────────────
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    const { password } = req.body as { password?: string };
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      res.status(500).json({ error: "ADMIN_PASSWORD não configurado no servidor" });
      return;
    }

    const trimmedEnvPassword = adminPassword.trim();
    if (!password || password !== trimmedEnvPassword) {
      res.status(401).json({ error: "Senha incorreta" });
      return;
    }

    const token = await signAdminToken();
    res.cookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      path: "/",
    });
    res.json({ success: true });
  });

  // ── Admin Logout ─────────────────────────────────────────────────────────────
  app.post("/api/admin/logout", (_req: Request, res: Response) => {
    res.clearCookie(ADMIN_COOKIE, { path: "/" });
    res.json({ success: true });
  });

  // ── Admin Auth Check ─────────────────────────────────────────────────────────
  app.get("/api/admin/me", async (req: Request, res: Response) => {
    const token = req.cookies?.[ADMIN_COOKIE];
    if (!token) {
      res.json({ authenticated: false });
      return;
    }
    const valid = await verifyAdminToken(token);
    res.json({ authenticated: valid });
  });

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

  // ── Scheduled: Listar enquetes com endsAt vencido e ainda ativas ────────────
  app.get("/api/scheduled/pending-markets", async (_req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) { res.json({ markets: [] }); return; }
      const { sql } = await import("drizzle-orm");
      const rows = await db.execute(
        sql`SELECT id, title, description, optionA, optionB, category, endsAt
            FROM markets
            WHERE isActive = 1
              AND resolvedChoice IS NULL
              AND endsAt IS NOT NULL
              AND endsAt < NOW()
            ORDER BY endsAt ASC
            LIMIT 20`
      );
      const markets = Array.isArray(rows[0]) ? rows[0] : (rows as any).rows || [];
      res.json({ markets });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Scheduled: Resolução automática de enquetes ────────────────────────────────
  // Endpoint chamado pelo agente agendado para resolver enquetes e calcular pontos
  // Aceita role "user" (cookie de scheduled task) ou admin cookie
  app.post("/api/scheduled/resolve-markets", async (req: Request, res: Response) => {
    // Verificar autenticação: admin cookie OU bearer token de scheduled task
    const adminToken = req.cookies?.[ADMIN_COOKIE];
    const bearerToken = req.headers.authorization?.replace("Bearer ", "");
    const scheduledSecret = process.env.SCHEDULED_SECRET || process.env.JWT_SECRET;

    let authorized = false;
    if (adminToken) {
      authorized = await verifyAdminToken(adminToken);
    } else if (bearerToken && scheduledSecret) {
      try {
        const { jwtVerify } = await import("jose");
        const secret = new TextEncoder().encode(scheduledSecret);
        await jwtVerify(bearerToken, secret);
        authorized = true;
      } catch {
        authorized = false;
      }
    }

    if (!authorized) {
      res.status(401).json({ error: "Não autorizado" });
      return;
    }

    try {
      const { resolutions } = req.body as {
        resolutions: Array<{ marketId: number; resolvedChoice: "A" | "B" }>;
      };

      if (!Array.isArray(resolutions) || resolutions.length === 0) {
        res.status(400).json({ error: "resolutions deve ser um array não vazio" });
        return;
      }

      const { updateMarket, recalcScoresForMarket } = await import("../db");
      const results: Array<{ marketId: number; success: boolean; error?: string }> = [];

      for (const r of resolutions) {
        try {
          await updateMarket(r.marketId, { resolvedChoice: r.resolvedChoice, isActive: false });
          await recalcScoresForMarket(r.marketId);
          results.push({ marketId: r.marketId, success: true });
        } catch (e: any) {
          results.push({ marketId: r.marketId, success: false, error: e.message });
        }
      }

      res.json({ success: true, results });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
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
