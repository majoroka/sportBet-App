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

3. **Rodar localmente:**

    ```bash
    npm run dev
    ```

4. **Build para produção:**

    ```bash
    npm run build
    ```
