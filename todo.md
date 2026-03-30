# AchoQ - TODO

## Funcionalidades Core

- [x] Landing page com design estilo Kalshi
- [x] Header com logo AchoQ e navegação
- [x] Footer com links e redes sociais
- [x] Seção "Como Funciona"
- [x] Seção "Metodologia"
- [x] Seção "Disclaimer" (aviso legal)
- [x] Schema do banco de dados (markets + votes + users)
- [x] Migrations aplicadas com sucesso
- [x] Seed automático dos 3 mercados iniciais
- [x] Backend tRPC: procedure markets.list
- [x] Backend tRPC: procedure markets.bySlug
- [x] Backend tRPC: procedure markets.checkVote
- [x] Backend tRPC: procedure markets.vote (votação real)
- [x] Backend tRPC: procedure markets.demographics
- [x] Hook useFingerprint para identificação anônima
- [x] Componente MarketCard com votação real
- [x] Home.tsx conectado ao banco de dados via tRPC
- [x] Mercado em destaque (eleições 2026)
- [x] Outros mercados (Copa 2026 + Neymar)
- [x] Cores: Vermelho (#B91C1C) para opção A, Azul BTG (#002B5C) para opção B
- [x] Prevenção de voto duplo por fingerprint
- [x] Atualização em tempo real após votação
- [x] Botão de compartilhar no Twitter
- [x] Testes unitários (10 testes passando)

## Melhorias Futuras

- [ ] Gráfico de evolução temporal dos votos (TrendChart)
- [ ] Seção de demografia por região
- [ ] Página de ranking de usuários
- [ ] Login com OAuth para rastreamento por usuário
- [ ] Notificações de novos mercados
- [ ] Painel admin para criar novos mercados

## Páginas Institucionais

- [x] Página "Como Funciona" (/como-funciona)
- [x] Página "Ranking" (/ranking)
- [x] Página "Metodologia" (/metodologia)
- [x] Página "Legal" (/legal)
- [x] Página "Termos de Uso" (/termos)
- [x] Página "Política de Privacidade" (/privacidade)
- [x] Atualizar Header com links funcionais
- [x] Atualizar Footer com links funcionais
- [x] Registrar todas as rotas em App.tsx
