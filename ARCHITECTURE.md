# Arquitetura do Projeto

Este documento descreve a estrutura técnica e as decisões de design do Analisador de Futebol.

## 🏗️ Visão Geral

A aplicação segue uma arquitetura modular focada no frontend (Client-Side), onde a lógica de negócio (cálculos matemáticos) reside no navegador do cliente. O backend é utilizado apenas como proxy para proteger chaves de API (padrão Serverless).

### Fluxo de Dados

1. **Input:** CSVs estáticos alojados no repositório (`public/data/`).
   - `clubelo_latest.csv`: Dados de jogos e xG (atualizado diariamente).
   - `standings/*.csv`: Tabelas de classificação por liga.
   - `teams_mapping_package_clean.json`: Base de dados de normalização de nomes de equipas e mapeamento de ligas.
2. **Adapter:** Normaliza os dados brutos para o modelo de domínio `Fixture`.
3. **Calculators:** Aplica modelos matemáticos (Poisson) aos dados normalizados (`xG` -> `Probabilities`).
4. **UI Components:** Renderiza os dados processados para o utilizador.

## 📂 Estrutura de Pastas (`src/`)

- **`domain/`**: Contém as definições de tipos TypeScript (`types.ts`). É o contrato de dados da aplicação. Nada aqui deve depender de lógica externa.
- **`calculators/`**: Lógica pura de negócio.
  - `poisson.ts`: Implementação matemática da distribuição de Poisson.
  - `marketsFromProbabilities.ts`: Derivação de odds de mercado (1X2, O/U, etc.) a partir da matriz de resultados.
  - `standings.ts`: Processamento de CSV de resultados para gerar tabela de classificação.
- **`adapters/`**: Camada de transformação.
  - `csvAdapter.ts`: Converte CSV bruto para objetos `Fixture`.
- **`components/`**: Componentes React de UI.
  - `FixtureCard.tsx`: Resumo do jogo.
  - `FixtureDetails.tsx`: Vista detalhada.
- **`lib/`**: Bibliotecas utilitárias.
  - `teamMapping.ts`: Sistema de normalização de nomes e resolução de IDs de equipas/ligas.
- **`services/`**: (Planeado) Gestão de fetch e caching.

## 🧮 Modelo Matemático

O núcleo da aplicação baseia-se na **Distribuição de Poisson**.

- **Input:** Expected Goals (xG) da equipa da Casa e de Fora.
- **Processo:**
  1. Gera-se uma matriz de probabilidades de resultados exatos (ex: 0-0, 1-0, 0-1...) até 9 golos.
  2. Somam-se as probabilidades da matriz para derivar mercados secundários (ex: somar todas as células onde Casa > Fora para obter a probabilidade de Vitória da Casa).

## ☁️ Infraestrutura

- **GitHub Pages:** Alojamento estático dos assets (HTML/JS/CSS).
- **GitHub Actions (Data Pipeline):**
  - Workflow diário (`fetch-clubelo-data.yml`) que executa scripts Node.js.
  - Scripts (`scripts/fetch-*.js`) descarregam dados de fontes externas (ClubElo, Football-Data).
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
  