# Deploy no AWS Amplify — AchoQ

Guia para deploy do AchoQ no **AWS Amplify Hosting** com suporte a SSR Node.js (Express).

---

## Como funciona

O projeto usa o **Amplify Hosting Deployment Specification** — o padrão oficial da AWS para apps SSR customizados (sem Next.js ou Nuxt.js). O script `scripts/build-amplify.mjs` gera automaticamente a estrutura que o Amplify espera:

```
.amplify-hosting/           ← gerado pelo build, não versionado
├── deploy-manifest.json    ← roteamento: API → Compute, assets → Static
├── compute/
│   └── default/
│       ├── index.js        ← servidor Express bundlado
│       └── package.json    ← deps de runtime
└── static/
    ├── index.html
    └── assets/             ← JS/CSS do Vite
```

---

## Passo a Passo

### 1. Criar o app no Amplify Console

1. Acesse [console.aws.amazon.com/amplify](https://console.aws.amazon.com/amplify)
2. Clique em **Create new app**
3. Selecione **GitHub** → autorize → repositório `vincelogan/achoq`
4. Branch: **`main`**
5. **App root directory:** deixe **em branco** (raiz `/`)
6. O Amplify detecta o `amplify.yml` automaticamente

### 2. Confirmar configurações de build

O `amplify.yml` já está configurado. Confirme na tela:

- **Build command:** `node scripts/build-amplify.mjs`
- **Base directory:** `.amplify-hosting`

### 3. Configurar variáveis de ambiente

Em **App Settings → Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `mysql://user:pass@host:3306/achoq` |
| `JWT_SECRET` | string aleatória longa (mín. 32 chars) |
| `NODE_ENV` | `production` |
| `VITE_APP_ID` | ID do app Manus OAuth |
| `OAUTH_SERVER_URL` | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | `https://manus.im` |
| `OWNER_OPEN_ID` | Open ID do dono Manus |
| `OWNER_NAME` | Nome do dono |
| `BUILT_IN_FORGE_API_URL` | URL da Forge API Manus |
| `BUILT_IN_FORGE_API_KEY` | Chave server-side da Forge API |
| `VITE_FRONTEND_FORGE_API_URL` | URL da Forge API para frontend |
| `VITE_FRONTEND_FORGE_API_KEY` | Chave frontend da Forge API |

> Referência completa em `env.example.txt` na raiz do repositório.

### 4. Rodar migrations do banco (primeira vez)

```bash
# Execute localmente apontando para o banco de produção:
DATABASE_URL="sua-connection-string-producao" pnpm db:push
```

### 5. Deploy

Clique em **Save and deploy**. A partir daí, qualquer push na `main` dispara deploy automático.

---

## Roteamento

| Rota | Destino |
|---|---|
| `/api/*` | Compute (Express) — tRPC, OAuth, API |
| `/assets/*` | Static (CloudFront) — JS/CSS bundlados |
| `/*` | Compute (Express) — serve o React SPA |

---

## Banco de dados recomendado

Para produção na AWS, use um banco MySQL compatível:
- **PlanetScale** (serverless MySQL, free tier generoso)
- **AWS RDS MySQL** (na mesma região do Amplify para menor latência)
- **Neon** (PostgreSQL — requer ajuste no schema para `pg` em vez de `mysql2`)

---

## Suporte

Dúvidas: `contato@achoq.com.br`
