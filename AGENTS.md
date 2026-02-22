# sportBet-App — Instruções para o agente

## Objetivo

Implementar um sistema de "Scorings" (0–100) escalável por mercado.
Primeiro mercado: "Equipa marcar +1,5 golos".

## Regras

- Não alterar UI existente sem necessidade.

- Novo scoring tem de devolver: total (0–100) + breakdown por grupos + top reasons.
- Código em TypeScript, com config em JSON/TS (data-driven).
- Componentes React/Tailwind reutilizáveis para suportar vários mercados no futuro.
- Sempre que possível, devolver diffs pequenos e testáveis.

## Workflow obrigatório

1) Ler estrutura atual do FixtureDetails (e componentes relacionados)
2) Implementar motor de scoring (funções puras + config)
3) Implementar UI: Score Hub (tabs/selector + 2 cards Casa/Fora + accordion breakdown)
4) Integrar no FixtureDetails sem quebrar layout
5) Garantir builds sem erros e sem regressões visuais

## Outputs esperados

- src/scoring/models/... (config e modelos)
- src/scoring/compute/... (funções puras)
- src/components/scoring/... (UI)
- integração no ecrã de detalhes do jogo
