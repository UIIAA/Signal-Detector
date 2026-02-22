# Feature: Remover Accountability Engine (código morto)
**Status:** Done
**Prioridade:** P2
**Data:** 2026-02-21

## Objetivo
Remover o microserviço `services/accountability-engine/` que foi planejado mas nunca integrado ao frontend. Documentar a funcionalidade de coaching PNL como feature futura a ser implementada diretamente no frontend.

## Situação Atual
- `services/accountability-engine/` existe com:
  - Express server (porta 5001)
  - `PatternAnalyzer.js` — detecção de padrões comportamentais (implementação dummy)
  - `PNLCoach.js` — geração de perguntas de coaching com técnicas PNL
- **Zero referências** no frontend (nenhum import, nenhum proxy, nenhuma chamada)
- Nunca deployado (Vercel só faz build do frontend)
- Tem `node_modules/` local (espaço em disco desperdiçado)
- Não está no .gitignore — código morto rastreado pelo git

## Comportamento
1. Remover diretório `services/accountability-engine/`
2. Remover diretório `services/` (ficará vazio)
3. Documentar funcionalidade de coaching PNL como gap no SPEC.md (já está)
4. Atualizar ARCHITECTURE.md (ADR-007 já documenta que foi abandonado)

## Regras de Negócio
- A funcionalidade de coaching PNL é desejada para o futuro
- Quando implementada, será como API routes no Next.js (padrão do projeto)
- O código do PNLCoach pode servir de referência (preservar em docs/archive/ se quiser)

## Casos Extremos
- Se alguém clonar o repo e tentar rodar o accountability-engine → não funcionará (sem POSTGRES_URL)
- Nenhuma funcionalidade do frontend será afetada

## Critérios de Aceite
- [x] Diretório `services/accountability-engine/` removido
- [x] Diretório `services/` removido (vazio)
- [x] Build passa sem erros
- [x] Nenhuma referência a accountability-engine no codebase (apenas docs/archive)
- [x] SPEC.md já documenta coaching PNL como "Parcial"

## Decisões Técnicas
- Não preservar código — a lógica do PNLCoach é simples o suficiente para reimplementar como API route quando necessário
- Se quiser preservar referência, salvar em docs/archive/ antes de deletar

## Dependências
- Depende de: nenhuma (independente)
- Bloqueia: nenhuma
