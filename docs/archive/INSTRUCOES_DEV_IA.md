# Instruções para Desenvolvimento IA - Signal Detector

## 🎯 Visão Geral
Sistema de produtividade que classifica atividades como SINAL (produtivo) ou RUÍDO (distração) usando IA, com coach PNL integrado.

## 📦 Arquitetura

### Stack Principal
- **Frontend**: Next.js 15.5.4 (React) - PWA em `/signal-detector/frontend`
- **Backend**: 2 microserviços Node.js/Express
  - Signal Processor (porta 4000): `/signal-detector/services/signal-processor`
  - Accountability Engine (porta 5000): `/signal-detector/services/accountability-engine`
- **Database**: PostgreSQL (prod Vercel) / SQLite (dev local)
- **IA**: Google Gemini AI + OpenAI

### Estrutura de Diretórios
```
signal-detector/
├── frontend/                    # Next.js PWA
│   ├── pages/
│   │   ├── api/                # Next.js API Routes
│   │   ├── dashboard.js        # Dashboard principal
│   │   ├── goals.js            # Gestão de objetivos
│   │   ├── habits.js           # Rastreador de hábitos
│   │   └── record.js           # Gravação de voz
│   └── src/
│       └── components/         # Componentes React
├── services/
│   ├── signal-processor/       # Classificação de sinais
│   └── accountability-engine/  # Coach PNL
└── shared/
    └── database/              # Schemas e utilitários DB
        ├── db.js              # Abstração dual DB
        ├── schema.postgres.sql
        └── signal.db          # SQLite local
```

## 🔑 Funcionalidades Core

### 1. Classificação de Sinais
- **Input**: Descrição, duração, energia antes/depois
- **Output**: Score 0-100, classificação (SINAL/RUÍDO/NEUTRO), reasoning
- **Métodos**: Regras hardcoded + IA (fallback)
- **Campos**: `signal_score`, `classification`, `confidence_score`, `reasoning`

### 2. Matriz de Alavancagem
- Eixo X: Esforço (1-10) | Eixo Y: Impacto (1-10)
- Quadrantes: Alta Alavancagem, Projetos Estratégicos, Distrações, Drenos
- Visualização interativa com tooltips

### 3. Coach PNL
- Técnicas: modal_operator_challenge, generalization_challenge, outcome_specification
- Detecta padrões: procrastination, perfectionism, scattered_focus
- Gera perguntas personalizadas baseadas em padrões

### 4. Voice-to-Text
- Gravação de áudio → Transcrição (Gemini) → Atividade
- API: `/api/transcribe`

## 🗄️ Schema Database (PostgreSQL)

### Tabelas Principais
```sql
users (id, email, name)
goals (id, user_id, title, description, target_value, goal_type)
activities (id, user_id, goal_id, description, duration_minutes,
            energy_before, energy_after, signal_score, classification,
            confidence_score, reasoning, impact, effort)
coaching_sessions (id, user_id, nlp_technique, coaching_question,
                   user_response, insights_generated)
user_patterns (id, user_id, pattern_type, confidence_score)
```

## 🚀 Setup & Comandos

### Instalação
```bash
# Frontend
cd signal-detector/frontend
npm install

# Signal Processor
cd ../services/signal-processor
npm install

# Accountability Engine
cd ../services/accountability-engine
npm install
```

### Desenvolvimento
```bash
# Terminal 1 - Frontend (porta 3000)
cd signal-detector/frontend
npm run dev

# Terminal 2 - Signal Processor (porta 4000)
cd signal-detector/services/signal-processor
npm start

# Terminal 3 - Accountability Engine (porta 5000)
cd signal-detector/services/accountability-engine
npm start
```

### Testes
```bash
cd signal-detector/frontend
npm test                    # Todos os testes
npm run test:watch         # Modo watch
npm run test:api           # Apenas APIs
```

### Build
```bash
cd signal-detector/frontend
npm run build
npm start  # Produção
```

## ⚙️ Variáveis de Ambiente

### Frontend (.env.local)
```env
POSTGRES_URL=postgresql://...              # Prod: Vercel Postgres
GOOGLE_GENERATIVE_AI_API_KEY=...          # Gemini API
NEXTAUTH_SECRET=...                        # Auth
NEXTAUTH_URL=http://localhost:3000        # Dev
```

### Services
```env
OPENAI_API_KEY=...                        # OpenAI para IA
POSTGRES_URL=...                          # Mesmo do frontend
```

