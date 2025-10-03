# Signal vs Noise Detector - Sistema de Produtividade de Alta Alavancagem

## 📋 Visão Geral

O **Signal vs Noise Detector** é uma plataforma completa de produtividade que combina **Inteligência Artificial**, **análise de eficiência** e **frameworks de produtividade** para ajudar usuários a focarem em atividades de alto impacto e alcançarem objetivos de forma estratégica.

## 🎯 Missão

Transformar a forma como profissionais gerenciam seu tempo e energia, focando em **alta alavancagem** (Alto Impacto + Baixo Esforço) e eliminando atividades de baixo retorno através de insights baseados em dados e IA.

---

## 🏗️ Arquitetura da Aplicação

### Frontend (Next.js) - Aplicação Monolítica
- **Localização**: `/frontend/`
- **Tecnologia**: Next.js 15.5.3 + Material-UI v7.3.2 + React 19.1.1
- **Porta**: 3000 (desenvolvimento via `npm run dev`)
- **Responsabilidades**:
  - Interface completa do usuário
  - API Routes integradas (Next.js API)
  - Processamento e visualização de dados
  - Integração com IA (Google Gemini 2.0)
  - Componentes reutilizáveis e services

### Banco de Dados
- **Tipo**: PostgreSQL (Neon)
- **Conexão**: Pool com SSL
- **Localização Shared**: `/shared/database/`
- **Migrations**: v1 → v14 (incrementais)

### Schema Principal

#### Tabelas Core
- `users` - Gestão de usuários com autenticação
- `goals` - Objetivos (short/medium/long) com progresso
- `activities` - Atividades registradas com classificação IA
- `activity_goals` - Relacionamento N:N

#### Sprint 1: Eficiência + Rota Crítica
- `efficiency_history` - Histórico de scores de eficiência
- `opportunity_cost_alerts` - Alertas de custo de oportunidade
- Goals com `ideal_path` (JSONB) - Rotas críticas com IA

#### Sprint 2: Templates + Substituição
- `activity_templates` - 112 templates de atividades
- `goal_templates` - 24 templates de objetivos
- `user_template_usage` - Rastreamento de uso
- `smart_substitutions` - Histórico de substituições

#### Sprint 3: Frameworks + Time Blocking
- `time_blocks` - Blocos de tempo agendados
- `schedule_conflicts` - Detecção de conflitos
- `scheduling_preferences` - Preferências do usuário
- `key_results` - Framework OKR
- `habits` + `habit_checkins` - Sistema de hábitos
- `gtd_actions` - Getting Things Done
- `smart_criteria` - Critérios SMART

---

## 🚀 Funcionalidades Implementadas

### ✅ SPRINT 1: Sistema de Eficiência + Rota Crítica

#### 1. Cálculo Automático de Eficiência
- **Fórmula**: `(Impacto × 2) / Tempo em horas`
- **Classificações**:
  - 🟢 Excelente: ≥ 15 pontos
  - 🔵 Boa: 10-15 pontos
  - 🟡 Moderada: 5-10 pontos
  - 🔴 Baixa: < 5 pontos
- **Service**: `EfficiencyCalculator.js`
- **API**: `/api/activities/efficiency`

#### 2. Matriz de Alavancagem
- **Visualização**: Dashboard principal
- **Quadrantes**:
  - Q1: Alto Impacto + Baixo Esforço (PRIORIZAR)
  - Q2: Alto Impacto + Alto Esforço (AGENDAR)
  - Q3: Baixo Impacto + Baixo Esforço (DELEGAR)
  - Q4: Baixo Impacto + Alto Esforço (ELIMINAR)
- **Componente**: `LeverageMatrix.js`

#### 3. Ranking de Eficiência
- Top 10 atividades mais eficientes
- Estatísticas agregadas (média, mediana, distribuição)
- Filtros por período (dia/semana/mês/tudo)
- **Componente**: `EfficiencyRankingCard.js`
- **Localização**: Dashboard

#### 4. Custo de Oportunidade
- Detecção automática de atividades de baixa eficiência
- Cálculo de ganho potencial com alternativas
- Sugestões de atividades Q1 (alta alavancagem)
- **Componente**: `OpportunityCostAlert.js`
- **API**: `/api/recommendations/opportunity-cost`

#### 5. Rota Crítica com IA
- **Wizard em 3 etapas**:
  1. Contexto do usuário
  2. Sugestões da IA (Gemini)
  3. Revisão e confirmação
- Geração de 3-5 atividades de alta alavancagem
- Milestones automáticos
- **Componente**: `CriticalPathWizard.js`
- **API**: `/api/goals/ideal-path` (GET/POST/PUT/DELETE)
- **Localização**: Página `/goals` + `/critical-path`

