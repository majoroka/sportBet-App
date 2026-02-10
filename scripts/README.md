# Scripts

Organização por domínio para evitar caminhos quebrados e facilitar manutenção.

## Estrutura

- `scripts/data/`
  - `fetch-clubelo.js` — atualiza `public/data/clubelo_latest.csv` (usa `scripts/data/last-fetch.json`).
  - `fetch-standings.js` — atualiza `public/data/standings/*.csv`.
- `scripts/logos/`
  - `generate-logo-manifest.js` — reindexa `public/logos` em `src/lib/logoManifest.json`.
  - `fill-logos.js` — preenche paths de logos no JSON de equipas.
  - `update-logos-arg.js` — overrides para logos ARG (script pontual).
- `scripts/mapping/`
  - `map-fixtures.ts` — gera relatórios de equipas mapeadas/não mapeadas.
  - `report-unmatched.js`, `apply-batch-aliases.js`, `autofill-fixture-aliases.js` — utilitários de aliases.
  - `fix-*.js` — scripts pontuais de correção (usar apenas quando necessário).

## Exemplos (executar na raiz do projeto)

```bash
node scripts/data/fetch-clubelo.js
node scripts/data/fetch-standings.js
node scripts/logos/generate-logo-manifest.js
node scripts/logos/fill-logos.js
npx ts-node scripts/mapping/map-fixtures.ts
node scripts/mapping/report-unmatched.js
```

## Nota

Alguns scripts fazem alterações diretas em `public/data/` ou no mapping JSON. Antes de correr em produção, idealmente cria um backup ou corre numa branch.
