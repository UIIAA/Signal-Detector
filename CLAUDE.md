# Signal Detector

Sistema de produtividade que classifica atividades como **SINAL** (produtivo) ou **RUÍDO** (distração) usando IA + regras heurísticas.

## Stack

- **Frontend**: Next.js 15 + React 19 + Material-UI 7 (Emotion)
- **Backend**: Next.js API Routes (tudo no mesmo deploy)
- **Database**: PostgreSQL (Neon) produção / SQLite fallback dev
- **IA**: Google Gemini (primário)
- **Auth**: NextAuth.js (JWT, Credentials provider)
- **Deploy**: Vercel
- **Charts**: Recharts

## Estrutura

```
signal-detector/
├── frontend/           # Next.js app (porta 3000)
│   ├── pages/          # Páginas e API routes
│   │   └── api/        # 20+ endpoints
│   ├── src/
│   │   ├── components/ # 14+ componentes React
│   │   ├── contexts/   # AuthContext
│   │   ├── hooks/      # useApi, useAudioRecorder
│   │   ├── services/   # SignalClassifier, KanbanService, GoalService
│   │   └── lib/        # db.js, auth.js, validation.js, apiResponse.js
│   ├── theme.js        # MUI theme (red/black/white)
│   └── next.config.js  # CSP headers, webpack config
├── shared/
│   └── database/       # Abstração dual DB (PostgreSQL/SQLite)
└── docs/
    ├── SPEC.md          # Escopo, módulos, regras de negócio
    ├── ARCHITECTURE.md  # ADRs (Architecture Decision Records)
    ├── CHANGELOG.md     # Versionamento semântico
    └── features/        # Feature specs (obrigatório antes de implementar)
```

## Comandos

```bash
cd signal-detector/frontend
npm install          # Dependências
npm run dev          # Dev server (porta 3000)
npm run build        # Build produção
npm test             # Jest tests
```

## Convenções

- **Componentes**: PascalCase (`LeverageMatrix`)
- **Funções**: camelCase (`classifyActivity`)
- **APIs**: kebab-case (`/api/analyze-goals`)
- **Tabelas DB**: snake_case (`user_patterns`)
- **Commits**: conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
- **UI/Docs**: Português | **Código**: Inglês

## Theme

Paleta Apple-inspired light:
- Primary: `#FF3B30` (red)
- Secondary: `#1D1D1F` (black)
- Background: `#F5F5F7` (light gray)
- Signal: `#34C759` (green) | Noise: `#FF3B30` (red) | Neutral: `#86868B` (gray)

## Protocolo Spec-First

**Nenhuma implementação começa sem spec aprovada.**

### Fluxo obrigatório
1. Criar `docs/features/feature-NNN.md` com o template abaixo
2. Apresentar spec para aprovação do usuário
3. Só depois de aprovada, iniciar implementação
4. Uma feature por sessão
5. Ao concluir: atualizar status para `Done`, append ao `CHANGELOG.md`

### Template de Feature Spec
```markdown
# Feature: [Nome]
**Status:** Draft | Approved | In Progress | Done
**Prioridade:** P0 | P1 | P2
**Data:** YYYY-MM-DD

## Objetivo
Frase única. O que faz e por quê.

## Comportamento
1. Quando [trigger]
2. Sistema [ação]
3. Resultado [saída esperada]

## Regras de Negócio
- Regra com restrição clara

## Casos Extremos
- Cenário de falha → tratamento esperado

## Critérios de Aceite
- [ ] Critério verificável

## Decisões Técnicas
Escolhas relevantes para implementação.

## Dependências
- Depende de: [features/serviços]
- Bloqueia: [features downstream]
```

## Regras

1. **Spec-First**: Criar feature spec antes de qualquer implementação
2. **Database**: Sempre via `query()` de `shared/database/db.js`. Nunca acesso direto
3. **Validação**: Zod para inputs, DOMPurify para sanitização
4. **API responses**: Usar `src/lib/apiResponse.js` (padrão success/error)
5. **Rate limiting**: Obrigatório em todos os endpoints
6. **Segurança**: CSP headers em next.config.js, nunca commitar `.env`
7. **Build**: Deve passar (`npm run build`) antes de commit
8. **Specs**: Ver `docs/SPEC.md` para escopo e módulos
9. **Decisões**: Ver `docs/ARCHITECTURE.md` para ADRs
10. **Changelog**: Atualizar `docs/CHANGELOG.md` ao completar features