#### 6. Comparação Progresso vs Ideal
- Gráfico de linha comparativo
- Detecção de desvios (adiantado/atrasado)
- Próximo milestone destacado
- **Componente**: `ProgressComparisonChart.js`

#### 7. Timeline de Rota Crítica
- Visualização tipo Trello/Kanban
- Checkboxes para marcar conclusão
- Cálculo de progresso automático
- **Componente**: `IdealPathTimeline.js`

---

### ✅ SPRINT 2: Substituição Inteligente + Templates

#### 1. Sistema de Templates de Atividades
- **112 templates** em 7 categorias:
  - 🏢 Career (20): Promoções, networking, visibilidade
  - 📚 Learning (20): Cursos, certificações, prática
  - 💪 Health (16): Exercícios, nutrição, sono
  - ❤️ Relationships (14): Família, amigos, parceiro
  - 💰 Finance (14): Investimentos, poupança, dívidas
  - 🧘 Personal Growth (14): Journaling, terapia, mindfulness
  - 💻 Side Project (14): MVP, monetização, marketing

- **Métricas por template**:
  - Impact Estimate (1-10)
  - Effort Estimate (1-10)
  - Duration Estimate (minutos)
  - Leverage Score calculado
  - Use Count (rastreado)
  - Success Rate (%)

- **API**: `/api/activities/templates`

#### 2. Templates de Objetivos
- **24 templates** com:
  - Título e descrição
  - Tipo (short/medium/long)
  - Atividades sugeridas (IDs de activity_templates)
  - **Perguntas reflexivas** para personalização
  - Milestones sugeridos
  - Tempo estimado

- **Categorias**: Career, Learning, Health, Relationships, Finance, Personal Growth, Side Project

- **Componente**: `GoalTemplateSelector.js`
- **API**: `/api/goals/templates`

#### 3. Perguntas Reflexivas
- Wizard guiado step-by-step
- Tipos de pergunta: text, date, number
- Propósito explicado para cada pergunta
- Personalização de templates
- **Componente**: `ReflectiveQuestionsDialog.js`

#### 4. Substituição Inteligente
- Análise automática de atividades planejadas
- Detecção de baixa eficiência (< 10 pontos)
- Busca em templates + histórico do usuário
- Apresentação de 3 alternativas melhores
- Cálculo de improvement potential
- **Componente**: `SmartSubstitutionDialog.js`
- **API**: `/api/recommendations/suggest-alternatives`

#### 5. Rastreamento de Uso
- Tabela `user_template_usage`
- Feedback do usuário (satisfação 1-5)
- Outcome tracking (completed/abandoned/in-progress)
- Customizações aplicadas (JSONB)
- View `template_effectiveness` para análise

---

### ✅ SPRINT 3: Frameworks + Coach IA + Time Blocking

#### 1. Sistema de Blocos de Tempo
- **Time Blocking** visual tipo calendário
- Agendamento semanal
- Tipos de bloco:
  - Focus / Deep Work
  - Meeting
  - Break
  - Learning
  - Admin
  - Personal

- **Features**:
  - Detecção automática de conflitos
  - Suporte a recorrência
  - Status tracking (scheduled/in-progress/completed/missed)
  - Planejado vs Real (duração, impacto, esforço)
  - Energy tracking (antes/depois)

- **Componente**: `TimeBlockScheduler.js`
- **API**: `/api/schedule` (GET/POST/PUT/DELETE)

#### 2. Preferências de Agendamento
- Horários de trabalho personalizados
- Pico de energia (morning person vs night owl)
- Dias de trabalho configuráveis
- Duração preferida de blocos (Pomodoro, etc)
- Proteção de deep work time
- Limite de meetings por dia

#### 3. Coach IA Contextual
- **Análise em tempo real**:
  - Objetivos ativos e progresso
  - Atividades recentes (últimas 10)
  - Blocos agendados próximos
  - Estatísticas de eficiência semanal
  - Hora do dia e energia disponível

- **Recomendação de próxima ação**:
  - Ação específica e acionável
  - Tempo estimado (≤ 90min)
  - Impacto e esforço estimados
  - Reasoning detalhado
  - Nível de urgência
  - Alternativas (se aplicável)

- **Componente**: `NextActionCard.js`
- **API**: `/api/coach/next-action` (POST)
- **IA**: Google Gemini 2.0 Flash Exp

#### 4. Framework OKR (Objectives & Key Results)
- Tabela `key_results`
- Métricas quantificáveis:
  - Target Value
  - Current Value
  - Initial Value
  - Progress % automático

