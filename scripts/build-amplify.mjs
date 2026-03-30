/**
 * build-amplify.mjs
 * 
 * Gera a estrutura de diretórios que o AWS Amplify SSR espera:
 * 
 * .amplify-hosting/
 * ├── deploy-manifest.json   ← roteamento SSR vs estático
 * ├── compute/
 * │   └── default/
 * │       ├── index.js       ← servidor Express bundlado
 * │       └── package.json   ← dependências de runtime
 * └── static/
 *     └── **                 ← assets do Vite (JS, CSS, imagens)
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.resolve(ROOT, ".amplify-hosting");

// 1. Limpar saída anterior
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

console.log("▶ Building frontend (Vite)...");
execSync("pnpm vite build", { cwd: ROOT, stdio: "inherit" });

console.log("▶ Building server (esbuild)...");
execSync(
  "pnpm esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server.js",
  { cwd: ROOT, stdio: "inherit" }
);

// 2. Criar estrutura .amplify-hosting/
const computeDir = path.join(OUT, "compute", "default");
const staticDir = path.join(OUT, "static");
fs.mkdirSync(computeDir, { recursive: true });
fs.mkdirSync(staticDir, { recursive: true });

// 3. Copiar servidor bundlado
fs.copyFileSync(
  path.join(ROOT, "dist", "server.js"),
  path.join(computeDir, "index.js")
);

// 4. Copiar assets estáticos do Vite (dist/public → static/)
const viteDist = path.join(ROOT, "dist", "public");
copyDir(viteDist, staticDir);

// 5. Criar package.json mínimo para o compute (runtime deps)
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
const runtimeDeps = {};
// Incluir apenas dependências de runtime necessárias (não devDependencies)
const needed = [
  "express", "cookie", "jose", "drizzle-orm", "mysql2",
  "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner",
  "dotenv", "nanoid", "superjson", "@trpc/server", "zod"
];
for (const dep of needed) {
  if (pkg.dependencies[dep]) runtimeDeps[dep] = pkg.dependencies[dep];
}
fs.writeFileSync(
  path.join(computeDir, "package.json"),
  JSON.stringify({ name: "achoq-server", version: "1.0.0", type: "module", dependencies: runtimeDeps }, null, 2)
);

// 6. Criar deploy-manifest.json
const manifest = {
  version: 1,
  framework: { name: "express", version: "4" },
  routes: [
    {
      path: "/api/*",
      target: { kind: "Compute", src: "default" }
    },
    {
      path: "/assets/*",
      target: { kind: "Static" }
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

console.log("✅ .amplify-hosting/ gerado com sucesso!");
console.log("   ├── deploy-manifest.json");
console.log("   ├── compute/default/index.js");
console.log("   └── static/ (" + countFiles(staticDir) + " arquivos)");

// Utilitários
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
