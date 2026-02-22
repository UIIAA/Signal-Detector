# Signal Detector

Sistema de produtividade que classifica atividades como **SINAL** (produtivo) ou **RUÍDO** (distração) usando IA + regras heurísticas.

## Stack

- **Frontend**: Next.js 15 + React 19 + Material-UI 7 (Emotion)
- **Backend**: Next.js API Routes + Express microservice (Signal Processor, porta 4000)
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
├── services/
│   └── signal-processor/ # Express (porta 4000) - classificação IA
└── shared/
    └── database/       # Abstração dual DB (PostgreSQL/SQLite)
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

## Regras

1. **Database**: Sempre via `query()` de `shared/database/db.js`. Nunca acesso direto
2. **Validação**: Zod para inputs, DOMPurify para sanitização
3. **API responses**: Usar `src/lib/apiResponse.js` (padrão success/error)
4. **Rate limiting**: Obrigatório em todos os endpoints
5. **Segurança**: CSP headers em next.config.js, nunca commitar `.env`
6. **Build**: Deve passar (`npm run build`) antes de commit
7. **Specs**: Ver `docs/SPEC.md` para escopo e módulos
8. **Decisões**: Ver `docs/ARCHITECTURE.md` para ADRs
9. **Changelog**: Atualizar `docs/CHANGELOG.md` ao completar features
