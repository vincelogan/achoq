# AchoQ

> A primeira plataforma de opinião coletiva do Brasil.

AchoQ é uma plataforma digital onde qualquer pessoa pode indicar o que acredita que vai acontecer em temas como política, economia e esportes — e ver em tempo real o que a maioria pensa.

**Sem apostas. Sem dinheiro. Só opinião.**

---

## Economia fictícia de Qs

O engajamento é gamificado com a moeda fictícia **Q** (sem valor monetário, não comprável e não conversível):

- **Ganhar Qs**: opinar (+5, até 10/dia), opinar cedo (+5 nas primeiras 48h), check-in diário (+10 a +25 conforme a sequência), acertar previsões (+20, +10 de bônus em sequência) e desbloquear conquistas (+10 a +100).
- **Gastar Qs**: impulsionar uma enquete para o destaque da home (24h), molduras e títulos de perfil no ranking, proteção de streak.
- **Liga semanal**: divisões Bronze → Prata → Ouro → Diamante; a pontuação são os Qs ganhos na semana; os primeiros sobem e os últimos descem toda segunda-feira.
- **Conquistas**: 13 badges por marcos de participação, acerto, assiduidade e sugestões aprovadas.
- **Notificações in-app**: resolução com seu resultado, conquistas, liga e **virada de maioria** nas enquetes que você votou ou segue.

O saldo vive em um ledger append-only (`q_transactions`) com concessões idempotentes — a estatística de acurácia (pontos/streak do ranking) continua recomputável e separada da moeda.

Contexto de mercado e priorização: ver [docs/pesquisa-de-mercado.md](./docs/pesquisa-de-mercado.md).

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
| `/` | Home com enquetes ativas (impulsionadas primeiro) e navegação por categoria |
| `/mercado/:slug` | Detalhe da enquete: votação, evolução, notícias e comentários |
| `/busca` | Busca de enquetes (`?q=`) |
| `/categoria/:categoria` | Enquetes por categoria |
| `/ranking` | Ranking de acertadores (com molduras/títulos equipados) |
| `/liga` | Liga semanal com divisões e promoção/rebaixamento |
| `/loja` | Loja de Qs (molduras, títulos, proteção de streak) |
| `/carteira` | Saldo de Qs, extrato, streak diário e conquistas |
| `/sugerir` | Sugerir enquete (50 Qs, fila de aprovação, estorno se recusada) |
| `/boloes` e `/bolao/:code` | Bolões privados com amigos (código de convite, ranking do grupo) |
| `/embed/:slug` | Widget leve para portais/newsletters (`?tema=dark`) |
| `/como-funciona` | Explicação da plataforma |
| `/metodologia` | Como os dados são calculados |
| `/legal` | Informações legais |
| `/termos` | Termos de Uso |
| `/privacidade` | Política de Privacidade (LGPD) |
| `/admin` | Painel admin: CRUD de enquetes, resolução (✓A/✓B) e moderação de comentários |

### Endpoints agendados

Chamados por um agente externo (autenticação verificada: bearer JWT, header `x-scheduled-secret` ou cookie de sessão `cron_*` assinado):

- `GET /api/scheduled/pending-markets` — enquetes vencidas aguardando resolução
- `POST /api/scheduled/resolve-markets` — resolve em lote (recalcula pontos e credita Qs, idempotente)
- `POST /api/scheduled/close-league` — fecha a semana da liga (promoção/rebaixamento, idempotente)

---

## Licença

Todos os direitos reservados © 2026 AchoQ.
