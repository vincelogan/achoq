import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";

export async function setupVite(app: Express, server: Server) {
  // Estes imports dinâmicos garantem que Vite e plugins NÃO entrem no bundle de produção
  const { createServer: createViteServer } = await import("vite");
  const { nanoid } = await import("nanoid");
  const viteConfigModule = await import("../../vite.config");
  const viteConfig = viteConfigModule.default;

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      let page = await vite.transformIndexHtml(url, template);
      // Inject dynamic canonical in dev mode too
      const BASE_URL = "https://achoq.com.br";
      const rawPath2 = req.originalUrl.split("?")[0];
      const canonicalPath = rawPath2 === "/" ? "/" : rawPath2.replace(/\/+$/, "");
      const canonicalUrl = `${BASE_URL}${canonicalPath}`;
      page = page.replace(
        /<link rel="canonical" href="[^"]*" \/>/,
        `<link rel="canonical" href="${canonicalUrl}" />`
      );
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve static assets but NOT index.html (so our dynamic canonical handler runs)
  app.use(express.static(distPath, { index: false }));

  // fall through to index.html with dynamic canonical injection
  app.use("*", (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    fs.readFile(indexPath, "utf-8", (err, html) => {
      if (err) {
        res.status(500).send("Internal Server Error");
        return;
      }
      // Inject canonical URL based on request path (strip query strings)
      // Use req.originalUrl since req.path is always '/' in app.use('*', ...) handlers
      const BASE_URL = "https://achoq.com.br";
      const rawPath = req.originalUrl.split("?")[0]; // strip query string
      const canonicalPath = rawPath === "/" ? "/" : rawPath.replace(/\/+$/, "");
      const canonicalUrl = `${BASE_URL}${canonicalPath}`;
      // Replace the hardcoded canonical with the dynamic one
      const injected = html.replace(
        /<link rel="canonical" href="[^"]*" \/>/,
        `<link rel="canonical" href="${canonicalUrl}" />`
      );
      res.status(200).set({ "Content-Type": "text/html" }).send(injected);
    });
  });
}
