# AchoQ — Pesquisa de Mercado e Revisão do Produto

> Julho/2026. Base para a rodada de melhorias: economia fictícia de **Qs**, liga semanal, badges, busca/categorias e comentários — mantendo a linha **"Sem apostas. Sem dinheiro. Só opinião."**

---

## 1. Posicionamento

O AchoQ é uma plataforma de **opinião coletiva**: cada pessoa dá um voto único sobre o que acha que vai acontecer, e o site mostra em tempo real o que a maioria pensa. Não é prediction market (não há preço, odds, stake nem "mercado"); não é aposta (não há dinheiro em jogo); não é pesquisa eleitoral registrada (amostra auto-selecionada, e as páginas institucionais já deixam isso claro).

Essa linha é uma **vantagem regulatória e de comunicação** — e é deliberada. O Manifold Markets, maior plataforma play-money do mundo, escolheu moeda fictícia justamente para ficar fora do alcance de reguladores de jogo. No Brasil, onde a regulamentação de apostas (SPA/MF) está em plena atividade, "grátis e sem prêmio em dinheiro" evita o enquadramento como aposta ou sorteio.

## 2. Players analisados

### 2.1 Play-money e reputação (benchmark central)

**Manifold Markets** — moeda fictícia "Mana" (M$), sem valor de saque.
- Features fortes: criação de perguntas por usuários; **ligas trimestrais com divisões e promoção/rebaixamento** (citadas como principal motor de retenção de forecasters); bônus de cadastro, login diário e indicação; loans (devolve moeda travada em perguntas longas); leaderboards com scores de calibração.
- Monetização real: **venda direta de Mana** (~US$1 = M$100) — compra de moeda fictícia é canal de receita mesmo sem prêmio em dinheiro.

**Futuur** — play-money "Ooms" (ø); todo usuário começa com 10.000.
- Ooms **não podem ser comprados**: só se ganha acertando. Moeda = medida de habilidade/reputação. É o caminho mais purista de "sem dinheiro", e diferencia bem de site de aposta.

**Metaculus** — sem moeda; reputação e desafio intelectual.
- Scoring que premia **acurácia + calibração** (quem diz 70% deve acertar ~70% das vezes); **multiplicador temporal** (posicionar-se antes do consenso vale mais); agregação ponderada por track record.
- Monetização: **Metaculus Pro** — vende forecasting como serviço B2B. A inteligência coletiva é o produto.

### 2.2 Real-money (só referência de UX — modelo de aposta descartado)

**Polymarket** — gráfico de probabilidade ao vivo em cada mercado; cards estilo feed de notícias com % em destaque; threads de comentários; **embeds em veículos de mídia** (parceria WSJ) como canal de distribuição; push notifications de virada.

**Kalshi** — mini-gráfico por card; categorias claras (política, esportes, cultura, economia, clima); watchlist; alertas personalizáveis; dark/light mode automático; foco em UX para iniciantes.

### 2.3 Opinião e enquetes

**YouGov** — pontos por pesquisa respondida que viram recompensas; painel de 29M+ membros. Monetização real: **empresas pagam pelos dados de opinião agregados**. É o modelo mais alinhado ao AchoQ: a base opinando É o produto; o dado agregado de sentimento (política/economia/esportes em tempo real) é vendável como pesquisa de tendência.

**Strawpoll/Ranker** — freemium + ads: uso grátis ilimitado com anúncios; planos pagos removem branding e liberam recursos.

### 2.4 Brasil (concorrência direta)

**Palpita Aí** — concurso de palpites esportivos **grátis com prêmios reais**, aprovado pela SPA/MF (caminho jurídico do concurso promocional). Ranking semanal e pontos por acerto.

**Palpitagem FC** — usa literalmente o discurso **"sem apostas"**; ligas privadas com amigos; freemium.

**Cartola FC (bolão) / BolãoJá** — ligas privadas com convite de amigos (viralização social forte no Brasil); BolãoJá tem 640k+ usuários e **planos corporativos** (bolão como engajamento de empresas).

⚠️ A concorrência local já ocupa o discurso "sem apostas" **no futebol**. O diferencial defensável do AchoQ é a **amplitude temática** (política + economia + esportes + entretenimento) + série temporal da opinião + reputação de acurácia.

### 2.5 Gamificação de referência (Duolingo)

Streak diário com **proteção de streak** (aversão à perda), ligas semanais de divisões com promoção/rebaixamento (comparação social), badges por marcos, metas diárias, desafios sazonais. Números de mercado (indicativos): streaks +60% comprometimento, leaderboards +40% engajamento, badges +30% conclusão.

## 3. Como plataformas play-money monetizam de verdade

1. **Venda de moeda fictícia** (Manifold) — para cosmético/status, nunca vinculada a prêmio (senão vira sorteio/aposta no Brasil).
2. **Venda de insights agregados** (YouGov, Metaculus Pro) — sentimento nacional em tempo real como relatório/painel para mídia, empresas e casas de análise. **Encaixe mais natural e defensável para o AchoQ.**
3. **Freemium/assinatura** (Strawpoll, Palpitagem) — sem ads, analytics pessoais, recursos extras.
4. **Perguntas patrocinadas** — marca/veículo patrocina uma enquete.
5. **B2B corporativo** (BolãoJá, Metaculus Pro) — opinião coletiva como ferramenta de engajamento interno.
6. **Embeds** (Polymarket/WSJ) — não é receita direta, mas distribui a marca e alimenta os canais acima.

