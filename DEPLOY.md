# Deploy no AWS Amplify — AchoQ

Guia rápido para colocar o AchoQ no ar usando **AWS Amplify** com deploy automático pelo GitHub.

---

## Pré-requisitos

- Conta AWS ativa
- Repositório GitHub: `vincelogan/achoq`
- Banco de dados MySQL acessível pela AWS (ex: PlanetScale, RDS, Neon)

---

## Passo a Passo

### 1. Criar o app no Amplify

1. Acesse [console.aws.amazon.com/amplify](https://console.aws.amazon.com/amplify)
2. Clique em **Create new app**
3. Selecione **GitHub** como fonte
4. Autorize o acesso e selecione o repositório `vincelogan/achoq`
5. Selecione a branch `main`

### 2. Configurar o build

O Amplify detectará automaticamente o arquivo `amplify.yml` na raiz do projeto.

Confirme as configurações:
- **Build command:** `pnpm run build`
- **Start command:** `node dist/index.js`
- **Output directory:** `dist`

### 3. Configurar as variáveis de ambiente

No painel do Amplify, vá em **App Settings → Environment Variables** e adicione:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão MySQL (ex: `mysql://user:pass@host:3306/achoq`) |
| `JWT_SECRET` | String aleatória longa para assinar cookies de sessão |
| `NODE_ENV` | `production` |
| `VITE_APP_ID` | ID do app Manus OAuth |
| `OAUTH_SERVER_URL` | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | `https://manus.im` |
| `OWNER_OPEN_ID` | Open ID do dono da conta Manus |
| `OWNER_NAME` | Nome do dono |
| `BUILT_IN_FORGE_API_URL` | URL da Forge API Manus |
| `BUILT_IN_FORGE_API_KEY` | Chave da Forge API (server-side) |
| `VITE_FRONTEND_FORGE_API_URL` | URL da Forge API para o frontend |
| `VITE_FRONTEND_FORGE_API_KEY` | Chave da Forge API para o frontend |

> Veja o arquivo `env.example.txt` na raiz do projeto para referência completa.

### 4. Configurar o banco de dados

Após o primeiro deploy, execute as migrations:

```bash
# Localmente, apontando para o banco de produção:
DATABASE_URL="sua-connection-string" pnpm db:push
```

### 5. Deploy

Clique em **Save and deploy**. O Amplify fará o build e deploy automaticamente.

A partir daí, qualquer push para a branch `main` dispara um novo deploy automático.

---

## Estrutura do Build

```
pnpm run build
├── vite build          → client/dist/  (frontend estático)
└── esbuild             → dist/index.js (servidor Node.js)
```

O servidor Express em `dist/index.js` serve tanto a API (`/api/trpc`) quanto o frontend estático.

---

## Variáveis VITE_*

Variáveis com prefixo `VITE_` são embutidas no bundle do frontend em tempo de build.
Certifique-se de configurá-las **antes** de iniciar o build no Amplify.

---

## Suporte

Dúvidas: `contato@achoq.com.br`
