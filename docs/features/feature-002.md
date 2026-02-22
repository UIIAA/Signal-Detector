# Feature: Refatoração do Dashboard
**Status:** Draft
**Prioridade:** P1
**Data:** 2026-02-21

## Objetivo
Reduzir o dashboard.js de 731 linhas para ~200, extraindo componentes, hooks e constantes. Melhorar manutenibilidade sem alterar funcionalidade.

## Situação Atual
- `pages/dashboard.js`: 731 linhas, monolítico
- 11 variáveis de estado inline
- 5 chamadas de API sem hooks customizados
- Funções de cor hardcoded e duplicadas
- Goal formatting duplicado (linhas 109-131 e 253-256)
- Estado `analytics` (linha 79) nunca utilizado

## Comportamento
1. Dashboard continua funcionando exatamente como antes
2. Nenhuma mudança visual ou funcional
3. Código fica organizado em módulos reutilizáveis

## Plano de Extração

### Hooks customizados (novo: `src/hooks/`)
| Hook | Responsabilidade | Estado que absorve |
|------|-----------------|-------------------|
| `useDashboardData()` | Carrega goals + activities no mount | goals, recentActivities, loading, error, activitiesLoading |
| `useFilteredAnalytics(goals, selectedGoals, timeframe)` | Carrega insights + top goals quando filtros mudam | filteredAnalytics, topGoals, analyticsLoading |
| `useGoalProgress(setGoals)` | Atualiza progresso de goal via API | progressLoading |

### Componentes (novo: `src/components/dashboard/`)
| Componente | Linhas atuais | Conteúdo |
|-----------|--------------|----------|
| `MetricsGrid` | 385-494 | 4 cards de métricas (produtividade, sinais, ruídos, streak) |
| `WeeklyChart` | 502-529 | Gráfico de produtividade semanal (AreaChart) |
| `ProgressChart` | 532-549 | Gráfico real vs. ideal (LineChart) |
| `TopGoalsList` | 567-653 | Lista de objetivos mais sinalizados + toggle timeframe |
| `RecommendationsList` | 686-723 | Cards de recomendações IA |

### Constantes (novo: `src/constants/colors.js`)
- `STATUS_COLORS`: signal → #34C759, noise → #FF3B30, neutral → #86868B
- `PRIORITY_COLORS`: high → #FF3B30, medium → #86868B, low → #1D1D1F
- `GOAL_TYPE_COLORS`: short/medium/long → #1D1D1F

### Limpeza
- Remover estado `analytics` (nunca usado)
- Extrair `formatGoalsData()` como utility (elimina duplicação)

## Regras de Negócio
- Zero mudança visual — refatoração pura
- Todos os loading states devem continuar funcionando
- Filtros por objetivo e timeframe devem manter comportamento idêntico

## Casos Extremos
- Se algum componente extraído perder prop → erro de runtime no dashboard
- Se hook não inicializar corretamente → dashboard fica em loading infinito

## Critérios de Aceite
- [ ] dashboard.js tem ~200 linhas ou menos
- [ ] 3 hooks customizados criados e funcionando
- [ ] 5 sub-componentes extraídos
- [ ] Constantes de cores centralizadas
- [ ] Build passa sem erros
- [ ] Dashboard visualmente idêntico ao antes
- [ ] Nenhuma funcionalidade quebrada (filtros, charts, progress updates)

## Decisões Técnicas
- Hooks em `src/hooks/` (junto com useApi.js existente)
- Componentes de dashboard em `src/components/dashboard/` (subpasta para não poluir)
- Não adicionar TypeScript nesta iteração
- Não trocar para React Query/SWR nesta iteração (manter fetch/useState por consistência)

## Dependências
- Depende de: Feature 001 (deploy na Vercel, para ter baseline)
- Bloqueia: nenhuma
