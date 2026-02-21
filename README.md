# Analisador de Futebol (SportBet App)

Uma aplicação web estática (SPA) alojada no GitHub Pages, desenhada para calcular probabilidades de jogos de futebol baseadas em estatísticas (xG) e identificar valor ("value bets") comparando com as odds do mercado.

## 🚀 Funcionalidades Atuais

- **Cálculo de Probabilidades:** Utiliza a distribuição de Poisson baseada em Expected Goals (xG) para calcular:
  - 1X2 (Vitória/Empate/Derrota)
  - Dupla Hipótese (Double Chance)
  - Ambas Marcam (BTTS)
  - Over/Under (0.5 a 4.5 golos)
  - Golos por Equipa (Over e Exatos)
  - Handicap e Margem de Vitória
  - Resultado Exato (Correct Score)
- **Interface de Análise:**
  - Dashboard de página única com filtros para **Data, País e Jogo** (datas exibidas como `DD/MMM/AA (ddd)`).
  - Filtros persistentes (URL + localStorage) para manter seleção entre refreshes.
  - Visualização imediata de probabilidades, gráficos (Chart.js) e estatísticas ao selecionar um jogo.
  - Secção **SCORING** com múltiplos mercados (team/match/multi-outcome), tabs e breakdown por grupos.
  - Banner **Best Pick Global** (cross-market) com navegação para o card vencedor e highlight.
  - Auto-seleção do tab do Best Pick ao abrir um fixture (sem sobrepor cliques do utilizador).
  - Tabela de Classificação com tabs: Global, Casa, Fora, **+2,5 (Últimos 10)** e **+1,5 (Últimos 10)**, com grelha de últimos jogos colorida.
  - Linha compacta de métricas da liga por baixo da classificação, com tooltips.
  - Classificação/Probabilidades/Estatísticas organizadas em acordeões (colapsados por defeito).
  - Secção de Estatística com tabela comparativa por equipa e accordions por categoria (resultados, consistência, remates, cantos, disciplina).
  - Card “Equipas” com xG por clube (derivado da matriz de correct score, truncada a 6 golos), logos centrados e pill de xG.
  - Pills de ELO no cabeçalho do jogo (ranking via `public/data/ranking_elo.csv`) + badge #N de classificação junto aos pills.
  - Odds B365 para o scoring 1X2 (Valor/Odds justas) via `public/data/fixtures_football-data.csv`.
  - Bloco de Probabilidades redesenhado: 1X2 com subcards destacados, Overround do book e cards de mercados alinhados por blocos (Dupla Hipótese, Golos da Equipa, Mercado de Golos, Vitória +1,5, BTTS e Sem Sofrer).
  - Heatmap de Resultados com paleta azul/rosa e destaque único para o resultado mais provável (estrela no canto da célula top).
  - **Dark Mode** com alternância claro/escuro e persistência da preferência do utilizador.
  - Cabeçalho da app com logo (`public/logos/logo-app.png`) ao lado do título.
  - Logos UEFA no cabeçalho da competição (UCL/UEL/UECL) via `public/logos/UEFA/`.
  - Logótipos dos clubes (com fallback visual) e design responsivo (forma oculta em mobile para não quebrar layout).
- **Design:** Interface responsiva com tema "Tech" (Fontes Rajdhani e Share Tech Mono). Paleta principal coerente: azul `#60A5FA` (over/positivo) e rosa `#F472B6` (under/negativo) aplicada em gráficos, quadrados de forma e cards de golos/BTTS/Clean Sheet.
- **Dados Atualizados:** Pipeline automatizada (GitHub Actions) que atualiza diariamente, às **05:00 UTC**, ClubElo, standings e fixtures/odds do Football-Data.

## 🛠️ Stack Tecnológica

- **Core:** React + TypeScript + Vite
- **Estilos:** Tailwind CSS
- **Dados:** PapaParse (CSV Parsing)
- **Normalização:** Sistema personalizado de mapeamento de equipas (JSON)
- **Testes:** Vitest
- **Automação:** GitHub Actions (Data Fetching diário) + `launchd` (auto-pull local opcional no macOS)
- **Deploy:** GitHub Actions -> GitHub Pages
- **Backend (Opcional):** Cloudflare Workers (para proxy de APIs e gestão de segredos).

## 📦 Instalação e Uso

1. **Clonar o repositório:**

    ```bash
    git clone <url-do-repo>
    cd sportBet-App
    ```

2. **Instalar dependências:**

    ```bash
    npm install
    ```

3. **Atualizar dados (necessário internet):**

    ```bash
    npm run update-data              # Atualiza fixtures (ClubElo) + standings (Football-Data)
    node scripts/logos/generate-logo-manifest.js   # Reindexa logos em public/logos
    ```

    - Os ficheiros ficam em `public/data/clubelo_latest.csv` e `public/data/standings/*.csv` usando **códigos canónicos** (ex.: `E0.csv`, `P1.csv`, `SC0.csv`).
    - Se estiveres offline, a app cai para `public/data/fixtures_fallback.csv` e standings existentes.

