# Guia de Segurança - Signal vs Noise Detector

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Vulnerabilidades Testadas](#vulnerabilidades-testadas)
3. [Implementações de Segurança](#implementações-de-segurança)
4. [Recomendações Críticas](#recomendações-críticas)
5. [Checklist de Segurança](#checklist-de-segurança)
6. [Relatório de Vulnerabilidades](#relatório-de-vulnerabilidades)

---

## Visão Geral

Este documento descreve as práticas de segurança implementadas e testadas no Signal vs Noise Detector v2.0.

**Status Atual:** ⚠️ Em Validação
**Última Atualização:** 2025-09-30
**Responsável:** Time de Desenvolvimento

---

## Vulnerabilidades Testadas

### ✅ 1. SQL Injection
**Risco:** Crítico
**Status:** Protegido

#### Testes Implementados:
- [x] Injection via query params
- [x] Injection via request body
- [x] UNION-based attacks
- [x] Time-based blind injection
- [x] Error-based injection

#### Proteção:
```javascript
// ✅ CORRETO: Prepared Statements
const { rows } = await query(
  'SELECT * FROM activities WHERE user_id = $1 AND created_at >= $2',
  [userId, startDate]
);

// ❌ ERRADO: String concatenation
const sql = `SELECT * FROM activities WHERE user_id = '${userId}'`; // NUNCA!
```

**Cobertura:** 100%

---

### ✅ 2. XSS (Cross-Site Scripting)
**Risco:** Alto
**Status:** Parcialmente Protegido

#### Testes Implementados:
- [x] Script tags em inputs
- [x] Event handlers (onerror, onload)
- [x] JavaScript URLs
- [x] SVG/iframe injection

#### Proteção Atual:
- React escapa automaticamente strings em JSX
- JSON.stringify usado nas APIs

#### ⚠️ Recomendações:
```bash
npm install dompurify isomorphic-dompurify
```

```javascript
import DOMPurify from 'isomorphic-dompurify';

// Sanitizar user input antes de salvar
const cleanDescription = DOMPurify.sanitize(req.body.description);
```

**Cobertura:** 70% (falta sanitização server-side)

---

### ✅ 3. Autenticação e Autorização
**Risco:** Crítico
**Status:** Implementado Básico

#### Testes Implementados:
- [x] Requisições sem userId
- [x] Formato de userId inválido
- [x] Acesso a dados de outros usuários
- [x] Operações sem autorização

#### Proteção Atual:
```javascript
// Todas as APIs validam userId
if (!userId) {
  return res.status(400).json({ error: 'userId is required' });
}

// Queries filtram por user_id
WHERE user_id = $1
```

#### ⚠️ Melhorias Necessárias:
1. **Implementar JWT/Session Management**
   ```bash
   npm install next-auth jsonwebtoken
   ```

2. **Middleware de Autenticação**
   ```javascript
   // middleware/auth.js
   export function withAuth(handler) {
     return async (req, res) => {
       const token = req.headers.authorization?.split(' ')[1];
       if (!token) {
         return res.status(401).json({ error: 'Unauthorized' });
       }
       // Verificar token
       req.user = verifyToken(token);
       return handler(req, res);
     };
   }
   ```

**Cobertura:** 60% (falta JWT/sessions)

---

### ✅ 4. Input Validation
**Risco:** Médio
**Status:** Parcialmente Implementado

#### Testes Implementados:
- [x] Tipos de dados numéricos
- [x] Ranges de valores (1-10)
- [x] Formato de datas
- [x] Tamanho de strings (DoS)
- [x] Validação de enums

#### Proteção Atual:
```javascript
// Validação manual em cada endpoint
if (impact < 1 || impact > 10) {
  return res.status(400).json({ error: 'Impact must be between 1 and 10' });
}
```

#### ⚠️ Recomendações:
```bash
npm install joi zod
```

```javascript
import { z } from 'zod';

const ActivitySchema = z.object({
  userId: z.string().min(1),
  description: z.string().max(500),
  impact: z.number().min(1).max(10),
  effort: z.number().min(1).max(10),
  duration_minutes: z.number().positive()
});

// Validar
const validated = ActivitySchema.parse(req.body);
```

**Cobertura:** 50% (validação inconsistente)

---

### ✅ 5. Business Logic Security
**Risco:** Médio
**Status:** Implementado

#### Testes Implementados:
- [x] Blocos no passado distante
- [x] Lógica de horários (end > start)
- [x] Overflow em cálculos
- [x] Conflict detection

#### Proteção:
```javascript
// Validação de endTime > startTime
if (endTime <= startTime) {
  return res.status(400).json({ error: 'endTime must be after startTime' });
}

// Detecção de conflitos
const conflicts = await detectConflicts(userId, date, startTime, endTime);
if (conflicts.length > 0) {
  return res.status(409).json({ error: 'Schedule conflict', conflicts });
}
```

**Cobertura:** 80%

---

### ✅ 6. Error Handling Security
**Risco:** Baixo
**Status:** Implementado Básico

#### Testes Implementados:
- [x] Informações sensíveis em erros
- [x] Erros genéricos para usuários

#### ⚠️ Problemas Encontrados:
```javascript
// ❌ ERRADO: Vaza detalhes internos
catch (error) {
  res.status(500).json({ error: error.message }); // Pode conter detalhes do DB
}

// ✅ CORRETO: Erro genérico
catch (error) {
  console.error('Internal error:', error); // Log interno
  res.status(500).json({ error: 'Internal server error' }); // Resposta genérica
}
```

#### Recomendação:
```javascript
// error-handler.js
export function handleError(error, res) {
  console.error('[ERROR]', error.stack);

  if (error.code === '23505') { // Unique violation
    return res.status(409).json({ error: 'Resource already exists' });
  }

  if (error.code === '23503') { // FK violation
    return res.status(400).json({ error: 'Invalid reference' });
  }

  // Erro genérico
  return res.status(500).json({ error: 'Internal server error' });
}
```

**Cobertura:** 60%

---

### ⚠️ 7. Rate Limiting
**Risco:** Médio
**Status:** NÃO IMPLEMENTADO

#### Testes Implementados:
- [x] Detecção de requisições repetidas

#### ❌ Problema:
Não há rate limiting implementado. Vulnerável a:
- Brute force attacks
- DoS (Denial of Service)
- API abuse

#### Recomendação CRÍTICA:
```bash
npm install express-rate-limit
```

```javascript
// middleware/rate-limit.js
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requisições
  message: 'Too many requests, please try again later'
});

// Aplicar em APIs
export default apiLimiter(async function handler(req, res) {
  // ...
});
```

**Cobertura:** 0% ❌

---

### ✅ 8. Data Integrity
**Risco:** Médio
**Status:** Protegido

#### Testes Implementados:
- [x] JSONB malformado
- [x] Integridade referencial (FK)

#### Proteção:
- Foreign Keys no banco
- Constraints CHECK
- Generated columns

```sql
-- Constraints existentes
CHECK (impact >= 1 AND impact <= 10)
CHECK (effort >= 1 AND effort <= 10)
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

**Cobertura:** 90%

---

## Implementações de Segurança

### Banco de Dados

#### ✅ Implementado:
- [x] Foreign Keys com CASCADE
- [x] CHECK constraints
- [x] NOT NULL onde apropriado
- [x] Prepared statements (via pg library)

#### ⚠️ Falta Implementar:
- [ ] Row-Level Security (RLS)
- [ ] Audit logs
- [ ] Encryption at rest

```sql
-- Exemplo de RLS (PostgreSQL)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY activities_user_isolation ON activities
  FOR ALL
  USING (user_id = current_setting('app.user_id'));
```

---

### APIs

#### ✅ Implementado:
- [x] Validação de userId em todos os endpoints
- [x] Filtragem por user_id em queries
- [x] Status codes apropriados (400, 401, 404, 500)
- [x] Conflict detection (409)

#### ⚠️ Falta Implementar:
- [ ] JWT/Session management
- [ ] Rate limiting
- [ ] CORS policies
- [ ] Input sanitization (DOMPurify)
- [ ] Schema validation (Zod/Joi)
- [ ] Request logging
- [ ] API versioning

---

### Frontend

#### ✅ Implementado:
- [x] React auto-escape (XSS básico)
- [x] HTTPS (via Vercel)

#### ⚠️ Falta Implementar:
- [ ] CSP (Content Security Policy)
- [ ] Subresource Integrity (SRI)
- [ ] CSRF tokens
- [ ] HTTPOnly cookies

---

## Recomendações Críticas

### 🔴 URGENTE (Implementar ANTES de produção)

1. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```
   **Risco:** DoS, brute force
   **Prioridade:** P0

2. **JWT/Session Management**
   ```bash
   npm install next-auth
   ```
   **Risco:** Autenticação fraca
   **Prioridade:** P0

3. **Input Validation (Zod)**
   ```bash
   npm install zod
   ```
   **Risco:** Injection, data corruption
   **Prioridade:** P0

4. **Sanitização de HTML (DOMPurify)**
   ```bash
   npm install isomorphic-dompurify
   ```
   **Risco:** XSS
   **Prioridade:** P1

---

### 🟡 IMPORTANTE (Implementar em 30 dias)

5. **Request Logging**
   ```bash
   npm install pino pino-http
   ```

6. **Error Handler Centralizado**
   Criar `lib/error-handler.js`

7. **CORS Policies**
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', 'https://yourdomain.com');
   ```

8. **CSP Headers**
   ```javascript
   res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");
   ```

---

### 🟢 MELHORIAS (Implementar em 90 dias)

9. **Row-Level Security (RLS)**
10. **Audit Logs**
11. **Encryption at Rest**
12. **Security Headers (Helmet.js)**
13. **Dependency Scanning (npm audit)**
14. **Penetration Testing**

---

## Checklist de Segurança

### Pré-Deploy

- [ ] Testes de segurança passando (npm test security.test.js)
- [ ] Rate limiting implementado
- [ ] JWT/NextAuth configurado
- [ ] Input validation com Zod
- [ ] DOMPurify em uso
- [ ] Error handler centralizado
- [ ] Secrets não commitados (.env)
- [ ] HTTPS configurado
- [ ] CORS policies definidas
- [ ] npm audit sem vulnerabilidades críticas

### Pós-Deploy

- [ ] Monitoring de segurança ativo
- [ ] Logs sendo coletados
- [ ] Backups automáticos
- [ ] Incident response plan documentado
- [ ] Testes de penetração realizados

---

## Relatório de Vulnerabilidades

### Como Reportar

Se você encontrar uma vulnerabilidade:

1. **NÃO** crie uma issue pública no GitHub
2. Envie email para: **security@signalruido.com**
3. Inclua:
   - Descrição da vulnerabilidade
   - Steps to reproduce
   - Impacto potencial
   - Sugestão de fix (opcional)

### Vulnerabilidades Conhecidas

#### VUL-001: Rate Limiting Ausente
**Severidade:** Alta
**Status:** ⚠️ Em Progresso
**Descrição:** APIs não têm rate limiting, vulnerável a DoS
**Mitigação:** Implementar express-rate-limit
**ETA:** Sprint 4

#### VUL-002: Autenticação Fraca
**Severidade:** Crítica
**Status:** ⚠️ Em Progresso
**Descrição:** Apenas userId sem token/session
**Mitigação:** Implementar NextAuth
**ETA:** Sprint 4

---

## Comandos Úteis

```bash
# Rodar testes de segurança
npm test -- security.test.js

# Audit de dependências
npm audit

# Fix vulnerabilidades automáticas
npm audit fix

# Audit produção
npm audit --production

# Gerar relatório de segurança
npm audit --json > security-report.json
```

---

## Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Última Revisão:** 2025-09-30
**Próxima Revisão:** 2025-10-15
**Status:** ⚠️ Ação Requerida