## 🔧 Issues Conhecidos & Fixes

### ❌ Build Error: Module not found 'http-proxy-middleware'
**Causa**: Dependência ausente no package.json
**Fix**:
```bash
cd signal-detector/frontend
npm install http-proxy-middleware --save-dev
```

### ❌ Webpack errors: 'pg' e 'sqlite3'
**Causa**: Drivers nativos não funcionam no webpack do Next.js
**Status**: JÁ CORRIGIDO no next.config.js (commit c9dad79)
**Verificar**: `next.config.js` deve ter `webpack.externals` ou usar apenas `pg` em produção

### 🔄 Database Dual (PostgreSQL + SQLite)
- **Produção (Vercel)**: Sempre PostgreSQL via `POSTGRES_URL`
- **Dev Local**: SQLite em `shared/database/signal.db`
- **Abstração**: `shared/database/db.js` gerencia ambos
- **Migrations**: Executar via Vercel Console (Storage → Query)

## 🛠️ Padrões de Código

### API Routes Pattern
```javascript
// pages/api/exemplo.js
import { query } from '../../../shared/database/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { rows } = await query('SELECT * FROM tabela WHERE id = $1', [id]);
    return res.json(rows);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
```

### Componentes React
- Material-UI v7 (`@mui/material`)
- Hooks: `useAuth` (AuthContext), `useState`, `useEffect`
- Charts: Recharts
- Estado global: Context API (AuthContext)

### Classificação de Sinais
```javascript
// Lógica em services/signal-processor/src/services/SignalClassifier.js
// Chamada via proxy ou API interna
const response = await fetch('/api/classify', {
  method: 'POST',
  body: JSON.stringify({ description, duration, energyBefore, energyAfter })
});
```

## 📊 Fluxos Principais

### 1. Adicionar Atividade
```
Input Manual/Voice → Classificação (regras + IA) → Salvar DB →
Atualizar Dashboard → Gerar insights
```

### 2. Voice Recording
```
Gravar áudio → Upload → Gemini Transcribe → Extrair dados →
Classificar → Salvar atividade
```

### 3. Coaching Session
```
Detectar padrões (user_patterns) → Selecionar técnica PNL →
Gerar pergunta → Registrar resposta → Extrair insights
```

## 🎨 Componentes Principais

### Frontend
- `LeverageMatrix.js`: Visualização impacto vs. esforço
- `HabitTracker.js`: Check-in diário de hábitos
- `CriticalPathWizard.js`: Assistente de caminho crítico
- `ProgressTracker.js`: Acompanhamento de metas
- `Header.js`: Navegação + auth

### Services
- `SignalClassifier.js`: Classificação SINAL/RUÍDO
- `GenerativeAI.js`: Integração Gemini
- `PNLCoach.js`: Engine de coaching (planejado)

## 📝 Convenções

### Git Commits
```
feat: Nova funcionalidade
fix: Correção de bug
refactor: Refatoração
docs: Documentação
test: Testes
```

### Nomenclatura
- Componentes: PascalCase (`LeverageMatrix`)
- Funções: camelCase (`classifyActivity`)
- APIs: kebab-case (`/api/analyze-goals`)
- DB Tables: snake_case (`user_patterns`)

## 🚨 Alertas para IA

1. **NUNCA** commitar `.env` files
2. **SEMPRE** usar `query()` de `db.js`, nunca acesso direto ao DB
3. **VALIDAR** inputs com Joi/Zod antes de processar
4. **SANITIZAR** outputs de IA antes de exibir (XSS)
5. **TESTAR** tanto PostgreSQL quanto SQLite localmente
6. **VERIFICAR** `POSTGRES_URL` antes de deploy
7. **NÃO** usar `sqlite3` ou `pg` diretamente no frontend
8. Build **DEVE** passar antes de commit (`npm run build`)

## 🎯 Próximos Passos Planejados

1. Implementar PNLCoach completo
2. Fine-tuning de classificação com dados reais
3. Notificações PWA para coaching
4. Analytics preditivos (machine learning)
5. Integração com calendários (Google Calendar)

## 📚 Recursos

- **Next.js Docs**: https://nextjs.org/docs
- **Material-UI**: https://mui.com/material-ui/getting-started/
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Gemini API**: https://ai.google.dev/docs

---

**Versão**: 3.0 | **Última atualização**: 2025-10-21 | **Status Build**: ⚠️ Requer http-proxy-middleware