- **Status**: not-started / at-risk / on-track / completed
- **Confidence Level** (1-5)
- Update Frequency configurável

#### 5. Sistema de Hábitos
- Tabela `habits` com:
  - Tipo: build / break / maintain
  - Frequência: daily / weekly / custom
  - Target days per week
  - Preferred time of day

- **Habit Loop**:
  - Cue (gatilho)
  - Reward (recompensa)

- **Tracking**:
  - Current Streak
  - Longest Streak
  - Total Completions
  - Success Rate calculado

- **Check-ins diários** (`habit_checkins`):
  - Completed (boolean)
  - Notes
  - Energy Level (1-5)
  - Difficulty (1-5)

- **Componente**: `HabitTracker.js`
- Grid visual com últimos 7 dias
- Streak com fire emoji 🔥

#### 6. Getting Things Done (GTD)
- Tabela `gtd_actions`
- **Contexts**: @computer, @home, @errands, @phone, etc
- **Lists**:
  - Inbox
  - Next Actions
  - Waiting For
  - Someday/Maybe
  - Projects
  - Reference

- **Energy & Time**:
  - Energy Required (low/medium/high)
  - Time Required (minutos)

- **Defer Until**: não mostrar antes de data específica

#### 7. Critérios SMART
- Tabela `smart_criteria`
- **S - Specific**: Descrição detalhada
- **M - Measurable**: Métrica + método + target
- **A - Achievable**: Recursos e skills necessários
- **R - Relevant**: Por quê + alinhamento
- **T - Time-bound**: Deadline + milestones

---

## 📊 APIs Completas (10 endpoints)

### Eficiência
1. `GET /api/activities/efficiency` - Ranking e estatísticas
2. `POST /api/recommendations/opportunity-cost` - Custo de oportunidade

### Rota Crítica
3. `GET/POST/PUT/DELETE /api/goals/ideal-path` - CRUD de rotas
4. `POST /api/goals/critical-path-suggestions` - Sugestões IA

### Top Performance
5. `GET /api/activities/top-efficient` - Top atividades + padrões

### Templates
6. `GET/POST /api/activities/templates` - Templates de atividades
7. `GET/POST /api/goals/templates` - Templates de objetivos

### Substituição
8. `POST /api/recommendations/suggest-alternatives` - Substituição inteligente

### Time Blocking
9. `GET/POST/PUT/DELETE /api/schedule` - CRUD de blocos

### Coach IA
10. `POST /api/coach/next-action` - Recomendação contextual

---

## 🎨 Componentes React (11 componentes)

### Sprint 1
1. **OpportunityCostAlert** - Dialog de custo de oportunidade
2. **CriticalPathWizard** - Wizard de 3 etapas com IA
3. **ProgressComparisonChart** - Gráfico real vs ideal (Recharts)
4. **EfficiencyRankingCard** - Top 10 eficientes
5. **IdealPathTimeline** - Timeline com checkboxes

### Sprint 2
6. **SmartSubstitutionDialog** - Substituição inteligente
7. **GoalTemplateSelector** - Seletor de templates
8. **ReflectiveQuestionsDialog** - Wizard de perguntas

### Sprint 3
9. **NextActionCard** - Coach IA recomendações
10. **TimeBlockScheduler** - Calendário semanal
11. **HabitTracker** - Grid de hábitos com streaks

---

## 📄 Páginas Principais

### `/` - Home
- Landing page inicial
- Login/Cadastro

### `/dashboard` - Dashboard Principal
- Matriz de Alavancagem (4 quadrantes)
- **EfficiencyRankingCard** (Sprint 1)
- Gráficos de progresso
- Objetivos mais sinalizados
- Atividades recentes

### `/goals` - Gerenciamento de Objetivos
- Lista de objetivos (short/medium/long)
- Assistente IA com Gemini
- **Botão Criar Rota Crítica** (Sprint 1)
- **CriticalPathWizard** integrado
- Framework Manager (OKR/Habits/GTD/SMART)

### `/critical-path` - Rota Crítica (NOVA - Sprint 1)
- Seletor de objetivo
- **ProgressComparisonChart** - Real vs Ideal
- **IdealPathTimeline** - Timeline interativa
- Detecção de desvios
- Botão criar rota com IA

### `/record` - Registro de Atividade
- Gravação de voz
- Transcrição automática
- Classificação IA (Sinal/Ruído)
- Impacto/Esforço estimados

### `/text-entry` - Entrada Manual
- Registro por texto
- Associação a objetivos
- Classificação IA

### `/plan` - Planejamento Semanal
- Visão agregada da semana
- Insights e recomendações

---

## 🔧 Tecnologias e Stack