## 4. Decisão de produto desta rodada

**Moeda Qs — economia fictícia completa (ganhar + gastar), sem dinheiro real:**
- Ganhos: voto (+5, cap diário), opinar cedo (+5), check-in diário com streak (+10/15/25), acerto (+20), bônus de sequência (+10), badges (10–100).
- Gastos (loja fictícia): impulsionar enquete (destaque na home), molduras e títulos de perfil/ranking, proteção de streak.
- Invariantes: **votar nunca custa Qs**; 1 pessoa = 1 voto; Qs não são compráveis nem sacáveis. A economia simula monetização de ponta a ponta e prepara o terreno para os canais do §3 sem tocar em aposta.

**Features adotadas de concorrentes:** busca + navegação por categorias (Polymarket/Kalshi), liga semanal com divisões + badges + streak diário (Duolingo/Manifold), comentários por enquete com moderação (Polymarket). Perguntas criadas por usuários ficaram para uma rodada futura.

## 5. Revisão do site (achados da auditoria)

**Segurança (corrigidos nesta rodada):**
- Endpoint de resolução agendada aceitava JWT sem verificar assinatura (qualquer um podia resolver enquetes e bagunçar o ranking) → agora a assinatura é verificada.
- Deduplicação de voto era feita em aplicação com consulta limitada (500 linhas) e sem índice único → agora há `UNIQUE(marketId, fingerprint)` no banco.
- Nenhum rate limiting (voto, login admin, apelido) → adicionado.
- Comparações de senha não eram timing-safe; secret de fallback hardcoded em produção → corrigidos.

**Produto/UX (endereçados nas fases seguintes):**
- Sem busca e sem filtro por categoria; destaque da home era simplesmente a primeira enquete; dark mode existia no CSS mas estava inacessível; 3 azuis e 2 vermelhos concorrentes na identidade visual; ~13 componentes mortos de um design anterior; página 404 em inglês; zoom bloqueado no mobile (acessibilidade); gráfico sem alternativa textual; N requisições redundantes na home.

## 6. Rodada 2 (implementada)

Segunda rodada de pesquisa (detalhes de mecânica extraídos do código-fonte aberto do Manifold, do Bolão do Cartola/apps de bolão brasileiros e dos lançamentos 2025-26 de Kalshi/Polymarket) e implementação:

- **Enquetes sugeridas pela comunidade** (`/sugerir`): custa 50 Qs (calibrado pela lição do Manifold — custo alto mata o UGC), exige apelido, fila de aprovação no admin, estorno automático na recusa, badge "Pauteiro" na aprovação.
- **Bolões privados** (`/boloes`): grupos com código de convite de 6 caracteres (padrão Cartola: até 100 por grupo lá, 50 aqui; grátis para viralizar), ranking interno por Qs da semana + acurácia, compartilhamento via WhatsApp.
- **Notificações in-app** (sininho): resolução com resultado individual, conquistas, revisão de sugestão, movimento na liga e a feature-assinatura **virada de maioria** — "as pessoas mudaram de ideia" é o drama social que só uma plataforma de opinião tem (análogo emocional dos alertas de preço do Polymarket/Kalshi). Debounce de 1 aviso por direção/dia, mínimo de 20 votos.
- **Watchlist**: seguir enquete sem votar (recebe aviso de virada).
- **Widget de embed** (`/embed/:slug`): HTML leve server-rendered com placar ao vivo, temas claro/escuro e link de volta com UTM (padrão Polymarket/Substack); modal "Incorporar" com código pronto.
- **Gráfico de linha** da opinião acumulada no tempo (estilo Polymarket) no lugar das barras diárias.
- **Onboarding** na primeira visita + **bônus de boas-vindas de 100 Qs** (escada do Manifold: saldo inicial permite 2-3 ações, nunca "comprar tudo").

## 7. Backlog futuro (não incluído)

- Widget "vitrine" multi-enquetes para sidebars de portais (o embed unitário já existe).
- Painel B2B de sentimento agregado (relatórios vendáveis — modelo YouGov/Metaculus Pro).
- Programa de recompensas via concurso promocional autorizado (modelo Palpita Aí), se um dia houver apetite para prêmio real — mantendo o palpite em si gratuito.
- Push notifications nativas (a versão in-app já existe); perfil público com "sintonia com o Brasil" e termômetro contrarian.

---

### Fontes principais

Manifold (docs.manifold.markets/faq), Futuur (futuur.substack.com/about), Metaculus (metaculus.com/faq, scoring primer), Polymarket/Kalshi (análises de UX: finextra.com, avark.agency, next.io), YouGov (today.yougov.com/about/panel), Strawpoll (strawpoll.com/pricing), Palpita Aí (palpitaai.app), Palpitagem FC (palpitagem.com.br), Cartola bolão (focusgn.com), BolãoJá (dacopa.com), Duolingo (trophy.so, strivecloud.io).
