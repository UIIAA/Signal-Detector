# Vercel Deployment Guide - Signal vs Noise Detector

## Problemas Identificados e Soluções

### 1. ✅ Bug Corrigido no app.js
- **Problema**: Linha 62 do `accountability-engine/src/app.js` tinha `console.error(err.message)` mas deveria ser `console.error(error.message)`
- **Status**: Corrigido

### 2. ✅ Configuração PostgreSQL
- **Problema**: Schema PostgreSQL desatualizado e falta de inicialização automática
- **Solução**: Criado schema completo em `shared/database/schema.postgres.complete.sql`
- **Status**: Implementado com auto-inicialização

### 3. 🔄 Variáveis de Ambiente Necessárias

Configure estas variáveis no Vercel Dashboard:

```env
# Obrigatórias
POSTGRES_URL=your_postgres_connection_string_here
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production

# Recomendadas para debug
VERCEL_ENV=production
```

### 4. ✅ Configuração do Banco de Dados
- **Solução**: Adicionada inicialização automática do schema PostgreSQL
- **Features**: SSL habilitado para produção, fallback para SQLite em desenvolvimento

### 5. 🔧 Possíveis Causas do Erro 401

#### A. Banco de Dados Vazio
Se o erro 401 estiver acontecendo porque não há dados:
- O schema agora inclui dados de exemplo
- Usuário padrão é criado automaticamente (`default-user`)

#### B. Variáveis de Ambiente
Certifique-se que `POSTGRES_URL` está configurada corretamente no Vercel.

#### C. SSL da Conexão PostgreSQL
Configuração SSL adicionada para conexões em produção.

## Como Testar Localmente Antes do Deploy

1. **Instalar dependências**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configurar .env local** (apenas para teste local):
   ```bash
   cp .env.example .env
   # Editar .env com sua GEMINI_API_KEY
   ```

3. **Rodar em modo desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Testar a rota problemática**:
   ```bash
   curl http://localhost:3000/goals
   ```

## Deploy na Vercel

1. **Verificar vercel.json**:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "frontend/package.json",
         "use": "@vercel/next",
         "config": { "distDir": ".next" }
       }
     ],
     "routes": [
       { "src": "/(.*)", "dest": "/frontend/$1" }
     ]
   }
   ```

2. **Configurar PostgreSQL na Vercel**:
   - Ir para Vercel Dashboard > Settings > Environment Variables
   - Adicionar `POSTGRES_URL` com string de conexão PostgreSQL
   - Adicionar `GEMINI_API_KEY`

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## Debugging do Erro 401

Se ainda estiver recebendo 401:

1. **Verificar logs da Vercel**:
   - Vercel Dashboard > Functions > View Function Logs

2. **Testar endpoint específico**:
   ```bash
   curl -X GET https://your-app.vercel.app/api/goals/default-user
   ```

3. **Verificar se o banco foi inicializado**:
   - Logs devem mostrar "PostgreSQL database initialized with complete schema"

## Estrutura de Arquivos Corrigida

```
signal-detector/
├── vercel.json                    # ✅ Configuração Vercel
├── frontend/
│   ├── package.json              # ✅ Dependencies OK
│   ├── pages/api/goals/
│   │   ├── index.js             # ✅ CRUD de goals
│   │   └── [userId].js          # ✅ GET goals by user
│   └── src/services/
│       └── goalsApi.js          # ✅ Client API
└── shared/database/
    ├── db.js                    # ✅ Conexão com auto-init
    └── schema.postgres.complete.sql # ✅ Schema completo
```

## Checklist Pós-Deploy

- [ ] Verificar se variáveis de ambiente estão configuradas
- [ ] Testar rota `/api/goals/default-user`
- [ ] Verificar logs de inicialização do banco
- [ ] Testar interface em `https://your-app.vercel.app/goals`
- [ ] Confirmar que não há erros 401

## Próximos Passos

1. **Monitoramento**: Configurar alertas para erros 500/401
2. **Performance**: Adicionar cache para queries frequentes
3. **Segurança**: Implementar autenticação real (substituir default-user)
4. **Backup**: Configurar backup automático do PostgreSQL

---

**Status**: Pronto para deploy ✅
**Última atualização**: 2025-09-27