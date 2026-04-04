/**
 * build-amplify.mjs
 * 
 * Gera a estrutura que o AWS Amplify Hosting SSR espera:
 * 
 * .amplify-hosting/
 * ├── deploy-manifest.json
 * ├── compute/
 * │   └── default/
 * │       ├── index.js          ← servidor Express bundlado
 * │       ├── package.json      ← dependências de runtime
 * │       └── public/           ← cópia dos estáticos para SPA fallback
 * │           ├── index.html
 * │           └── assets/
 * └── static/
 *     ├── index.html            ← estáticos servidos pelo CloudFront
 *     └── assets/
 * 
 * O Express em produção resolve estáticos de `__dirname/public/`.
 * O CloudFront serve `/assets/*` diretamente de `static/`.
 * O catch-all `/*` vai para Compute, que serve o index.html (SPA).
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(ROOT, ".amplify-hosting");

// ─── 1. Limpar saída anterior ───
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

// ─── 2. Build frontend (Vite) ───
console.log("▶ [1/4] Building frontend (Vite)...");
execSync("pnpm vite build", { cwd: ROOT, stdio: "inherit" });

// ─── 3. Build server (esbuild) ───
console.log("▶ [2/4] Building server (esbuild)...");
execSync(
  "pnpm esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server.js",
  { cwd: ROOT, stdio: "inherit" }
);

// ─── 4. Montar estrutura .amplify-hosting/ ───
console.log("▶ [3/4] Montando .amplify-hosting/...");

const computeDir = path.join(OUT, "compute", "default");
const staticDir = path.join(OUT, "static");
const computePublicDir = path.join(computeDir, "public");

fs.mkdirSync(computeDir, { recursive: true });
fs.mkdirSync(staticDir, { recursive: true });
fs.mkdirSync(computePublicDir, { recursive: true });

// 4a. Copiar servidor bundlado
fs.copyFileSync(
  path.join(ROOT, "dist", "server.js"),
  path.join(computeDir, "index.js")
);

// 4b. Copiar estáticos do Vite para AMBOS os lugares:
//     - static/ → CloudFront serve diretamente
//     - compute/default/public/ → Express serve SPA fallback
const viteDist = path.join(ROOT, "dist", "public");
copyDir(viteDist, staticDir);
copyDir(viteDist, computePublicDir);

// 4c. Criar package.json mínimo para o compute (runtime deps)
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
const runtimeDeps = {};
const needed = [
  "express", "cookie", "jose", "drizzle-orm", "mysql2",
  "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner",
  "dotenv", "nanoid", "superjson", "@trpc/server", "zod", "axios"
];
for (const dep of needed) {
  if (pkg.dependencies[dep]) runtimeDeps[dep] = pkg.dependencies[dep];
}
fs.writeFileSync(
  path.join(computeDir, "package.json"),
  JSON.stringify({
    name: "achoq-server",
    version: "1.0.0",
    type: "module",
    dependencies: runtimeDeps
  }, null, 2)
);

// ─── 5. Criar deploy-manifest.json ───
console.log("▶ [4/4] Gerando deploy-manifest.json...");

const manifest = {
  version: 1,
  framework: { name: "express", version: "4.21.0" },
  routes: [
    {
      path: "/api/*",
      target: { kind: "Compute", src: "default" }
    },
    {
      path: "/assets/*",
      target: { kind: "Static" },
      fallback: { kind: "Compute", src: "default" }
    },
    {
      path: "/*",
      target: { kind: "Compute", src: "default" }
    }
  ],
  computeResources: [
    {
      name: "default",
      runtime: "nodejs20.x",
      entrypoint: "index.js"
    }
  ]
};
fs.writeFileSync(
  path.join(OUT, "deploy-manifest.json"),
  JSON.stringify(manifest, null, 2)
);

// ─── Resumo ───
const staticCount = countFiles(staticDir);
const computeCount = countFiles(computeDir);
console.log("");
console.log("✅ .amplify-hosting/ gerado com sucesso!");
console.log(`   ├── deploy-manifest.json`);
console.log(`   ├── compute/default/ (${computeCount} arquivos)`);
console.log(`   │   ├── index.js (servidor Express)`);
console.log(`   │   ├── package.json (runtime deps)`);
console.log(`   │   └── public/ (SPA fallback)`);
console.log(`   └── static/ (${staticCount} arquivos, CloudFront)`);

// ─── Utilitários ───
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name));
    else count++;
  }
  return count;
}
