# Plano de Implementação: Novas Features - Sistema de Alavancagem v2.0

## Visão Geral
Este documento detalha o plano completo de implementação do **Sistema de Alavancagem Avançado** no projeto "Sinal vs Ruído". Esta funcionalidade é o coração da aplicação, permitindo aos usuários não apenas classificar suas atividades com base em **Impacto** e **Esforço**, mas também receber educação proativa, sugestões inteligentes e análises preditivas para maximizar sua produtividade.

## Status de Implementação
- ✅ **v1.0-1.3:** Sistema básico de Impacto vs Esforço
- 🚧 **v2.0:** Funcionalidades avançadas (este documento)

---

## 📊 FUNCIONALIDADES V1.0-1.3 (IMPLEMENTADAS)

### Passo 1: Evoluir o Modelo de Dados (Database)

**Objetivo:** Adicionar suporte no banco de dados para armazenar os valores de impacto e esforço de cada atividade.

**Tarefas Concluídas:**

1.  ✅ **Arquivo de Migração SQL criado:**
    - `migration_v4_leverage_system.sql` adicionou colunas `impact` e `effort` à tabela `activities`
    - Valor padrão `5` para compatibilidade com registros existentes

2.  ✅ **Migração Aplicada:**
    - Banco PostgreSQL/Neon atualizado
    - Campos funcionando corretamente

---

### Passo 2: Atualizar o Backend (API)

**Objetivo:** Habilitar as rotas da API para receber, validar e persistir os novos dados `impact` e `effort`.

**Tarefas Concluídas:**

1.  ✅ **Rota de Criação de Atividade (`POST /api/classify`)**:
    - Extrai `impact` e `effort` do `req.body`
    - Validação de tipos e ranges (1-10)
    - Persistência no banco de dados

2.  ✅ **Integração com outras APIs**:
    - `/api/activities/recent` retorna impact/effort
    - Dashboard consome dados corretamente

---

### Passo 3: Modificar o Frontend (Captura de Dados)

**Objetivo:** Atualizar a interface do usuário para que o usuário possa inserir os valores de impacto e esforço.

**Tarefas Concluídas:**

1.  ✅ **Campos adicionados aos formulários:**
    - `<Slider>` Material-UI com intervalo 0-10
    - Labels claras: "Impacto no Objetivo (0-10)" e "Esforço Necessário (0-10)"
    - Implementado em `text-entry.js` e `record.js`

2.  ✅ **Gerenciamento de estado atualizado:**
    - `useState({ impact: 5, effort: 5 })` em todos os formulários

3.  ✅ **Lógica de submissão integrada:**
    - Payload inclui `impact` e `effort` nas requisições

---

### Passo 4: Visualizar a Matriz de Alavancagem (Dashboard)

**Objetivo:** Criar o componente visual da Matriz de Alavancagem e integrá-lo ao dashboard.

**Tarefas Concluídas:**

1.  ✅ **Componente `LeverageMatrix.js` criado:**
    - Localização: `frontend/src/components/LeverageMatrix.js`
    - Recebe `activities` como props

2.  ✅ **Gráfico de Dispersão implementado:**
    - Biblioteca: `Recharts` com `ScatterChart`
    - Eixo X: "Esforço" | Eixo Y: "Impacto"
    - **Quadrantes coloridos:**
      - 🟢 **Q1:** Alto Impacto + Baixo Esforço (Verde) - "Vitórias Rápidas"
      - 🔵 **Q2:** Alto Impacto + Alto Esforço (Azul) - "Projetos Estratégicos"
      - 🟡 **Q3:** Baixo Impacto + Baixo Esforço (Amarelo) - "Distrações"
      - 🔴 **Q4:** Baixo Impacto + Alto Esforço (Vermelho) - "Drenos de Energia"
    - Tooltips exibem detalhes das atividades

3.  ✅ **Integração com Dashboard:**
    - `dashboard.js` importa e renderiza `<LeverageMatrix />`
    - Dados obtidos via API `/api/activities/recent`

---

## 🚀 NOVAS FUNCIONALIDADES V2.0 (A IMPLEMENTAR)

