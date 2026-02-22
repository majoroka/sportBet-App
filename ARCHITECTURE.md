# Arquitetura do Projeto

Este documento descreve a estrutura técnica e as decisões de design do Analisador de Futebol.

## 🏗️ Visão Geral

A aplicação segue uma arquitetura modular focada no frontend (Client-Side), onde a lógica de negócio (cálculos matemáticos) reside no navegador do cliente. O backend é utilizado apenas como proxy para proteger chaves de API (padrão Serverless).

### Fluxo de Dados

1. **Input:** CSVs estáticos alojados no repositório (`public/data/`).
   - `clubelo_latest.csv`: Dados de jogos e xG (atualizado diariamente).
   - `standings/*.csv`: Tabelas de classificação por liga (códigos E0, P1, D1, etc.).
   - `fixtures_football-data.csv`: Fixtures + odds B365 (usado no scoring de valor 1X2).
   - `ranking_elo.csv`: Ranking ELO por clube (para pills no cabeçalho).
   - `teams_mapping_package_clean.json`: Base de dados de normalização de nomes de equipas e mapeamento de ligas/logos.
   - `scoring-thresholds.jsonc`: Fonte de truth dos thresholds/pontos dos scorings.
2. **Adapter:** Normaliza os dados brutos para o modelo de domínio `Fixture`.
3. **Calculators:** Aplica modelos matemáticos (Poisson) aos dados normalizados (`xG` -> `Probabilities`).
4. **Scoring Engine:** Aplica modelos de scoring data-driven (team/match/multi-outcome) e agrega o Best Pick Global.
5. **UI Components:** Renderiza os dados processados para o utilizador.
   - Tabs de classificação: Global / Casa / Fora / +2,5 (Últimos 10) / +1,5 (Últimos 10) com grelha de forma colorida.
   - ScoringHub com tabs, breakdown por grupos e banner Best Pick Global.
   - Card “Equipas”: xG por equipa calculado a partir da matriz de correct score (truncada a 6 golos), logos centrados e pill de xG.
   - Paleta coerente azul `#60A5FA` (over/positivo) e rosa `#F472B6` (under/negativo) aplicada em gráficos, quadrados de forma e cards de golos/BTTS/Clean Sheet.

## 📂 Estrutura de Pastas (`src/`)

- **`domain/`**: Contém as definições de tipos TypeScript (`types.ts`). É o contrato de dados da aplicação. Nada aqui deve depender de lógica externa.
- **`calculators/`**: Lógica pura de negócio.
  - `poisson.ts`: Implementação matemática da distribuição de Poisson.
  - `marketsFromProbabilities.ts`: Derivação de odds de mercado (1X2, O/U, etc.) a partir da matriz de resultados.
  - `standings.ts`: Processamento de CSV de resultados para gerar tabela de classificação e formas (últimos 10, limiares 2.5 e 1.5).
- **`adapters/`**: Camada de transformação.
  - `csvAdapter.ts`: Converte CSV bruto para objetos `Fixture`.
- **`components/`**: Componentes React de UI.
  - `FixtureCard.tsx`: Resumo do jogo.
  - `FixtureDetails.tsx`: Vista detalhada.
  - `FilterBar.tsx`: Filtros (data/país/jogo).
  - `AppHeader.tsx`: Cabeçalho e identidade visual.
  - `scoring/ScoringHub.tsx`: Tabs de scoring, banner Best Pick Global e ScoreCards.
- **`hooks/`**:
  - `useFixtures.ts`: Carregamento de dados (fetch, fallback, parse, filtros).
- **`lib/`**: Bibliotecas utilitárias.
  - `teamMapping.ts`: Sistema de normalização de nomes e resolução de IDs de equipas/ligas.
  - `logo.ts`: Resolve nomes de equipas para ficheiros de logo usando `src/lib/logoManifest.json`.
- **`data/`**:
  - `footballDataOdds.ts`: Loader/cache do CSV `fixtures_football-data.csv` (odds B365).
- **`utils/`**:
  - `fetchWithCacheBust.ts`: Helper de fetch com cache normal em prod e cache-busting em dev.
- **`config/`**:
  - `leagues.ts`: Configuração canónica de ligas (divisão, nome de exibição, aliases e `standings_url`).
  - `countries.ts`: Mapa de códigos de país para nome e bandeira.
- **`scoring/`**:
  - `models/` e `compute/`: Configs e funções puras por mercado.
  - `aggregateBestPickGlobal.ts`: Agregador do Best Pick cross-market.
  - `types.ts`: Tipos comuns do scoring.
- **`scripts/`** (Node):
  - `scripts/data/`: fetch e atualização de dados.
    - `fetch-clubelo.js`: Atualiza `public/data/clubelo_latest.csv`.
    - `fetch-standings.js`: Atualiza `public/data/standings/*.csv`.
    - `fetch-football-data-fixtures.js`: Atualiza `public/data/fixtures_football-data.csv`.
  - `scripts/logos/`: gestão de logos.
    - `generate-logo-manifest.js`: Indexa `public/logos` em `src/lib/logoManifest.json`.
    - `fill-logos.js`: Preenche paths no mapping.
  - `scripts/mapping/`: normalização e relatórios.
    - `map-fixtures.ts`: Gera relatórios de equipas mapeadas/não mapeadas entre fixtures e o JSON.
- **`services/`**: (Planeado) Gestão de fetch e caching.

## 🧮 Modelo Matemático

O núcleo da aplicação baseia-se na **Distribuição de Poisson**.

- **Input:** Expected Goals (xG) da equipa da Casa e de Fora.
- **Processo:**
  1. Gera-se uma matriz de probabilidades de resultados exatos (ex: 0-0, 1-0, 0-1...) até 9 golos.
  2. Somam-se as probabilidades da matriz para derivar mercados secundários (ex: somar todas as células onde Casa > Fora para obter a probabilidade de Vitória da Casa).
  3. A cauda de probabilidades (7+ golos) é mantida separada para consistência em UI e métricas.

## ☁️ Infraestrutura

- **GitHub Pages:** Alojamento estático dos assets (HTML/JS/CSS).
- **GitHub Actions (Data Pipeline):**
  - Workflow diário (`fetch-clubelo-data.yml`) às **05:00 UTC** que executa scripts Node.js.
- Scripts (`scripts/data/fetch-*.js`) descarregam dados de fontes externas (ClubElo, Football-Data). (Extensível para snapshots de Elo por data, conforme necessidade.)
  - Os dados são processados e guardados na pasta `public/data`, servindo como uma "cache estática" para o frontend.
- **Cloudflare Workers:** (Opcional/Híbrido)
  - Função: Proxy para APIs de odds externas.
  - Segurança: Armazena API Keys (ex: The Odds API) que não podem estar no frontend.
  - CORS: Gere os cabeçalhos para permitir pedidos do domínio GitHub Pages.
  - Proxy de CSV: Endpoint para contornar CORS ao buscar classificações de sites externos.

## 🎨 Design System

- **Tailwind CSS:** Utility-first CSS.
- **Tipografia:**
  - *Rajdhani*: Títulos e textos gerais.
  - *Share Tech Mono*: Dados numéricos, percentagens e odds.
  