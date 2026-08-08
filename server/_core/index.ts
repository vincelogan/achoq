import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolver __dirname para ESM (dev) e CJS (produção/Lambda)
const __dirnameCompat = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(fileURLToPath(import.meta.url));

// Carregar .env do mesmo diretório do index.js (necessário no Lambda do Amplify)
dotenv.config({ path: path.resolve(__dirnameCompat, ".env") });

import express, { Request, Response } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerGoogleAuthRoutes } from "./googleAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getDb } from "../db";
import { ADMIN_COOKIE, signAdminToken, verifyAdminToken } from "./adminAuth";
import { isScheduledRequestAuthorized } from "./scheduledAuth";

export { isAdminAuthenticated } from "./adminAuth";

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
    try {
      const { checkRateLimit, getClientIp, RATE_LIMITS } = await import("../rateLimit");
      checkRateLimit(`adminLogin:${getClientIp(req)}`, RATE_LIMITS.adminLogin.max, RATE_LIMITS.adminLogin.windowMs);
    } catch {
      res.status(429).json({ error: "Muitas tentativas de login. Aguarde 15 minutos." });
      return;
    }
    const { password } = req.body as { password?: string };
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      res.status(500).json({ error: "ADMIN_PASSWORD não configurado no servidor" });
      return;
    }

    const trimmedEnvPassword = adminPassword.trim();
    const { timingSafeEqual } = await import("crypto");
    const provided = Buffer.from(password ?? "");
    const expected = Buffer.from(trimmedEnvPassword);
    const matches = provided.length === expected.length && timingSafeEqual(provided, expected);
    if (!matches) {
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

  // ── Admin: rodar migrations pendentes do banco ───────────────────────────────
  // O banco de produção não é acessível fora do Lambda; este endpoint permite
  // ao dono aplicar migrations com um clique no painel /admin.
  app.post("/api/admin/run-migrations", async (req: Request, res: Response) => {
    const token = req.cookies?.[ADMIN_COOKIE];
    if (!token || !(await verifyAdminToken(token))) {
      res.status(401).json({ error: "Não autorizado" });
      return;
    }
    try {
      const { runPendingMigrations } = await import("./migrations");
      const result = await runPendingMigrations();
      res.json({ success: true, ...result });
    } catch (e: any) {
      console.error("[run-migrations] Error:", e);
      res.status(500).json({ error: e.message });
    }
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
        { loc: "/como-funciona", priority: "0.7", changefreq: "monthly", lastmod: today },
        { loc: "/ranking", priority: "0.8", changefreq: "daily", lastmod: today },
        { loc: "/metodologia", priority: "0.6", changefreq: "monthly", lastmod: today },
        { loc: "/legal", priority: "0.5", changefreq: "monthly", lastmod: today },
        { loc: "/termos", priority: "0.5", changefreq: "monthly", lastmod: today },
        { loc: "/privacidade", priority: "0.5", changefreq: "monthly", lastmod: today },
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
      // Páginas de categoria (apenas categorias com enquetes ativas)
      const catResult = await db.execute(sql`SELECT DISTINCT category FROM markets WHERE isActive = 1`);
      const catRows = Array.isArray(catResult[0]) ? catResult[0] : (catResult.rows || []);
      for (const row of catRows) {
        const category = (row as any).category;
        if (category) {
          xml += `  <url>\n    <loc>${baseUrl}/categoria/${encodeURIComponent(category)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
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

  // ── Embed: widget leve de enquete para portais/newsletters ──────────────────
  // HTML mínimo renderizado no servidor (sem bundle React), pensado para
  // <iframe>. Ex.: <iframe src="https://achoq.com.br/embed/dolar-2026?tema=dark">
  app.get("/embed/:slug", async (req: Request, res: Response) => {
    try {
      const { getMarketBySlug, getVoteStats } = await import("../db");
      const market = await getMarketBySlug(String(req.params.slug || ""));
      if (!market || !market.isActive) {
        res.status(404).send("<!doctype html><meta charset='utf-8'>Enquete não encontrada");
        return;
      }
      const stats = await getVoteStats(market.id);
      const total = stats.total;
      const pctA = total > 0 ? Math.round((stats.countA / total) * 100) : 50;
      const pctB = total > 0 ? 100 - pctA : 50;
      const dark = req.query.tema === "dark";
      const esc = (s: string) =>
        String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

      const bg = dark ? "#111318" : "#ffffff";
      const fg = dark ? "#e7e9ee" : "#111111";
      const muted = dark ? "#9aa1ad" : "#666666";
      const border = dark ? "#2a2e37" : "#e5e5e5";
      const marketUrl = `https://achoq.com.br/mercado/${market.slug}?utm_source=embed&utm_medium=iframe`;

      const html = `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<link rel="canonical" href="https://achoq.com.br/mercado/${esc(market.slug)}">
<title>${esc(market.title)} | AchoQ</title>
<style>
  *{margin:0;box-sizing:border-box;font-family:Inter,system-ui,-apple-system,sans-serif}
  body{background:${bg};color:${fg};padding:16px;display:flex;flex-direction:column;gap:12px;min-height:100vh}
  a{text-decoration:none}
  .title{font-size:15px;font-weight:700;line-height:1.35;color:${fg}}
  .bar{display:flex;height:14px;border-radius:99px;overflow:hidden;background:${border}}
  .bar .a{background:#b91c1c;height:100%}
  .bar .b{background:#2d5c94;height:100%}
  .legend{display:flex;justify-content:space-between;font-size:12px;font-weight:700}
  .legend .a{color:#c93a3a}.legend .b{color:#5b8fc4}
  .meta{font-size:11px;color:${muted}}
  .cta{margin-top:auto;display:flex;justify-content:space-between;align-items:center;border-top:1px solid ${border};padding-top:10px}
  .logo{font-size:13px;font-weight:900;color:${dark ? "#6b9fd0" : "#1a4971"}}
  .go{font-size:12px;font-weight:700;color:${dark ? "#6b9fd0" : "#1a4971"}}
</style>
</head><body>
  <a class="title" href="${marketUrl}" target="_blank" rel="noopener">${esc(market.title)}</a>
  <div class="bar" role="img" aria-label="${pctA}% ${esc(market.optionA)}, ${pctB}% ${esc(market.optionB)}">
    <div class="a" style="width:${pctA}%"></div><div class="b" style="width:${pctB}%"></div>
  </div>
  <div class="legend">
    <span class="a">${pctA}% ${esc(market.optionA)}</span>
    <span class="b">${pctB}% ${esc(market.optionB)}</span>
  </div>
  <div class="meta">${total.toLocaleString("pt-BR")} opiniões · atualizado agora</div>
  <div class="cta">
    <span class="logo">AchoQ</span>
    <a class="go" href="${marketUrl}" target="_blank" rel="noopener">Opine no AchoQ →</a>
  </div>
  <script>setTimeout(function(){location.reload()},120000)</script>
</body></html>`;

      res.set("Content-Type", "text/html; charset=utf-8");
      res.set("Cache-Control", "public, max-age=60");
      res.send(html);
    } catch (e: any) {
      res.status(500).send("Erro ao carregar o widget");
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
  app.post("/api/scheduled/resolve-markets", async (req: Request, res: Response) => {
    if (!(await isScheduledRequestAuthorized(req))) {
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
      for (const r of resolutions) {
        if (typeof r?.marketId !== "number" || (r?.resolvedChoice !== "A" && r?.resolvedChoice !== "B")) {
          res.status(400).json({ error: "cada resolução exige marketId numérico e resolvedChoice 'A' ou 'B'" });
          return;
        }
      }

      const { resolveMarket } = await import("../resolution");
      const results: Array<{ marketId: number; success: boolean; error?: string }> = [];

      for (const r of resolutions) {
        try {
          await resolveMarket(r.marketId, r.resolvedChoice);
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

  // ── Scheduled: Fechamento da liga semanal ──────────────────────────────────
  // Fecha temporadas de semanas passadas (promoção/rebaixamento) e inscreve
  // os membros na semana corrente. Idempotente; chamado por agente agendado.
  app.post("/api/scheduled/close-league", async (req: Request, res: Response) => {
    if (!(await isScheduledRequestAuthorized(req))) {
      res.status(401).json({ error: "Não autorizado" });
      return;
    }
    try {
      const { closeFinishedSeasons } = await import("../gamification");
      const result = await closeFinishedSeasons();
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Login com Google (contas reais de usuário)
  registerGoogleAuthRoutes(app);

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