---

## 🔢 1. SISTEMA DE PONTUAÇÃO E EFICIÊNCIA

### **Visão Geral**
Sistema que calcula automaticamente a eficiência de cada atividade usando uma fórmula matemática, permitindo ranking e comparações objetivas.

### **Funcionalidades**

#### 1.1 Fórmula de Eficiência
- **Cálculo:** `Pontos de Eficiência = (Impacto × 2) / Tempo Gasto (horas)`
- **Exemplo:**
  - Atividade A: Impacto=9, Tempo=1h → Eficiência = 18 pontos/hora
  - Atividade B: Impacto=6, Tempo=3h → Eficiência = 4 pontos/hora
- **Ranking:** Dashboard mostra top 10 atividades mais eficientes
- **Score Médio:** Métrica semanal/mensal de eficiência média

#### 1.2 Custo de Oportunidade
Sistema alerta o usuário quando registra atividade de baixa eficiência, mostrando alternativas melhores.

**Exemplo de Alerta:**
```
⚠️ Custo de Oportunidade Detectado

Você dedicou 4h à atividade "Reunião de Networking" (Impacto: 4/10, Eficiência: 2 pontos/hora)

Nesse mesmo tempo, você poderia ter realizado:
• 4x "Estudo para Certificação" (Impacto: 9/10, Eficiência: 18 pontos/hora)
• 2x "Entregar Projeto X" (Impacto: 8/10, Eficiência: 10 pontos/hora)

📊 Custo de Oportunidade: 64 pontos de impacto potencial perdidos

[Ver Alternativas] [Continuar assim mesmo]
```

### **Implementação Técnica**

**Arquivos a criar:**
- `frontend/src/services/EfficiencyCalculator.js`
  ```javascript
  export class EfficiencyCalculator {
    static calculateEfficiency(activity) {
      const { impact, duration_minutes } = activity;
      const hours = duration_minutes / 60;
      return (impact * 2) / hours;
    }

    static calculateOpportunityCost(lowEffActivity, topActivities) {
      // Lógica de cálculo do custo de oportunidade
    }
  }
  ```

- `frontend/src/components/OpportunityCostAlert.js`
  - Dialog Material-UI com warning icon
  - Lista de alternativas sugeridas
  - Botões de ação (aceitar/recusar)

- `frontend/pages/api/activities/efficiency.js`
  - GET endpoint que retorna ranking de eficiência
  - Parâmetros: userId, timeframe (week/month/all)
  - Response: array de atividades ordenadas por eficiência

**Integrações:**
- Modificar `text-entry.js` para mostrar alerta após submissão
- Modificar `record.js` para mostrar alerta após classificação
- Dashboard: adicionar card "Top Atividades Eficientes"

---

## 📈 2. ROTA IDEAL VS. PROGRESSO REAL

### **Visão Geral**
Sistema que permite ao usuário planejar uma "rota crítica" para o objetivo e compara visualmente o progresso real com o planejado.

### **Funcionalidades**

#### 2.1 Wizard de Rota Crítica
Ao criar um objetivo, o usuário é guiado por um wizard que:
1. **Análise do Objetivo:** IA analisa o objetivo e contexto
2. **Sugestão de Atividades:** Sistema sugere 3-5 atividades de alta alavancagem
3. **Customização:** Usuário pode editar, adicionar ou remover atividades
4. **Definição de Timeline:** Estimar quando cada atividade deve ser concluída

#### 2.2 Visualização Comparativa
Gráfico de linha mostrando:
- **Linha Azul Sólida:** Progresso real (baseado em atividades executadas)
- **Linha Cinza Tracejada:** Progresso ideal (baseado na rota planejada)
- **Área Sombreada:** Diferença/desvio entre real e ideal

**Métricas:**
- "Você está 15% atrás da rota ideal"
- "Desvio médio: 3 dias"
- "Próxima atividade da rota: [X]"

### **Implementação Técnica**

