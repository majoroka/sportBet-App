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
- [x] **Pipeline de Dados:** Automação via GitHub Actions para atualização diária de jogos e classificações.

## 🚧 Em Progresso (Fase 2 - Visualização e UX)

- [x] **Heatmap de Resultados:** Substituir a lista de "Correct Score" por uma grelha visual colorida (Heatmap).
- [x] **Gráficos:** Implementar Chart.js para visualizar probabilidades (1X2).
- [x] **Classificação:** Tabela de classificação com forma recente e cálculo automático via CSV.
- [x] **Logótipos:** Exibição de emblemas das equipas com fallback.
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
