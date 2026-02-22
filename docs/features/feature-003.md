# Feature: Upgrade Next.js 15 → 16
**Status:** Draft
**Prioridade:** P1
**Data:** 2026-02-21

## Objetivo
Atualizar o Next.js de 15.x para 16.x, migrando a configuração webpack para Turbopack (novo padrão do Next 16).

## Situação Atual
- Next.js 15.5.4 instalado (latest 15.x)
- next.config.js usa configuração `webpack` customizada:
  - Externals para `pg` e `sqlite3`
  - Fallbacks para `fs`, `net`, `tls` no client
- Next.js 16 usa **Turbopack** por padrão
- Build falha com erro: "This build is using Turbopack, with a `webpack` config and no `turbopack` config"
- Pages Router em uso (não App Router)

## Comportamento
1. Atualizar dependência Next.js para 16.x
2. Migrar configuração webpack → turbopack no next.config.js
3. Build passa com Turbopack
4. Todas as páginas funcionam corretamente
5. API routes continuam funcionando

## Tarefas

### 1. Migrar next.config.js
```javascript
// ANTES (webpack)
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = { fs: false, net: false, tls: false };
  }
  config.externals = [
    ...,
    { 'pg': 'commonjs pg', 'sqlite3': 'commonjs sqlite3' }
  ];
  return config;
}

// DEPOIS (turbopack)
turbopack: {
  resolveAlias: {
    // Handle server-only modules in client builds
  }
}
// ou simplesmente: turbopack: {} (se funcionar sem config)
```

### 2. Atualizar dependências relacionadas
- `next` → 16.x
- `react` e `react-dom` → verificar compatibilidade
- `next-auth` → verificar compatibilidade com Next 16

### 3. Testar todas as páginas
- / (home/landing)
- /login
- /dashboard
- /goals
- /habits
- /kanban
- /critical-path

### 4. Testar API routes
- /api/auth/[...nextauth]
- /api/classify
- /api/goals/*
- /api/kanban/*
- /api/habits/*

## Regras de Negócio
- Manter Pages Router (não migrar para App Router nesta iteração)
- Externals de pg/sqlite3 devem continuar funcionando
- Security headers devem permanecer configurados
- Build deve funcionar tanto local quanto na Vercel

## Casos Extremos
- Turbopack pode não suportar todos os plugins webpack → verificar docs
- `pg` e `sqlite3` como externals podem precisar de abordagem diferente
- `http-proxy-middleware` já foi removido (não é mais problema)
- React 19 pode ter incompatibilidades com Next 16 → verificar matrix de compatibilidade

## Critérios de Aceite
- [ ] Next.js 16.x instalado
- [ ] Build passa com Turbopack (sem flag --webpack)
- [ ] Todas as 7 páginas carregam corretamente
- [ ] Todas as API routes respondem
- [ ] Deploy na Vercel funciona
- [ ] Security headers mantidos
- [ ] Nenhuma regressão visual

## Decisões Técnicas
- Tentar `turbopack: {}` (config vazia) primeiro — muitas apps funcionam sem config
- Se pg/sqlite3 precisarem de config especial, usar `turbopack.resolveAlias`
- Manter flag `--webpack` como fallback se Turbopack não funcionar com nosso setup

## Dependências
- Depende de: Feature 001 (deploy baseline), Feature 002 (dashboard refatorado — menos código para testar)
- Bloqueia: nenhuma