**Arquivos a criar:**
- `frontend/src/components/CriticalPathWizard.js`
  ```javascript
  export default function CriticalPathWizard({ goalId, goalTitle }) {
    // Step 1: AI Analysis
    // Step 2: Suggested Activities
    // Step 3: Timeline Definition
    // Step 4: Review & Confirm
  }
  ```

- `frontend/src/components/ProgressComparisonChart.js`
  - Recharts LineChart com 2 datasets
  - Área sombreada (ReferenceArea)
  - Tooltips informativos

- `frontend/pages/api/goals/ideal-path.js`
  - POST: salva rota ideal
  - GET: recupera rota e calcula desvio
  - PUT: atualiza rota

**Database:**
- Adicionar campo `ideal_path` JSON na tabela `goals`:
  ```sql
  ALTER TABLE goals ADD COLUMN ideal_path JSONB;

  -- Exemplo de estrutura:
  {
    "activities": [
      {"title": "...", "impact": 9, "effort": 3, "deadline": "2025-10-15"},
      {"title": "...", "impact": 8, "effort": 5, "deadline": "2025-10-30"}
    ],
    "milestones": [
      {"percentage": 25, "date": "2025-10-15"},
      {"percentage": 50, "date": "2025-11-01"}
    ]
  }
  ```

**Integrações:**
- Modificar `goals.js` para incluir botão "Definir Rota Crítica"
- Dashboard: adicionar gráfico de comparação
- `/plan`: mostrar próxima atividade da rota

---

## 🔄 3. BOTÃO DE SUBSTITUIÇÃO INTELIGENTE

### **Visão Geral**
Sistema que sugere alternativas de maior alavancagem quando o usuário registra uma atividade de baixa eficiência.

### **Funcionalidades**

#### 3.1 Detecção Automática
Após classificação, se a atividade tem:
- Eficiência < 5 pontos/hora, OU
- Impacto < 5 E Esforço > 5 (Q4 da matriz)

→ Sistema mostra dialog de substituição

#### 3.2 Sugestões Contextuais
IA (Gemini) gera 3 sugestões baseadas em:
- Objetivos ativos do usuário
- Histórico de atividades eficientes
- Templates do banco de dados
- Contexto temporal (horário, dia da semana)

**Exemplo de Sugestão:**
```
💡 Alternativas de Maior Alavancagem

Você registrou: "Reunião de Networking - 3h" (Eficiência: 4 pontos/hora)

Considere estas alternativas:

1. ✨ Escrever artigo sobre expertise (Impacto: 8/10, Esforço: 2h)
   → Alcance maior, esforço menor
   [Agendar] [Adicionar ao Plano]

2. 🎯 Café 30min com gestor direto (Impacto: 9/10, Esforço: 0.5h)
   → Impacto direto, tempo mínimo
   [Agendar] [Adicionar ao Plano]

3. 📚 Estudo focado 1h (Impacto: 8/10, Esforço: 1h)
   → Alta eficiência, contribui para certificação
   [Agendar] [Adicionar ao Plano]

[Não mostrar novamente para este tipo de atividade]
```

### **Implementação Técnica**

**Arquivos a criar:**
- `frontend/src/components/SmartSubstitutionDialog.js`
  - Dialog Material-UI com lista de alternativas
  - Botões de ação por alternativa
  - Opção de feedback (útil/não útil)

- `frontend/pages/api/suggest-alternatives.js`
  ```javascript
  // POST /api/suggest-alternatives
  // Body: { activityId, userId, goals[] }
  // Response: { alternatives: [...] }

  // Usa Gemini AI para gerar sugestões contextuais
  ```

**Integrações:**
- `text-entry.js`: mostrar dialog após resultado de classificação
- `record.js`: mostrar dialog após resultado de classificação
- Sistema de aprendizado: registrar feedback do usuário

---

## 📚 4. BANCO DE TEMPLATES E ATIVIDADES-PADRÃO

### **Visão Geral**
Banco de dados com atividades comuns para objetivos típicos, facilitando o planejamento.

### **Funcionalidades**

