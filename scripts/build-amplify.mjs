/**
 * build-amplify.mjs
 * 
 * Gera a estrutura que o AWS Amplify Hosting SSR espera:
 * 
 * .amplify-hosting/
 * ├── deploy-manifest.json
 * ├── compute/
 * │   └── default/
 * │       ├── index.js          ← servidor Express bundlado (CommonJS)
 * │       ├── package.json      ← dependências de runtime
 * │       └── public/           ← cópia dos estáticos para SPA fallback
 * │           ├── index.html
 * │           └── assets/
 * └── static/
 *     ├── index.html            ← estáticos servidos pelo CloudFront
 *     └── assets/
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
// IMPORTANTE: Usar --format=cjs para compatibilidade com Lambda do Amplify
// O --banner injeta __dirname para compatibilidade com import.meta.dirname
console.log("▶ [2/4] Building server (esbuild)...");
// --packages=external marca TODOS os node_modules como external
// Adicionamos --external para vite.config.ts explicitamente
execSync(
  [
    'pnpm esbuild server/_core/index.ts',
    '--platform=node',
    '--packages=external',
    '--bundle',
    '--format=cjs',
    '--outfile=dist/server.cjs',
    '--external:../../vite.config',
    '--external:../../vite.config.ts',
    '--external:vite',
    '--external:@vitejs/plugin-react',
    '--external:@builder.io/vite-plugin-jsx-loc',
    '--external:vite-plugin-manus-runtime',
    '--banner:js="const __importMetaDirname = __dirname;"',
  ].join(' '),
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

// 4a. Copiar servidor bundlado e corrigir import.meta → __dirname para CJS
let serverCode = fs.readFileSync(path.join(ROOT, "dist", "server.cjs"), "utf-8");

// O esbuild gera `var import_meta = {};` e `var import_meta2 = {};` para CJS
// Precisamos substituir esses objetos vazios por objetos com dirname e url
serverCode = serverCode.replace(
  /var import_meta(\d*) = \{\};/g,
  'var import_meta$1 = { dirname: __dirname, url: "file://" + __filename };'
);

// Substituir qualquer import.meta.dirname ou import.meta.url restante
serverCode = serverCode.replace(/import\.meta\.dirname/g, "__dirname");
serverCode = serverCode.replace(/import\.meta\.url/g, '("file://" + __filename)');

fs.writeFileSync(path.join(computeDir, "index.js"), serverCode);

// 4a-extra. Copiar .env.runtime para compute/default/.env (para dotenv carregar no Lambda)
const envRuntimePath = path.join(ROOT, ".env.runtime");
if (fs.existsSync(envRuntimePath)) {
  fs.copyFileSync(envRuntimePath, path.join(computeDir, ".env"));
  console.log("   ✅ .env.runtime copiado para compute/default/.env");
} else {
  console.warn("   ⚠️  .env.runtime não encontrado — variáveis de ambiente podem não estar disponíveis no runtime");
}

// 4b. Copiar estáticos do Vite para AMBOS os lugares:
//     - static/ → CloudFront serve diretamente
//     - compute/default/public/ → Express serve SPA fallback
const viteDist = path.join(ROOT, "dist", "public");
copyDir(viteDist, staticDir);
copyDir(viteDist, computePublicDir);

// 4c. Criar package.json mínimo para o compute (runtime deps)
// NÃO usar "type": "module" — o bundle é CommonJS
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
      path: "/*.*",
      target: {
        kind: "Static",
        cacheControl: "public, max-age=2"
      },
      fallback: {
        kind: "Compute",
        src: "default"
      }
    },
    {
      path: "/*",
      target: { kind: "Compute", src: "default" }
    }
  ],
  computeResources: [
    {
      name: "default",
      runtime: "nodejs22.x",
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
console.log(`   │   ├── index.js (servidor Express, CommonJS)`);
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
