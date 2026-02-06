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
  - Dashboard de página única com filtros para **Data, País e Jogo**.
  - Visualização imediata de probabilidades, gráficos (Chart.js) e estatísticas ao selecionar um jogo.
  - Tabela de Classificação com forma recente (para ligas suportadas).
  - Logótipos dos clubes (com fallback visual).
- **Design:** Interface responsiva com tema "Tech" (Fontes Rajdhani e Share Tech Mono).
- **Dados Atualizados:** Pipeline automatizada (GitHub Actions) que atualiza diariamente os dados de jogos (ClubElo) e classificações (Football-Data).

## 🛠️ Stack Tecnológica

- **Core:** React + TypeScript + Vite
- **Estilos:** Tailwind CSS
- **Dados:** PapaParse (CSV Parsing)
- **Normalização:** Sistema personalizado de mapeamento de equipas (JSON)
- **Testes:** Vitest
- **Automação:** GitHub Actions (Data Fetching diário)
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
    node scripts/generate-logo-manifest.js   # Reindexa logos em public/logos
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
  - Pastas de logos devem incluir o código do país entre parêntesis. Ex.: `public/logos/Bundesliga (GER)/Bayern-munchen.png`.
- Manifesto de logos: `src/lib/logoManifest.json` (gerado por `scripts/generate-logo-manifest.js`).
  - Se adicionares/removeres logos ou pastas, corre o script para reindexar.
- Resolver aliases automaticamente (fixtures → mapping):
  - `scripts/map-fixtures.ts` cria relatórios `mapped_teams_from_fixtures.json` e `unmapped_teams_from_fixtures.json`.
  - Usa a mesma normalização do runtime (lowercase, sem acentos, tokens) e cai para aliases/IDs.

## 🔧 Scripts úteis

- `npm run update-data` — força refresh de fixtures + standings.
- `node scripts/generate-logo-manifest.js` — reindexa todos os logos em `public/logos`.
- `node scripts/map-fixtures.ts` — lista equipas dos fixtures e diz quais casam com o mapping/aliases.
- `npm run build` — valida o projeto (TypeScript + Vite).

## 🩹 Troubleshooting rápido

- **Logo não aparece**: confirma nome/pasta em `public/logos`, corre `node scripts/generate-logo-manifest.js` e volta a abrir a UI.
- **Sem FORMA/destaque na classificação**: acrescenta alias no `teams_mapping_package_clean.json` (football-data/clubelo) e garante que a liga existe em `src/config/leagues.ts` com aliases/código correto.
- **Logs “Caminho não encontrado”**: verifica se a competição está em `src/config/leagues.ts` com `standings_url` ou `aliases` que coincidam com o nome do fixture.

## 📈 Pipeline e Deploy

- **Atualização diária**: `.github/workflows/fetch-clubelo-data.yml` busca ClubElo + standings e faz commit dos CSVs.
- **Deploy**: `.github/workflows/deploy.yml` (GitHub Pages) após push para `main` ou conclusão bem-sucedida do fetch.
- **Cloudflare Worker** opcional para proxy de odds / CORS (`cloudflare/worker.ts`).