#### 4.1 Templates por Categoria
Sistema oferece templates para:
- **Promoção/Carreira:** 15+ atividades
- **Aprendizado/Certificação:** 12+ atividades
- **Saúde/Fitness:** 10+ atividades
- **Projetos Pessoais:** 8+ atividades
- **Empreendedorismo:** 12+ atividades

#### 4.2 Sistema de Matching Inteligente
- Tags semânticas para atividades
- Matching via similaridade (IA)
- Personalização baseada em contexto

**Exemplo:**
```
Objetivo: "Conquistar promoção a gerente"

Atividades Sugeridas:
✅ Buscar feedback formal do gestor (Impacto: 9, Esforço: 2)
✅ Liderar apresentação importante (Impacto: 8, Esforço: 6)
✅ Fazer curso de gestão de conflitos (Impacto: 7, Esforço: 4)
✅ Mentoria com um diretor (Impacto: 9, Esforço: 2)
✅ Entregar projeto de alta visibilidade (Impacto: 10, Esforço: 8)
```

### **Implementação Técnica**

**Database Migration:**
```sql
-- migration_v7_activity_templates.sql
CREATE TABLE activity_templates (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  category TEXT NOT NULL, -- 'career', 'learning', 'health', etc.
  title TEXT NOT NULL,
  description TEXT,
  typical_impact INTEGER CHECK (typical_impact BETWEEN 1 AND 10),
  typical_effort INTEGER CHECK (typical_effort BETWEEN 1 AND 10),
  tags TEXT[], -- array de tags para matching
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_templates_category ON activity_templates(category);
CREATE INDEX idx_activity_templates_tags ON activity_templates USING GIN(tags);

-- Inserir templates iniciais
INSERT INTO activity_templates (category, title, description, typical_impact, typical_effort, tags) VALUES
('career', 'Buscar feedback formal do gestor', 'Agendar 1:1 para discussão de performance', 9, 2, ARRAY['feedback', 'gestao', 'carreira']),
('career', 'Liderar apresentação importante', 'Preparar e apresentar para stakeholders chave', 8, 6, ARRAY['lideranca', 'visibilidade', 'comunicacao']),
-- ... mais templates
```

**Arquivos a criar:**
- `frontend/pages/api/goals/templates.js`
  ```javascript
  // GET /api/goals/templates?category=career&goalDescription=...
  // Retorna templates matching + sugestões da IA
  ```

- `frontend/src/components/GoalTemplateSelector.js`
  - Lista de templates com checkbox
  - Preview de cada template
  - Botão "Adicionar selecionados ao plano"

**Integrações:**
- Wizard de criação de objetivos (`goals.js`)
- Página `/plan` (adicionar atividades rapidamente)
- CriticalPathWizard (sugerir atividades)

---

## 📅 5. SISTEMA DE BLOQUEIOS DE TEMPO

### **Visão Geral**
Calendário integrado para agendar "blocos de sinal" - tempo dedicado a atividades de alta alavancagem.

### **Funcionalidades**

#### 5.1 Agendamento de Blocos
- Agendar blocos de tempo para atividades-chave
- Blocos recorrentes (ex: "Toda quarta, 14h-15h: Estudo")
- Notificações/lembretes (browser notifications)

#### 5.2 Métricas de Execução
Dashboard mostra:
- **Tempo Planejado em Atividades-Chave:** 12h/semana
- **Tempo Real Executado:** 9h/semana
- **Taxa de Execução:** 75%
- **Blocos cumpridos vs. perdidos**

### **Implementação Técnica**

**Database Migration:**
```sql
-- migration_v8_scheduled_blocks.sql
CREATE TABLE scheduled_blocks (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id),
  key_activity_id TEXT REFERENCES key_activities(id),
  title TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  recurrence TEXT CHECK (recurrence IN ('none', 'daily', 'weekly', 'biweekly', 'monthly')),
  status TEXT CHECK (status IN ('pending', 'completed', 'missed')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduled_blocks_user ON scheduled_blocks(user_id, scheduled_date);
```

**Arquivos a criar:**
- `frontend/src/components/ActivityScheduler.js`
  - Calendário Material-UI (ou react-calendar)
  - Form para criar blocos
  - Visualização semanal/mensal

