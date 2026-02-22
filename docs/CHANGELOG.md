# Changelog

Todas as mudanças notáveis do projeto Signal Detector.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [3.2.0] - 2026-02-02

### Alterado
- Redesign completo da interface com tema Apple-inspired light
- Paleta simplificada para vermelho, preto e branco
- Fallback para cores hex quando propriedades do tema estão ausentes

### Removido
- Páginas obsoletas e componentes não utilizados

## [3.1.0] - 2026-01-29

### Adicionado
- Kanban Board com classificação IA de tarefas (SINAL/RUÍDO)
- Importação de tarefas via CSV, TXT e XLSX
- Filtros por projeto, prioridade e classificação
- Stats em tempo real no Kanban

### Alterado
- Documentação organizada na pasta docs/

## [3.0.0] - 2025-10-22

### Adicionado
- Service layer completo (KanbanService, GoalService, EfficiencyCalculator)
- Padronização de API responses (apiResponse.js)
- Performance hooks (React.memo, lazy loading)
- Rate limiting em todos os endpoints (100 req/15min, 5 auth/hora)
- Validação de inputs com Zod
- Headers de segurança CSP no next.config.js
- Sanitização com DOMPurify

### Corrigido
- Correções de segurança abrangentes
- SignalClassifier movido para frontend (fix build Vercel)
- Webpack externals para drivers de banco

## [2.0.0] - 2025-10-03

### Adicionado
- Sistema de Alavancagem v2.0 (Matriz impacto vs esforço)
- Coach IA integrado
- Sugestão de objetivos via API
- Matriz de alavancagem no dashboard
- Sistema completo v3.0 com gaps identificados preenchidos

### Corrigido
- Estados de loading no dashboard
- Registro de atividades
- Conexão com banco de dados
- Endpoints de API

## [1.0.0] - 2025-09-22

### Adicionado
- Classificação de atividades como SINAL/RUÍDO/NEUTRO
- Dashboard com analytics
- Gestão de objetivos (curto/médio/longo prazo)
- Migração de SQLite para PostgreSQL (compatibilidade Vercel)
- Signal Processor como microserviço Express
- Autenticação com NextAuth.js (JWT)
- Gravação de voz (estrutura base)
- Schema PostgreSQL completo
- Deploy na Vercel configurado
