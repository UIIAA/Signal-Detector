# Signal Detector - Decisões Arquiteturais

## Diagrama do Sistema

```
┌─────────────────────────────────────────────────┐
│                   BROWSER                        │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│         FRONTEND (Next.js :3000)                │
│  ┌────────────────────────────────────────────┐ │
│  │ Pages: Dashboard, Goals, Habits, Kanban,   │ │
│  │        Critical Path, Login                 │ │
│  │ Components: 14+ (MUI v7)                   │ │
│  │ Auth: NextAuth.js (JWT)                    │ │
│  │ Services: SignalClassifier, KanbanService  │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │ API Routes (/pages/api/) - 20+ endpoints   │ │
│  │ Middleware: rate-limit, validation, auth    │ │
│  └────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────┘
                     │
      ┌──────────────┴──────────────┐
      │                             │
┌─────▼──────────┐   ┌─────────────▼─────────────┐
│ Direct DB      │   │ Signal Processor (:4000)   │
│ (via query())  │   │ Express + Gemini AI        │
│                │   │ - /classify                 │
│                │   │ - /analyze-goals            │
│                │   │ - /insights                 │
└─────┬──────────┘   └─────────────┬──────────────┘
      │                             │
      └──────────────┬──────────────┘
                     │
            ┌────────▼────────┐
            │  PostgreSQL     │
            │  (Neon)         │
            │  ~20 tabelas    │
            │  16 migrações   │
            └─────────────────┘
```

## ADRs (Architecture Decision Records)

### ADR-001: Next.js como Framework
**Data:** 2025-09
**Contexto:** Precisava de SSR, API routes integradas e deploy simples na Vercel.
**Decisão:** Next.js 15 com React 19 e Pages Router.
**Consequências:** API routes no mesmo deploy simplifica infraestrutura. Limitação com módulos server-side no webpack (pg, sqlite3 precisam de externals).

### ADR-002: Migração SQLite → PostgreSQL
**Data:** 2025-09
**Contexto:** SQLite incompatível com Vercel serverless (filesystem read-only).
**Decisão:** PostgreSQL (Neon) como banco primário, SQLite mantido como fallback para desenvolvimento local.
**Consequências:** Abstração dual em `shared/database/db.js`. Diferenças de dialeto SQL exigem atenção (ex: `gen_random_bytes` vs `hex(randomblob)`). Connection pooling necessário em produção.

### ADR-003: Material-UI v7 como Design System
**Data:** 2025-09
**Contexto:** Necessidade de UI consistente e produtiva com componentes prontos.
**Decisão:** MUI v7 com Emotion para CSS-in-JS.
**Consequências:** Bundle size maior (~200KB), mas alta produtividade. Theme centralizado em `theme.js`. Componentes consistentes sem CSS manual.

### ADR-004: Google Gemini como IA Primária
**Data:** 2025-10
**Contexto:** Classificação de atividades precisa de LLM para casos ambíguos.
**Decisão:** Gemini API substituiu OpenAI como provider principal.
**Consequências:** Custo menor que GPT-4, qualidade adequada para classificação. Dependência do Google. OpenAI mantido como alternativa opcional.

### ADR-005: NextAuth.js para Autenticação
**Data:** 2025-09
**Contexto:** Auth simples necessária, sem requisito de OAuth social inicial.
**Decisão:** NextAuth com Credentials provider e JWT (30 dias).
**Consequências:** Implementação rápida. JWT via cookies httpOnly. Sem OAuth social (pode ser adicionado depois). AuthContext wraps useSession para conveniência.

### ADR-006: Classificação em 2 Camadas
**Data:** 2025-09
**Contexto:** IA sozinha é lenta e cara para cada classificação.
**Decisão:** Camada 1 (regras heurísticas) processa primeiro. Camada 2 (Gemini) apenas para scores entre 40-70 (zona neutra).
**Consequências:** Respostas rápidas para casos claros (< 50ms). IA só chamada em ~30% dos casos. Custo reduzido significativamente.

### ADR-007: Monorepo com Microserviço
**Data:** 2025-09
**Contexto:** Separar lógica de classificação IA do frontend.
**Decisão:** Signal Processor como Express standalone (porta 4000). Accountability Engine planejado (porta 5000) mas nunca implementado.
**Consequências:** Frontend faz proxy para Signal Processor via API routes ou chamada direta. Deploy separado necessário para o microserviço. Accountability Engine abandonado — funcionalidades de coaching integradas diretamente no frontend.

### ADR-008: Redesign Apple-Inspired Light Theme
**Data:** 2026-01
**Contexto:** UI anterior era escura com gradientes, causava fadiga visual.
**Decisão:** Paleta minimalista red/black/white inspirada na Apple. Tipografia clean.
**Consequências:** UI mais profissional e focada. Consistência com 3 cores base. Signal (#34C759 verde) e Noise (#FF3B30 vermelho) como acentos semânticos.