- `frontend/pages/api/schedule/blocks.js`
  - CRUD completo para blocos
  - GET: listar blocos por período
  - POST: criar bloco
  - PUT: marcar como completo/perdido
  - DELETE: remover bloco

**Integrações:**
- Página `/plan`: botão "Agendar" em cada atividade-chave
- Dashboard: widget de blocos da semana
- Notificações browser (PWA)

---

## 🤖 6. COACH IA E ANÁLISE PREDITIVA

### **Visão Geral**
Sistema inteligente que analisa o progresso e recomenda a próxima melhor ação.

### **Funcionalidades**

#### 6.1 Recomendação da Próxima Ação
Dashboard mostra card destaque:
```
🎯 Próxima Ação Recomendada

Com base no seu progresso em "Promoção a Gerente" (45% completo),
a próxima ação de maior alavancagem é:

📌 Buscar feedback formal do seu gestor

Por quê?
• Alto impacto (9/10) e baixo esforço (2/10)
• Te dará clareza sobre áreas de melhoria
• Alinha expectativas para a promoção
• Tempo ideal: esta semana

[Adicionar ao Plano] [Agendar Agora] [Ver Outras Sugestões]
```

#### 6.2 Perguntas Reflexivas Pós-Atividade
Após registrar atividade de baixa alavancagem (Eficiência < 5):

```
🤔 Vamos Refletir

Você registrou "Reunião longa" (Impacto: 4/10, Esforço: 8/10)

Algumas perguntas para reflexão:

1. Havia um objetivo claro e específico para esta atividade?
   [ ] Sim, muito claro  [ ] Mais ou menos  [ ] Não havia

2. Esse resultado poderia ter sido alcançado de forma mais rápida ou fácil?
   [ ] Sim, definitivamente  [ ] Talvez  [ ] Não

3. Esta era a atividade mais importante que você poderia ter feito nesse momento?
   [ ] Sim  [ ] Provavelmente não  [ ] Não

[Enviar Feedback] [Pular]

💡 Suas respostas ajudam a IA a melhorar as recomendações
```

**Sistema de Scoring:**
- Respostas geram "pontos de consciência"
- Usuário acumula pontos e desbloqueia insights
- IA aprende padrões e melhora sugestões

### **Implementação Técnica**

**Arquivos a criar:**
- `frontend/pages/api/recommendations/next-action.js`
  ```javascript
  // POST /api/recommendations/next-action
  // Body: { userId, goalId }
  // Response: {
  //   action: {...},
  //   reasoning: "...",
  //   alternatives: [...]
  // }

  // Usa Gemini AI para análise contextual
  ```

- `frontend/src/components/NextActionCard.js`
  - Card destacado no dashboard
  - Botões de ação
  - Explicação detalhada

- `frontend/src/components/ReflectiveQuestionsDialog.js`
  - Dialog com 3-5 perguntas
  - Radio buttons para respostas
  - Sistema de scoring visual

**Integrações:**
- Dashboard: card fixo com próxima ação
- Pós-atividade: dialog de perguntas reflexivas
- Sistema de aprendizado: registrar respostas

---

## 📋 7. FRAMEWORKS DE PRODUTIVIDADE INTEGRADOS

### **Visão Geral**
Templates baseados em metodologias consagradas de produtividade.

### **Funcionalidades**

#### 7.1 Framework: OKR (Objectives and Key Results)
```
Objetivo: Conquistar promoção a gerente

Key Results:
1. Entregar 2 projetos de alta visibilidade até Q4 (0/2)
2. Obter rating "Exceeds Expectations" na avaliação (Pendente)
3. Liderar 5+ apresentações para stakeholders (2/5)

Atividades sugeridas para KR1:
• Identificar projetos estratégicos disponíveis
• Propor liderança em projeto X
• ...
```

#### 7.2 Framework: Hábitos Atômicos (Atomic Habits)
```
Objetivo: Aumentar produtividade pessoal

Micro-hábitos (2 minutos):
✅ Revisar prioridades ao abrir laptop (manhã)
✅ 2min de meditação antes de reuniões importantes
✅ Registrar 1 aprendizado ao fim do dia

Atividades de construção:
→ Micro-hábitos levam a ações maiores naturalmente
```

