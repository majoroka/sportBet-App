# Roadmap do Produto

Este documento lista as funcionalidades planeadas e o estado atual do desenvolvimento.

## ✅ Concluído (Fase 1 - MVP)

- [x] Configuração do projeto (Vite, React, TS, Tailwind).
- [x] Estrutura de pastas modular (Domain, Adapters, Calculators).
- [x] Leitura de dados via CSV (Fallback local).
- [x] Motor de cálculo Poisson (1X2, DC, BTTS, O/U, Correct Score).
- [x] UI Básica: Lista de jogos e Detalhes do jogo.
- [x] Filtros de seleção (Data -> Jogo).
- [x] Design System inicial (Fontes Tech).
- [x] **Normalização de Dados:** Implementação de `teamMapping.ts` para mapear nomes de equipas e ligas de forma centralizada.
- [x] **Resiliência:** Tratamento de erros robusto para falhas no carregamento de dados (JSON/CSV) e seletores de data vazios.
- [x] **Pipeline de Dados:** Automação via GitHub Actions para atualização diária de jogos e classificações.

## 🚧 Em Progresso (Fase 2 - Visualização e UX)

- [x] **Heatmap de Resultados:** Substituir a lista de "Correct Score" por uma grelha visual colorida (Heatmap).
- [x] **Gráficos:** Implementar Chart.js para visualizar probabilidades (1X2).
- [x] **Classificação:** Tabela de classificação com forma recente e cálculo automático via CSV.
- [x] **Classificação - Formas avançadas:** Tabs +2,5 e +1,5 (últimos 10) com grelha de cores alinhada ao tema.
- [x] **Card Equipas:** Logos centrados e pill de xG (derivado do correct score truncado a 6 golos).
- [x] **Pills de ELO:** ELO + ranking no cabeçalho (ranking_elo.csv).
- [x] **Estatísticas por equipa:** Tabela comparativa com accordions por categoria e limpeza de linhas sem dados.
- [x] **Scorings:** Motor data-driven + ScoringHub com tabs por mercado e breakdown por grupos.
- [x] **Best Pick Global:** Banner cross-market com highlight e navegação para o card vencedor.
- [x] **Acordeões no FixtureDetails:** Classificação/Probabilidades/Estatísticas colapsadas por defeito.
- [x] **Ranking no cabeçalho:** Badge #N junto aos pills de ELO/xG.
- [x] **Odds Football-Data:** Fetch adicional `fixtures_football-data.csv` e uso no scoring 1X2 (Valor/Odds justas).
- [x] **Métricas da liga (linha compacta):** Resumo por baixo da classificação com tooltips.
- [x] **Logótipos:** Exibição de emblemas das equipas com fallback.
- [x] **Normalização Avançada:** Aliases cruzados fixtures/standings + sinónimos (ex.: Farul/Viitorul, Saint‑Étienne/St Etienne) e deteção de liga por equipas.
- [x] **Persistência de filtros:** URL + localStorage (data/país/jogo).
- [x] **Lint/Format:** ESLint + Prettier + workflow de CI.
- [ ] **Favoritos:** Permitir guardar jogos numa "Watchlist" (usando `localStorage`).
- [ ] **Dark Mode:** Implementar alternância de tema claro/escuro.

## 📅 Curto Prazo (Fase 3 - Dados Reais)

- [ ] **Integração API:** Ligar o Cloudflare Worker a uma API real de Odds (ex: The Odds API ou API-Football).
- [ ] **Comparador de Odds:** Mostrar odds reais das casas ao lado das probabilidades do modelo.
- [ ] **Destaque de Valor:** Melhorar o algoritmo de deteção de "Value Bets" (Kelly Criterion).

## 🔮 Longo Prazo (Fase 4 - Avançado)

- [ ] **Routing:** URLs partilháveis para jogos específicos (React Router).
- [ ] **Backtesting:** Ferramenta para validar o modelo contra resultados passados.
- [ ] **Modelos Alternativos:** Implementar Dixon-Coles para ajustar a força defensiva/ofensiva.
- [ ] **PWA:** Tornar a app instalável no telemóvel.

## 🐛 Known Issues / Débito Técnico

- O cálculo de Poisson assume independência entre golos da casa e fora (limitação do modelo simples).
- Atualmente a app depende de um CSV estático (`fixtures_fallback.csv`) se a API não estiver configurada.
- Algumas ligas secundárias ainda não têm standings_url oficial; a UI apenas suprime o aviso quando não há fonte disponível.
