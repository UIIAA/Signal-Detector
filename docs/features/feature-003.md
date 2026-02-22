# Feature: Upgrade Next.js 15 → 16
**Status:** Draft
**Prioridade:** P1
**Data:** 2026-02-21

## Objetivo
Atualizar o Next.js de 15.x para 16.x, migrando configurações e dependências incompatíveis.

## Situação Atual
- Next.js 15.5.12 instalado
- next.config.js usa configuração `webpack` customizada (externals para pg/sqlite3)
- Next.js 16 usa **Turbopack** por padrão (webpack é deprecated)
- next-auth v4.24.11 — **incompatível com Next.js 16** (precisa v5)
- Campo `env` no next.config.js deprecated no Next 16
- _app.js tem cleanup de JSS (desnecessário com MUI v7)
- Pages Router em uso (continua suportado no 16)

## Comportamento
1. Atualizar Next.js, next-auth e dependências
2. Migrar configuração webpack → turbopack no next.config.js
3. Migrar next-auth v4 → v5
4. Remover campo `env` deprecated, usar .env.local
5. Build passa, todas as páginas e API routes funcionam

## Tarefas

### Fase 1: Preparação
- [ ] Backup do estado atual (branch/tag)
- [ ] Criar .env.local com NEXT_PUBLIC_API_URL

### Fase 2: Configuração
- [ ] Migrar next.config.js:
  - Substituir bloco `webpack` por `turbopack: {}` (tentar vazio primeiro)
  - Se pg/sqlite3 precisarem de config especial, usar `turbopack.resolveAlias`
  - Remover campo `env` (usar .env.local)
  - Manter `headers()` e `rewrites()` (compatíveis)
- [ ] Atualizar package.json:
  - `next` → 16.x
  - `next-auth` → 5.x (**breaking change**)
  - `react` e `react-dom` → verificar versão compatível

### Fase 3: Migração next-auth v4 → v5
- [ ] Atualizar `pages/api/auth/[...nextauth].js` para nova API
- [ ] Testar fluxo de autenticação completo (login, register, session, logout)
- [ ] Verificar AuthContext (useSession, signIn, signOut continuam funcionando)
- [ ] Testar Credentials provider flow

### Fase 4: Limpeza
- [ ] Remover cleanup de JSS em `pages/_app.js` (MUI v7 não usa JSS server-side)

### Fase 5: Testes
- [ ] Testar todas as 7 páginas (/, /login, /dashboard, /goals, /habits, /kanban, /critical-path)
- [ ] Testar API routes críticas (/api/auth/*, /api/classify, /api/goals/*, /api/kanban/*)
- [ ] Testar em Vercel (deploy preview)

## Regras de Negócio
- Manter Pages Router (não migrar para App Router)
- Externals de pg/sqlite3 devem continuar funcionando no server
- Security headers devem permanecer configurados
- Build deve funcionar local e na Vercel

## Casos Extremos
- next-auth v5 pode ter API diferente para Credentials provider → testar extensivamente
- Turbopack pode não suportar externals da mesma forma → usar flag `--webpack` como fallback
- MUI v7 + Next 16: verificar se Emotion SSR funciona corretamente

## Riscos
- **Alto**: next-auth v4 → v5 é a mudança mais arriscada (breaking changes no adapter, callbacks, session handling)
- **Médio**: Turbopack com pg/sqlite3 externals pode precisar de abordagem diferente
- **Baixo**: Páginas e API routes padrão devem funcionar sem alteração

## Critérios de Aceite
- [ ] Next.js 16.x instalado e funcionando
- [ ] next-auth v5 configurado e autenticação funcional
- [ ] Build passa com Turbopack (ou --webpack como fallback documentado)
- [ ] Todas as 7 páginas carregam corretamente
- [ ] Todas as API routes respondem
- [ ] Deploy na Vercel funciona
- [ ] Security headers mantidos
- [ ] Nenhuma regressão visual ou funcional

## Decisões Técnicas
- Tentar `turbopack: {}` (config vazia) primeiro
- Se Turbopack não funcionar com nosso setup, usar flag `--webpack` e documentar no ARCHITECTURE.md
- Não migrar para App Router nesta iteração (complexidade desproporcional)
- Manter Credentials provider (não migrar para OAuth nesta iteração)

## Dependências
- Depende de: Feature 001 (deploy baseline), Feature 002 (dashboard refatorado)
- Bloqueia: nenhuma