4. **Rodar localmente:**

    ```bash
    npm run dev
    ```

    - Por omissão Vite arranca em `http://localhost:5173`.

5. **Build para produção:**

    ```bash
    npm run build
    ```

6. **Testes (Vitest):**

    ```bash
    npm test -- --run
    ```

## 🗺️ Dados & Mapeamento de Equipas

- Base principal: `public/data/teams_mapping_package_clean.json`
  - Contém IDs, nomes canónicos, aliases (football-data / clubelo), país, liga e caminho do logo.
  - Inclui normalização cruzada de nomes (ex.: **Ludogorets** como canónico e **Razgrad** como alias ClubElo).
  - Pastas de logos devem incluir o código do país entre parêntesis. Ex.: `public/logos/Bundesliga (GER)/Bayern-munchen.png`.
- Competições UEFA:
  - Standings/fases dedicadas em `public/data/champions-league-2025.csv`, `public/data/europa-league-2025.csv` e `public/data/conference-league-2025.csv`.
  - Logos em `public/logos/UEFA/`.
- Manifesto de logos: `src/lib/logoManifest.json` (gerado por `scripts/logos/generate-logo-manifest.js`).
  - Se adicionares/removeres logos ou pastas, corre o script para reindexar.
- Resolver aliases automaticamente (fixtures → mapping):
  - `scripts/mapping/map-fixtures.ts` cria relatórios `mapped_teams_from_fixtures.json` e `unmapped_teams_from_fixtures.json`.
  - Usa a mesma normalização do runtime (lowercase, sem acentos, tokens) e cai para aliases/IDs.
- Ranking ELO: `public/data/ranking_elo.csv` (usado no pill do cabeçalho).

## 🔧 Scripts úteis

- `npm run update-data` — força refresh de fixtures + standings.
- `node scripts/logos/generate-logo-manifest.js` — reindexa todos os logos em `public/logos`.
- `node scripts/mapping/map-fixtures.ts` — lista equipas dos fixtures e diz quais casam com o mapping/aliases.
- `node scripts/data/fetch-football-data-fixtures.js` — descarrega `public/data/fixtures_football-data.csv`.
- `scripts/automation/install-auto-pull-macos.sh` — instala um `LaunchAgent` macOS para `git pull --ff-only` automático a cada 30 minutos (com proteções para branch/dirty tree).
- `scripts/automation/uninstall-auto-pull-macos.sh` — remove o `LaunchAgent` de auto-pull.
- Ver mais em `scripts/README.md`.
- `npm run build` — valida o projeto (TypeScript + Vite).
- `npm run lint` — lint (ESLint).
- `npm run format` — format (Prettier).

## 🩹 Troubleshooting rápido

- **Logo não aparece**: confirma nome/pasta em `public/logos`, corre `node scripts/logos/generate-logo-manifest.js` e volta a abrir a UI.
- **Logo UEFA não aparece no cabeçalho da competição**: confirma os ficheiros em `public/logos/UEFA/` (`UEFA_Champions_League_logo.png`, `UEFA_Europa_League_logo.png`, `UEFA_Europa_Conference_League_logo.png`).
- **Sem FORMA/destaque na classificação**: acrescenta alias no `teams_mapping_package_clean.json` (football-data/clubelo) e garante que a liga existe em `src/config/leagues.ts` com aliases/código correto.
- **Equipa duplicada por naming (ex.: Razgrad/Ludogorets)**: unifica no `teams_mapping_package_clean.json` com um nome canónico e aliases por fonte.
- **Logs “Caminho não encontrado”**: verifica se a competição está em `src/config/leagues.ts` com `standings_url` ou `aliases` que coincidam com o nome do fixture.
- **Tooltip de FORMA**: a dica do rato mostra agora o resultado e o lado (H/A) do jogo; se vês “H/A” trocado, verifica o parsing em `src/calculators/standings.ts`.
- **Auto-pull local não está a correr**: verifica `launchctl print gui/$(id -u)/com.sportbet.autopull` e os logs em `.git/auto-pull.log`.

## 📈 Pipeline e Deploy

- **Atualização diária**: `.github/workflows/fetch-clubelo-data.yml` busca ClubElo + standings e faz commit dos CSVs.
- **Deploy**: `.github/workflows/deploy.yml` (GitHub Pages) após push para `main` ou conclusão bem-sucedida do fetch.
- **Cloudflare Worker** opcional para proxy de odds / CORS (`cloudflare/worker.ts`).
- **Sincronização local opcional**: `scripts/automation/install-auto-pull-macos.sh` configura auto-pull periódico no ambiente macOS de desenvolvimento.