#### 7.3 Framework: Matriz de Eisenhower
```
Classificação das atividades:

Quadrante 1: Importante + Urgente (Fazer Agora)
• Entregar projeto X (deadline amanhã)

Quadrante 2: Importante + Não Urgente (Agendar) 🎯
• Estudar para certificação
• Mentoria com diretor
→ Foco em Q2 = máxima alavancagem

Quadrante 3: Não Importante + Urgente (Delegar)
• Responder emails rotineiros

Quadrante 4: Não Importante + Não Urgente (Eliminar)
• Scroll em redes sociais
```

#### 7.4 Framework: RICE Scoring
```
Fórmula: (Reach × Impact × Confidence) / Effort

Atividade: "Fazer certificação AWS"
• Reach: 8 (beneficia múltiplos objetivos)
• Impact: 9 (alto impacto em promoção)
• Confidence: 7 (70% confiança de completar)
• Effort: 4 (40 horas estimadas)

Score RICE = (8 × 9 × 7) / 4 = 126 pontos

Ranking por RICE:
1. Certificação AWS (126 pontos)
2. Projeto Y (98 pontos)
3. ...
```

### **Implementação Técnica**

**Database Migration:**
```sql
-- migration_v9_frameworks.sql
CREATE TABLE framework_instances (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id),
  goal_id TEXT REFERENCES goals(id),
  framework_type TEXT CHECK (framework_type IN ('okr', 'atomic_habits', 'eisenhower', 'rice')),
  configuration JSONB, -- estrutura específica do framework
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exemplo de configuration para OKR:
{
  "objective": "...",
  "key_results": [
    {"description": "...", "target": 2, "current": 0},
    {"description": "...", "target": 100, "current": 45}
  ]
}
```

**Arquivos a criar:**
- `frontend/src/components/FrameworkSelector.js`
  - Wizard para escolher framework
  - Preview de cada metodologia
  - Configuração guiada

- `frontend/pages/api/frameworks/apply.js`
  - POST: aplicar framework a um objetivo
  - GET: recuperar framework instance
  - PUT: atualizar progresso

- `frontend/src/components/frameworks/OKRView.js`
- `frontend/src/components/frameworks/AtomicHabitsView.js`
- `frontend/src/components/frameworks/EisenhowerMatrix.js`
- `frontend/src/components/frameworks/RICEScoring.js`

**Integrações:**
- Wizard de criação de objetivos
- Página `/plan` com visualização do framework ativo
- Dashboard com métricas do framework

---

## 🗓️ ROADMAP DE IMPLEMENTAÇÃO

### **Sprint 1 (Semana 1) - FUNDAÇÃO** 🔥
**Prioridade: ALTA**

#### Tarefas:
1. ✅ Sistema de Eficiência
   - [ ] Criar `EfficiencyCalculator.js`
   - [ ] Criar `OpportunityCostAlert.js`
   - [ ] Criar API `/api/activities/efficiency`
   - [ ] Integrar em text-entry e record
   - [ ] Adicionar card no dashboard

2. ✅ Rota Ideal vs Progresso Real
   - [ ] Criar migration para campo `ideal_path`
   - [ ] Criar `CriticalPathWizard.js`
   - [ ] Criar `ProgressComparisonChart.js`
   - [ ] Criar API `/api/goals/ideal-path`
   - [ ] Integrar em goals.js

**Estimativa:** 18-22 horas
**Resultado:** Usuário vê eficiência de atividades e pode planejar rota ideal

---

### **Sprint 2 (Semana 2) - INTELIGÊNCIA** ⚡
**Prioridade: MÉDIA**

#### Tarefas:
1. ✅ Botão de Substituição Inteligente
   - [ ] Criar `SmartSubstitutionDialog.js`
   - [ ] Criar API `/api/suggest-alternatives`
   - [ ] Integrar Gemini AI para sugestões
   - [ ] Implementar sistema de feedback

