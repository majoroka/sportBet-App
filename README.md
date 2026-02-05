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
    # Fixtures (ClubElo)
    npm run update-data
    # Classificações (football-data)
    node scripts/fetch-standings.js
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

## 📈 Pipeline e Deploy

- **Atualização diária**: `.github/workflows/fetch-clubelo-data.yml` busca ClubElo + standings e faz commit dos CSVs.
- **Deploy**: `.github/workflows/deploy.yml` (GitHub Pages) após push para `main` ou conclusão bem-sucedida do fetch.
- **Cloudflare Worker** opcional para proxy de odds / CORS (`cloudflare/worker.ts`).
