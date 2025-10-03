# Plano de Testes Manual - Signal vs Noise Detector v2.0

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Preparação do Ambiente](#preparação-do-ambiente)
3. [Sprint 1: Efficiency System + Critical Path](#sprint-1-efficiency-system--critical-path)
4. [Sprint 2: Templates + Smart Substitution](#sprint-2-templates--smart-substitution)
5. [Sprint 3: Time Blocking + Coach IA + Habits](#sprint-3-time-blocking--coach-ia--habits)
6. [Casos de Teste End-to-End](#casos-de-teste-end-to-end)
7. [Checklist de Validação](#checklist-de-validação)
8. [Relatório de Bugs](#relatório-de-bugs)

---

## Visão Geral

Este documento descreve todos os cenários de testes manuais para validar as funcionalidades implementadas nas Sprints 1, 2 e 3 do Signal vs Noise Detector v2.0.

**Objetivo:** Garantir que todas as features estejam funcionando corretamente antes do deploy em produção.

**Tempo Estimado:** 3-4 horas para execução completa

---

## Preparação do Ambiente

### Pré-requisitos

- [ ] Servidor local rodando (`npm run dev`)
- [ ] Banco PostgreSQL com seed completo (112 activity templates + 24 goal templates)
- [ ] Usuário de teste criado (`production-user`)
- [ ] Navegador com DevTools aberto (para verificar erros no console)
- [ ] Chave API do Gemini configurada

### Script de Setup

```bash
# 1. Instalar dependências
npm install

# 2. Validar banco de dados
PGPASSWORD=npg_ECR7g8zfkbOV psql \
  -h ep-plain-fog-ac6yyl9h-pooler.sa-east-1.aws.neon.tech \
  -U neondb_owner \
  -d neondb \
  -f shared/database/validate_database.sql

# 3. Verificar seed
PGPASSWORD=npg_ECR7g8zfkbOV psql \
  -h ep-plain-fog-ac6yyl9h-pooler.sa-east-1.aws.neon.tech \
  -U neondb_owner \
  -d neondb \
  -c "SELECT COUNT(*) FROM activity_templates;"

# 4. Iniciar servidor
npm run dev
```

### Verificação Inicial

- [ ] Servidor rodando em `http://localhost:3000`
- [ ] Console sem erros críticos
- [ ] Página de login acessível

---

## Sprint 1: Efficiency System + Critical Path

### Feature 1: Efficiency Calculator

#### Teste 1.1: Visualização do Ranking
**Passos:**
1. Faça login com `production-user`
2. Navegue para `/dashboard`
3. Localize o card "Top 10 Atividades Mais Eficientes"
4. Verifique se o ranking está visível

**Resultado Esperado:**
- [ ] Card exibido corretamente
- [ ] Top 3 com medalhas (🥇🥈🥉)
- [ ] Scores de eficiência calculados: `(Impact × 2) / Hours`
- [ ] Badges coloridos por nível (Excelente/Bom/Moderado/Baixo)

#### Teste 1.2: Filtros de Período
**Passos:**
1. No card de ranking, clique no filtro de período
2. Teste cada opção: Hoje / Semana / Mês / Tudo

**Resultado Esperado:**
- [ ] Ranking atualiza ao selecionar período
- [ ] Estatísticas (média, mediana) recalculadas
- [ ] Loading spinner durante requisição

#### Teste 1.3: Estatísticas Agregadas
**Passos:**
1. Observe o painel de estatísticas abaixo do ranking
2. Verifique: Total, Média, Mediana, Maior, Menor

**Resultado Esperado:**
- [ ] Valores numéricos corretos
- [ ] Distribuição por nível (Excelente/Bom/Moderado/Baixo)
- [ ] Gráfico de barras exibido

---

### Feature 2: Critical Path (Rota Crítica)

#### Teste 2.1: Criação de Rota com IA
**Passos:**
1. Navegue para `/goals`
2. Crie um novo objetivo: "Aprender React em 3 meses"
3. Clique no botão de rota crítica (ícone de mapa)
4. No wizard, forneça contexto: "Sou iniciante, trabalho 40h/semana"
5. Aguarde IA gerar sugestões
6. Revise as 3-5 atividades sugeridas
7. Clique em "Salvar Rota"

**Resultado Esperado:**
- [ ] Wizard abre em 3 etapas
- [ ] IA retorna 3-5 atividades com impact/effort/duration
- [ ] Cada atividade tem reasoning explicando importância
- [ ] Rota salva no banco (coluna `ideal_path`)
- [ ] Notificação de sucesso

#### Teste 2.2: Timeline Interativa
**Passos:**
1. Com rota criada, navegue para `/critical-path`
2. Selecione o objetivo no dropdown
3. Observe a timeline com conectores
4. Marque primeira atividade como completa
5. Desmarque
6. Marque novamente

**Resultado Esperado:**
- [ ] Timeline renderiza com conectores visuais
- [ ] Checkbox alterna estado completed/pending
- [ ] Progresso atualiza dinamicamente
- [ ] Badge de progresso (ex: "2/5 Completas - 40%")

#### Teste 2.3: Comparison Chart (Ideal vs Real)
**Passos:**
1. Na página `/critical-path`, observe o gráfico de comparação
2. Complete algumas atividades
3. Verifique desvio da rota ideal

**Resultado Esperado:**
- [ ] Linha azul: Rota Ideal
- [ ] Linha verde: Progresso Real
- [ ] Linha vermelha: Hoje
- [ ] Mensagem de alerta se atraso > 20%
- [ ] Mensagem de parabéns se adiantado

---

### Feature 3: Opportunity Cost

#### Teste 3.1: Detecção de Baixa Eficiência
**Passos:**
1. Registre uma atividade de baixa eficiência:
   - Descrição: "Revisar emails sem critério"
   - Impacto: 3
   - Esforço: 7
   - Duração: 120 min
2. Observe se alert de opportunity cost aparece

**Resultado Esperado:**
- [ ] Dialog abre automaticamente
- [ ] Mostra opportunity cost: +X pontos
- [ ] Lista 3 alternativas melhores
- [ ] Cada alternativa tem reasoning

#### Teste 3.2: Substituição Inteligente
**Passos:**
1. No dialog, selecione uma alternativa
2. Clique em "Substituir Atividade"

**Resultado Esperado:**
- [ ] Atividade original descartada
- [ ] Nova atividade criada com dados do template
- [ ] Notificação de sucesso
- [ ] Eficiência aumentada

---

## Sprint 2: Templates + Smart Substitution

### Feature 4: Activity Templates

#### Teste 4.1: Navegação por Categorias
**Passos:**
1. Navegue para `/record` ou `/text-entry`
2. Clique em "Usar Template"
3. Teste cada aba de categoria:
   - Carreira (20 templates)
   - Aprendizado (20 templates)
   - Saúde (16 templates)
   - Relacionamentos (14 templates)
   - Finanças (14 templates)
   - Crescimento Pessoal (14 templates)
   - Projetos Paralelos (14 templates)

**Resultado Esperado:**
- [ ] Todas as categorias funcionam
- [ ] Pelo menos 10 templates por categoria
- [ ] Templates listam: título, impact, effort, duration
- [ ] Leverage score visível

#### Teste 4.2: Aplicação de Template
**Passos:**
1. Selecione template "Negociar aumento salarial"
2. Clique em "Usar Este Template"

**Resultado Esperado:**
- [ ] Formulário preenchido com dados do template
- [ ] Impact: 9, Effort: 4, Duration: 480
- [ ] Descrição detalhada presente
- [ ] Pode editar antes de salvar

---

### Feature 5: Goal Templates

#### Teste 5.1: Seleção de Template de Objetivo
**Passos:**
1. Navegue para `/goals`
2. Clique em "Usar Template"
3. Explore categorias: Carreira, Aprendizado, Saúde, etc
4. Selecione "Conseguir promoção"

**Resultado Esperado:**
- [ ] Dialog com detalhes do template
- [ ] Mostra: título, descrição, tipo de objetivo
- [ ] Lista atividades sugeridas (3-5)
- [ ] Exibe perguntas reflexivas
- [ ] Botão "Usar Template"

#### Teste 5.2: Perguntas Reflexivas
**Passos:**
1. Após selecionar template, wizard de perguntas abre
2. Responda todas as perguntas (texto/data/número)
3. Clique em "Finalizar"

**Resultado Esperado:**
- [ ] Wizard com múltiplas etapas
- [ ] Perguntas relevantes ao objetivo
- [ ] Validação de campos obrigatórios
- [ ] Respostas salvas como JSONB

---

### Feature 6: Smart Substitution

#### Teste 6.1: Sugestão Proativa
**Passos:**
1. Registre atividade com eficiência < 10
2. Aguarde recomendação de substituição

**Resultado Esperado:**
- [ ] Dialog aparece automaticamente
- [ ] Compara eficiência atual vs alternativa
- [ ] Mostra improvement potential
- [ ] Reasoning explica por que substituir

#### Teste 6.2: Rejeição de Sugestão
**Passos:**
1. No dialog de substituição, clique em "Não, Manter Atividade"

**Resultado Esperado:**
- [ ] Dialog fecha
- [ ] Atividade original mantida
- [ ] Sem impacto no sistema

---

## Sprint 3: Time Blocking + Coach IA + Habits

### Feature 7: Time Block Scheduler

#### Teste 7.1: Criação de Bloco
**Passos:**
1. Navegue para página com `TimeBlockScheduler`
2. Clique em "Novo Bloco"
3. Preencha:
   - Título: "Deep Work - Desenvolvimento"
   - Tipo: Deep Work
   - Data: Amanhã
   - Horário: 09:00 - 11:30
   - Impacto: 9, Esforço: 4
4. Salve

**Resultado Esperado:**
- [ ] Dialog de criação abre
- [ ] Tipos disponíveis: Focus, Deep Work, Meeting, Break, Learning, Admin, Personal
- [ ] Bloco aparece no calendário semanal
- [ ] Cor do bloco corresponde ao tipo

#### Teste 7.2: Detecção de Conflito
**Passos:**
1. Crie bloco: 10:00-11:00
2. Tente criar outro bloco: 10:30-11:30 (conflito!)

**Resultado Esperado:**
- [ ] Erro 409 retornado
- [ ] Mensagem: "Conflito detectado"
- [ ] Lista blocos conflitantes
- [ ] Bloco não é criado

#### Teste 7.3: Marcar como Completo
**Passos:**
1. No calendário, localize bloco agendado
2. Clique no botão de check (✓)

**Resultado Esperado:**
- [ ] Status muda para "completed"
- [ ] Background fica verde
- [ ] Ícone de checkmark aparece

---

### Feature 8: Coach IA

#### Teste 8.1: Recomendação Contextual
**Passos:**
1. Navegue para página com `NextActionCard`
2. Clique em "Atualizar Recomendação"
3. Aguarde análise da IA

**Resultado Esperado:**
- [ ] Loading spinner durante análise
- [ ] IA retorna ação específica
- [ ] Mostra: duração, impacto, esforço, eficiência
- [ ] Reasoning explica "Por que agora?"
- [ ] Badge de urgência (Alta/Média/Baixa)

#### Teste 8.2: Contexto do Período do Dia
**Passos:**
1. Teste em diferentes horários (manhã/tarde/noite)
2. Observe se reasoning adapta

**Resultado Esperado:**
- [ ] Manhã: Sugere tarefas de alto impacto
- [ ] Tarde: Tarefas médias
- [ ] Noite: Tarefas leves ou aprendizado

#### Teste 8.3: Fallback para Regras
**Passos:**
1. Desconecte internet (simular falha da IA)
2. Clique em "Atualizar Recomendação"

**Resultado Esperado:**
- [ ] Sistema usa fallback baseado em regras
- [ ] Recomendação ainda é gerada
- [ ] Badge "🤖 Gerado por regras"

#### Teste 8.4: Iniciar Ação Recomendada
**Passos:**
1. Com recomendação exibida, clique em "Começar Agora"

**Resultado Esperado:**
- [ ] Abre formulário de registro de atividade
- [ ] Campos pré-preenchidos
- [ ] Vinculado ao objetivo correto

---

### Feature 9: Habit Tracker

#### Teste 9.1: Visualização de Grid
**Passos:**
1. Navegue para página com `HabitTracker`
2. Observe grid de 7 dias

**Resultado Esperado:**
- [ ] Cabeçalho: Seg, Ter, Qua, Thu, Sex, Sab, Dom
- [ ] Hábitos listados com nome
- [ ] Check-ins dos últimos 7 dias visíveis
- [ ] ✓ para completo, ○ para pendente

#### Teste 9.2: Check-in Diário
**Passos:**
1. Clique em checkbox de hoje
2. Marque como completo
3. Desmarque
4. Marque novamente

**Resultado Esperado:**
- [ ] Ícone alterna: ○ ↔ ✓
- [ ] Cor verde quando completo
- [ ] Streak atualiza automaticamente
- [ ] Success rate recalculada

#### Teste 9.3: Streak Tracking
**Passos:**
1. Complete hábito por 7 dias seguidos
2. Observe ícone de fogo 🔥 e contagem

**Resultado Esperado:**
- [ ] Streak aumenta a cada dia
- [ ] Cor do fogo muda conforme streak:
  - 🔥 Cinza: < 7 dias
  - 🔥 Âmbar: 7-13 dias
  - 🔥 Azul: 14-29 dias
  - 🔥 Verde: 30+ dias

#### Teste 9.4: Success Rate
**Passos:**
1. Complete 5 de 7 dias
2. Observe barra de progresso

**Resultado Esperado:**
- [ ] Barra mostra 71% (5/7)
- [ ] Verde se >= 80%
- [ ] Amarelo se 60-79%
- [ ] Vermelho se < 60%

---

## Casos de Teste End-to-End

### E2E-1: Jornada Completa do Usuário

**Cenário:** Novo usuário criando objetivo e seguindo recomendações do Coach IA

**Passos:**
1. Login
2. Dashboard → Ver leverage matrix e top activities
3. Criar objetivo: "Melhorar saúde física em 6 meses"
4. Usar template "Desenvolver rotina de exercícios"
5. Gerar rota crítica com IA
6. Verificar Next Action no Coach IA
7. Seguir recomendação e registrar atividade
8. Criar bloco de tempo para amanhã
9. Marcar hábito "Exercitar 30min" como completo

**Resultado Esperado:**
- [ ] Fluxo completo sem erros
- [ ] Dados persistidos no banco
- [ ] Progresso refletido no dashboard

---

### E2E-2: Otimização de Atividade de Baixa Alavancagem

**Cenário:** Usuário registra atividade ineficiente e sistema sugere alternativa

**Passos:**
1. Registrar atividade: "Reunião improdutiva" (Impact: 2, Effort: 8, 120min)
2. Sistema detecta baixa eficiência
3. Dialog de opportunity cost abre
4. Usuário vê 3 alternativas melhores
5. Seleciona "Reunião 1-on-1 focada" (Impact: 8, Effort: 3, 45min)
6. Substitui atividade
7. Eficiência do usuário aumenta

**Resultado Esperado:**
- [ ] Opportunity cost calculado corretamente
- [ ] Alternativas relevantes sugeridas
- [ ] Substituição registrada
- [ ] Ranking de eficiência atualizado

---

## Checklist de Validação

### Funcionalidades Core

- [ ] ✅ Efficiency Calculator funcionando
- [ ] ✅ Critical Path com IA
- [ ] ✅ Timeline interativa
- [ ] ✅ Opportunity Cost alertas
- [ ] ✅ 112 Activity Templates carregados
- [ ] ✅ 24 Goal Templates carregados
- [ ] ✅ Smart Substitution proativa
- [ ] ✅ Time Blocking com conflict detection
- [ ] ✅ Coach IA gerando recomendações
- [ ] ✅ Habit Tracker com streaks

### Performance

- [ ] Páginas carregam em < 2s
- [ ] APIs respondem em < 500ms (sem IA)
- [ ] IA responde em < 5s
- [ ] Sem memory leaks (verificar DevTools)

### UX/UI

- [ ] Componentes responsivos (mobile/desktop)
- [ ] Loading spinners durante requisições
- [ ] Mensagens de erro amigáveis
- [ ] Notificações de sucesso
- [ ] Animações suaves

### Integração

- [ ] Autenticação funcionando
- [ ] Banco PostgreSQL conectado
- [ ] Migrations aplicadas
- [ ] Seed completo
- [ ] APIs RESTful funcionando

### Segurança

- [ ] Validação de input em todas as APIs
- [ ] SQL injection prevention (queries parametrizadas)
- [ ] XSS prevention (sanitização)
- [ ] CSRF tokens (se aplicável)

---

## Relatório de Bugs

### Template de Bug Report

```markdown
**ID:** BUG-XXX
**Severidade:** Crítico / Alto / Médio / Baixo
**Módulo:** Sprint X - Feature Y
**Descrição:** [Descrição detalhada]
**Passos para Reproduzir:**
1.
2.
3.

**Resultado Esperado:**
**Resultado Atual:**
**Screenshots:** [Se aplicável]
**Console Errors:** [Logs]
**Ambiente:**
- Navegador:
- OS:
- Versão:
```

### Bugs Conhecidos (Exemplo)

#### BUG-001
**Severidade:** Médio
**Módulo:** Sprint 1 - Critical Path
**Descrição:** Timeline não atualiza após marcar atividade como completa sem refresh
**Status:** ✅ Resolvido em v2.0.1

---

## Como Executar Este Plano

### 1. Testes Automatizados Primeiro

```bash
# Rodar testes unitários
npm test

# Rodar testes de API (Jest)
npm run test:api

# Validar banco
npm run validate:db
```

### 2. Testes Manuais

- Siga cada seção na ordem (Sprint 1 → 2 → 3)
- Marque checkboxes conforme completa
- Anote bugs encontrados
- Tire screenshots de problemas

### 3. Testes E2E

- Execute os 2 fluxos completos
- Verifique persistência de dados
- Teste em diferentes navegadores

### 4. Relatório Final

- Compile todos os bugs encontrados
- Calcule taxa de sucesso: `(testes passed / total) × 100`
- Documente problemas críticos

---

## Critérios de Aprovação

### ✅ Pronto para Produção Se:

- [ ] **100% dos testes críticos** passam
- [ ] **>= 95% dos testes gerais** passam
- [ ] **Zero bugs críticos** abertos
- [ ] **< 3 bugs altos** abertos
- [ ] **Performance** dentro dos limites
- [ ] **UX** validada

### ⚠️ Necessita Correções Se:

- Testes críticos falhando
- Bugs críticos abertos
- Performance degradada

---

## Próximos Passos

Após validação completa:

1. ✅ Corrigir bugs encontrados
2. ✅ Re-testar funcionalidades afetadas
3. ✅ Deploy em staging
4. ✅ Smoke tests em staging
5. ✅ Deploy em produção
6. ✅ Monitoramento pós-deploy

---

## Contatos

**Responsável pelos Testes:** [Seu Nome]
**Data de Execução:** [Data]
**Versão Testada:** v2.0.0
**Status:** ⏳ Em Andamento / ✅ Completo

---

**Última Atualização:** 2025-09-30