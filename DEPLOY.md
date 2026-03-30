# Deploy no AWS Amplify — AchoQ

Guia rápido para colocar o AchoQ no ar usando **AWS Amplify** com deploy automático pelo GitHub.

---

## Estrutura do Repositório

Todo o projeto está na **raiz do branch `main`** — sem subpastas de projeto:

```
/ (raiz do repositório = raiz do projeto)
├── amplify.yml        ← lido automaticamente pelo Amplify
├── package.json
├── pnpm-lock.yaml
├── client/            ← frontend React (Vite)
├── server/            ← backend Express + tRPC
├── drizzle/           ← schema e migrations do banco
└── dist/              ← gerado pelo build (não versionado)
```

---

## Passo a Passo

### 1. Criar o app no Amplify

1. Acesse [console.aws.amazon.com/amplify](https://console.aws.amazon.com/amplify)
2. Clique em **Create new app**
3. Selecione **GitHub** como fonte
4. Autorize o acesso e selecione o repositório `vincelogan/achoq`
5. Selecione a branch **`main`**
6. **App root directory:** deixe em branco (raiz `/`)

### 2. Configurar o build

O Amplify detectará automaticamente o `amplify.yml` na raiz.

Confirme as configurações na tela de build:
- **Framework:** Web Compute (Node.js SSR)
- **Build command:** `pnpm run build`
- **Start command:** `node dist/index.js`
- **Output directory:** `dist`

### 3. Configurar as variáveis de ambiente

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

### 4. Rodar as migrations do banco

Após o primeiro deploy, execute localmente apontando para o banco de produção:

```bash
DATABASE_URL="sua-connection-string-de-producao" pnpm db:push
```

### 5. Deploy

Clique em **Save and deploy**.

A partir daí, qualquer push na branch `main` dispara um novo deploy automático.

---

## Como o Build Funciona

```
pnpm run build
├── vite build          → compila o frontend React para dist/
└── esbuild             → empacota o servidor Node.js em dist/index.js
```

O servidor `dist/index.js` serve tanto a API (`/api/trpc`) quanto os arquivos estáticos do frontend.

---

## Variáveis VITE_*

Variáveis com prefixo `VITE_` são embutidas no bundle do frontend **em tempo de build**.
Configure-as no Amplify **antes** de iniciar o build.

---

## Suporte

Dúvidas: `contato@achoq.com.br`
