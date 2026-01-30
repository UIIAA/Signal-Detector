# 🎯 PLANO DE MELHORIA - META: 8/10 EM TUDO

**Projeto:** Signal Detector
**Data:** 29/01/2026
**Executor:** Claude Sonnet (90%) + Opus (revisão)

---

## 📊 SITUAÇÃO ATUAL → META

| Área | Atual | Meta | Gap |
|------|-------|------|-----|
| Arquitetura | 7/10 | 8/10 | +1 |
| Segurança | 5/10 | 8/10 | +3 |
| Performance | 7/10 | 8/10 | +1 |
| Funcionalidades | 8/10 | 8/10 | ✅ |

---

## 🔴 FASE 1: SEGURANÇA (5→8) - CRÍTICO
**Tempo estimado:** 3-4 horas
**Executor:** Sonnet ✅

### 1.1 Credenciais (30 min)
- [ ] Criar `.env.example` sem valores reais
- [ ] Adicionar `.env*` ao `.gitignore`
- [ ] Criar script de validação de env vars
- [ ] Documentar variáveis necessárias

### 1.2 Rate Limiting (1 hora)
```javascript
// Criar middleware: src/middleware/rateLimit.js
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: { error: 'Too many requests' }
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 tentativas de login
  message: { error: 'Too many login attempts' }
});
```

### 1.3 Headers de Segurança (30 min)
```javascript
// next.config.js - adicionar
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' }
    ]
  }]
}
```

### 1.4 Validação de Input (1 hora)
- [ ] Instalar Zod: `npm install zod`
- [ ] Criar schemas de validação para cada API
- [ ] Aplicar sanitização com DOMPurify (já instalado)

### 1.5 CSRF Protection (30 min)
- [ ] Implementar tokens CSRF em formulários
- [ ] Validar origin em mutations

---

## 🟡 FASE 2: ARQUITETURA (7→8)
**Tempo estimado:** 2-3 horas
**Executor:** Sonnet ✅

### 2.1 Consolidar SignalClassifier (30 min)
- [ ] Remover versão duplicada em `services/signal-processor`
- [ ] Manter apenas `frontend/src/services/SignalClassifier.js`
- [ ] Atualizar imports

### 2.2 Criar Service Layer (1 hora)
```
src/services/
├── SignalClassifier.js (existente)
├── KanbanService.js (NOVO)
├── GoalService.js (NOVO)
├── ActivityService.js (NOVO)
└── index.js (exports)
```

### 2.3 Refatorar Dashboard (1 hora)
- [ ] Extrair hooks customizados
- [ ] Separar em sub-componentes
- [ ] Reduzir de 735 para ~300 linhas

### 2.4 Padronizar API Responses (30 min)
```javascript
// src/lib/apiResponse.js
export const success = (data, message) => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString()
});

export const error = (message, code = 500) => ({
  success: false,
  error: { message, code },
  timestamp: new Date().toISOString()
});
```

---

## 🟢 FASE 3: PERFORMANCE (7→8)
**Tempo estimado:** 2 horas
**Executor:** Sonnet ✅

### 3.1 React.memo nos Componentes Pesados (30 min)
```javascript
// Componentes a otimizar:
- LeverageMatrix.js
- KanbanBoard.js
- TimeBlockScheduler.js
- HabitTracker.js
```

### 3.2 Lazy Loading (30 min)
```javascript
// pages/_app.js
import dynamic from 'next/dynamic';

const LeverageMatrix = dynamic(
  () => import('../src/components/LeverageMatrix'),
  { loading: () => <Skeleton />, ssr: false }
);
```

### 3.3 Índices no Banco (30 min)
```sql
-- Adicionar índices faltantes
CREATE INDEX idx_activities_user_date ON activities(user_id, created_at);
CREATE INDEX idx_goals_user_active ON goals(user_id, is_active);
CREATE INDEX idx_habits_user_active ON habits(user_id, is_active);
```

### 3.4 Cache de API (30 min)
```javascript
// Usar SWR para cache client-side
import useSWR from 'swr';

const { data, error } = useSWR('/api/goals', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000 // 1 minuto
});
```

---

## 📋 CHECKLIST DE EXECUÇÃO

### Ordem de Execução (Recomendada)
```
DIA 1 (3h) - SEGURANÇA
├── 1.1 Credenciais
├── 1.2 Rate Limiting
└── 1.3 Headers

DIA 2 (3h) - SEGURANÇA + ARQUITETURA
├── 1.4 Validação Input
├── 1.5 CSRF
├── 2.1 Consolidar SignalClassifier
└── 2.2 Service Layer

DIA 3 (2h) - ARQUITETURA + PERFORMANCE
├── 2.3 Refatorar Dashboard
├── 2.4 Padronizar API
├── 3.1 React.memo
└── 3.2 Lazy Loading

DIA 4 (1h) - PERFORMANCE + TESTES
├── 3.3 Índices DB
├── 3.4 Cache API
└── Testes manuais
```

---

## 🛠️ FERRAMENTAS NECESSÁRIAS

```bash
# Instalar dependências adicionais
npm install zod express-rate-limit swr

# Já instaladas (verificar versões)
# - isomorphic-dompurify
# - @mui/material
# - recharts
```

---

## ✅ CRITÉRIOS DE SUCESSO

### Segurança 8/10
- [ ] Zero credenciais no código
- [ ] Rate limiting em todas as APIs
- [ ] Headers de segurança configurados
- [ ] Validação em 100% dos inputs
- [ ] CSRF em mutations

### Arquitetura 8/10
- [ ] SignalClassifier único
- [ ] Service layer implementado
- [ ] Dashboard < 400 linhas
- [ ] API responses padronizadas

### Performance 8/10
- [ ] React.memo em componentes pesados
- [ ] Lazy loading em páginas
- [ ] Índices de banco otimizados
- [ ] Cache client-side funcionando

---

## 📊 RESULTADO ESPERADO

| Área | Antes | Depois | Ganho |
|------|-------|--------|-------|
| Segurança | 5/10 | 8/10 | +60% |
| Arquitetura | 7/10 | 8/10 | +14% |
| Performance | 7/10 | 8/10 | +14% |
| **MÉDIA** | **6.3** | **8.0** | **+27%** |

---

## 💰 ESTIMATIVA DE TEMPO

| Fase | Horas | Modelo |
|------|-------|--------|
| Segurança | 3-4h | Sonnet |
| Arquitetura | 2-3h | Sonnet |
| Performance | 2h | Sonnet |
| Revisão/Testes | 1h | Opus |
| **TOTAL** | **8-10h** | |

---

*Plano criado em 29/01/2026*
*Pronto para execução com Claude Sonnet*