2. ✅ Banco de Templates
   - [ ] Criar migration_v7_activity_templates.sql
   - [ ] Popular com 50+ templates
   - [ ] Criar API `/api/goals/templates`
   - [ ] Criar `GoalTemplateSelector.js`
   - [ ] Integrar em wizard de objetivos

3. ✅ Perguntas Reflexivas
   - [ ] Criar `ReflectiveQuestionsDialog.js`
   - [ ] Sistema de scoring
   - [ ] Integrar pós-atividade

**Estimativa:** 24-28 horas
**Resultado:** IA sugere alternativas e educa o usuário

---

### **Sprint 3 (Semana 3) - EXPANSÃO** 🚀
**Prioridade: NORMAL**

#### Tarefas:
1. ✅ Sistema de Agendamento
   - [ ] Criar migration_v8_scheduled_blocks.sql
   - [ ] Criar `ActivityScheduler.js`
   - [ ] Criar API `/api/schedule/blocks`
   - [ ] Implementar notificações browser
   - [ ] Métricas de execução

2. ✅ Coach IA
   - [ ] Criar API `/api/recommendations/next-action`
   - [ ] Criar `NextActionCard.js`
   - [ ] Integração com Gemini AI
   - [ ] Sistema de aprendizado

3. ✅ Frameworks
   - [ ] Criar migration_v9_frameworks.sql
   - [ ] Criar `FrameworkSelector.js`
   - [ ] Implementar 4 frameworks
   - [ ] Criar views específicas
   - [ ] Criar API `/api/frameworks/apply`

**Estimativa:** 28-32 horas
**Resultado:** Sistema completo de produtividade com múltiplas metodologias

---

## 📊 MÉTRICAS DE SUCESSO

### **KPIs Técnicos**
- ✅ 90%+ dos formulários incluem impact/effort
- ✅ 80%+ dos usuários visualizam matriz de alavancagem
- ✅ Tempo de resposta das APIs < 500ms
- ✅ Taxa de erro < 1%

### **KPIs de Produto**
- 🎯 70%+ dos usuários usam templates de atividades
- 🎯 50%+ dos usuários definem rota ideal
- 🎯 60%+ dos usuários aceitam sugestões de substituição
- 🎯 40%+ dos usuários agendam blocos de tempo
- 🎯 30%+ dos usuários respondem perguntas reflexivas

### **KPIs de Impacto**
- 🎯 Aumento de 40% em atividades de alta eficiência (Q1 da matriz)
- 🎯 Redução de 50% em atividades de baixa eficiência (Q4 da matriz)
- 🎯 Melhoria de 30% na taxa de conclusão de objetivos
- 🎯 Aumento de 60% em "pontos de eficiência" médios semanais

---

## ✅ CHECKLIST DE QUALIDADE

### **Antes de Lançar Cada Feature:**
- [ ] Testes unitários implementados
- [ ] Testes de integração passando
- [ ] Performance testada (< 500ms response time)
- [ ] UX testada com usuário real
- [ ] Documentação atualizada
- [ ] README atualizado
- [ ] Migrations aplicadas em ambiente de teste
- [ ] Rollback plan definido
- [ ] Feedback loop implementado

---

## 🎯 CONCLUSÃO

Este plano transforma o "Sinal vs Ruído" de uma ferramenta de classificação básica em um **coach de produtividade inteligente e completo**.

Com a implementação das 7 novas funcionalidades, o usuário não apenas registra atividades, mas:
- 📊 Compreende objetivamente sua eficiência
- 🎯 Planeja rotas otimizadas para objetivos
- 💡 Recebe educação proativa e sugestões inteligentes
- 🤖 Tem um coach IA que aprende e melhora constantemente
- 📚 Acessa frameworks validados de produtividade
- 📅 Organiza seu tempo de forma estratégica
- 🧠 Desenvolve pensamento crítico sobre suas escolhas

**Resultado Final:** Uma aplicação que **transforma comportamento** através de educação, não apenas tracking.

---

**Última Atualização:** 29 de Setembro de 2025
**Versão do Documento:** 2.0
**Status:** 🚧 Em implementação progressiva