### Frontend
- **Framework**: Next.js 15.5.3
- **React**: 19.1.1
- **UI**: Material-UI v7.3.2
- **Charts**: Recharts
- **Auth**: Context API + localStorage

### Backend & Database
- **Database**: PostgreSQL (Neon)
- **ORM**: Raw SQL com pg library
- **Connection**: Pool com SSL

### IA & ML
- **Provider**: Google Generative AI
- **Model**: Gemini 2.0 Flash Exp
- **Usos**:
  - Classificação de atividades
  - Sugestão de objetivos
  - Geração de rotas críticas
  - Coach IA contextual
  - Recomendações de templates

---

## 🗄️ Migrations (v1 → v14)

### Core (v1-v9)
- Schema básico
- Usuários e autenticação
- Goals e activities
- Relacionamentos N:N

### Sprint 1
- **v10**: `ideal_path` em goals (JSONB)
- **v11**: `efficiency_history`, `opportunity_cost_alerts`

### Sprint 2
- **v12**: `activity_templates`, `goal_templates`, `user_template_usage`, `smart_substitutions`

### Sprint 3
- **v13**: `time_blocks`, `schedule_conflicts`, `scheduling_preferences`
- **v14**: `key_results`, `habits`, `habit_checkins`, `gtd_actions`, `smart_criteria`

---

## 📈 Dados Populados

### Templates de Atividades
- **112 templates** verificados
- 7 categorias completas
- Leverage score calculado
- Success rate inicial

### Templates de Objetivos
- **24 templates** estruturados
- Com perguntas reflexivas
- Milestones sugeridos
- Atividades recomendadas

---

## 🚀 Como Executar

### Instalação
```bash
cd frontend
npm install
```

### Desenvolvimento
```bash
npm run dev
# Acesse: http://localhost:3000
```

### Variáveis de Ambiente
```bash
# .env.local
POSTGRES_URL=sua_connection_string
GEMINI_API_KEY=sua_api_key
```

### Aplicar Migrations
```bash
psql -h HOST -U USER -d DATABASE -f shared/database/migration_vXX.sql
```

---

## 📊 KPIs e Métricas

### Eficiência
- Score médio de eficiência
- % de atividades Q1 (alta alavancagem)
- Tempo em atividades de baixo retorno

### Progresso
- % de objetivos on-track
- Desvio médio de rotas críticas
- Completion rate de blocos agendados

### Uso de Templates
- Templates mais usados
- Success rate por categoria
- Customizações aplicadas

### Hábitos
- Average streak length
- Success rate geral
- Habits ativos

---

## 🎯 Próximos Passos (Backlog)

### Melhorias Sprint 3
- [ ] Integrar NextActionCard no Dashboard
- [ ] Página dedicada de Hábitos com HabitTracker
- [ ] OKR Tracker visual
- [ ] GTD Dashboard

### Features Futuras
- [ ] Notificações push
- [ ] Sync com Google Calendar
- [ ] App mobile (React Native)
- [ ] Relatórios semanais por email
- [ ] Gamificação (badges, pontos)
- [ ] Social features (compartilhar progresso)

---

## 👥 Usuário de Teste

```javascript
{
  "id": "production-user",
  "name": "Usuário de Teste",
  "email": "teste@signalruido.com"
}
```

---

## 📝 Notas de Implementação

### Princípios de Design
1. **Alta Alavancagem First**: Priorizar Q1 sempre
2. **Data-Driven**: Decisões baseadas em métricas
3. **IA como Assistente**: Sugestões, não imposições
4. **Flexibilidade**: Múltiplos frameworks suportados
5. **Simplicidade**: Interface limpa e focada

### Performance
- Connection pooling no PostgreSQL
- Caching de analytics
- Lazy loading de componentes
- Debounce em buscas

### Segurança
- SQL injection protection (parameterized queries)
- SSL obrigatório no database
- Auth validation em todas APIs
- User isolation (WHERE user_id = $1)

---

## 📚 Documentação Adicional

- **News_features.md**: Especificações detalhadas v2.0
- **Migrations**: `/shared/database/migration_v*.sql`
- **Services**: `/frontend/src/services/`
- **Components**: `/frontend/src/components/`

---

## 🏆 Conquistas

✅ **3 Sprints Completos**
✅ **10 APIs RESTful**
✅ **11 Componentes React**
✅ **14 Migrations Aplicadas**
✅ **112 Templates de Atividades**
✅ **24 Templates de Objetivos**
✅ **Coach IA Funcional**
✅ **4 Frameworks Integrados**

**Sistema 100% funcional para produtividade de alta alavancagem! 🎯**

---

Desenvolvido com foco em **eficiência**, **alavancagem** e **IA** 🚀