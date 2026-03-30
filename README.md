# AchoQ

> A primeira plataforma de opinião coletiva do Brasil.

AchoQ é uma plataforma digital onde qualquer pessoa pode indicar o que acredita que vai acontecer em temas como política, economia e esportes — e ver em tempo real o que a maioria pensa.

**Sem apostas. Sem dinheiro. Só opinião.**

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite + Tailwind CSS 4 |
| Backend | Node.js + Express + tRPC 11 |
| Banco de dados | MySQL via Drizzle ORM |
| Autenticação | Manus OAuth (cookie-based) |
| Deploy | AWS Amplify (SSR Node.js) |

---

## Rodar localmente

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp env.example.txt .env
# edite o .env com seus valores

# 3. Criar as tabelas no banco
pnpm db:push

# 4. Iniciar o servidor de desenvolvimento
pnpm dev
```

Acesse em `http://localhost:3000`.

---

## Build para produção

```bash
pnpm run build
pnpm start
```

---

## Deploy no AWS Amplify

Ver [DEPLOY.md](./DEPLOY.md) para o guia completo passo a passo.

Resumo:
1. Conecte o repositório no [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Branch: `main` — App root: `/` (raiz)
3. Configure as variáveis de ambiente (ver `env.example.txt`)
4. Deploy automático a cada push na `main`

---

## Estrutura do Projeto

```
/
├── client/          # Frontend React (Vite)
│   └── src/
│       ├── pages/   # Páginas da aplicação
│       └── components/
├── server/          # Backend Express + tRPC
│   ├── routers.ts   # Procedures tRPC
│   └── db.ts        # Helpers de banco de dados
├── drizzle/         # Schema e migrations
├── shared/          # Tipos compartilhados
├── amplify.yml      # Configuração de build AWS Amplify
└── DEPLOY.md        # Guia de deploy detalhado
```

---

## Páginas

| Rota | Descrição |
|---|---|
| `/` | Home com mercados de opinião ativos |
| `/como-funciona` | Explicação da plataforma |
| `/ranking` | Ranking de participação |
| `/metodologia` | Como os dados são calculados |
| `/legal` | Informações legais |
| `/termos` | Termos de Uso |
| `/privacidade` | Política de Privacidade (LGPD) |

---

## Licença

Todos os direitos reservados © 2026 AchoQ.
