# Signal Detector - Especificação do Projeto

**Status:** Em desenvolvimento ativo
**Versão:** 3.2

## Objetivo

Sistema de produtividade pessoal que classifica atividades como **SINAL** (avança objetivos) ou **RUÍDO** (distração), combinando regras heurísticas com IA generativa (Gemini). Inclui coaching com PNL, gestão de hábitos, kanban e analytics avançados.

## Módulos

### 1. Classificação de Sinais (Core)
- **Input**: Descrição, duração, energia antes/depois (1-10)
- **Output**: Score 0-100, classificação (SINAL/RUÍDO/NEUTRO), reasoning
- **Método**: Camada 1 (regras heurísticas) → Camada 2 (Gemini AI para casos neutros)
- **Regras de negócio**:
  - Score > 70 = SINAL
  - Score < 40 = RUÍDO
  - Score 40-70 = NEUTRO
  - Confiança ≥ 0.8 quando 3+ regras aplicam

### 2. Gestão de Objetivos
- Tipos: curto, médio e longo prazo
- Frameworks: OKR, SMART, Atomic Habits, Eisenhower, GTD
- Sugestões de IA para criação de objetivos
- Acompanhamento de progresso com target_value/current_value
- Templates: 24 templates pré-definidos

### 3. Matriz de Alavancagem
- Eixo X: Esforço (1-10) | Eixo Y: Impacto (1-10)
- Q1: Alta Alavancagem (alto impacto, baixo esforço) → PRIORIZAR
- Q2: Projetos Estratégicos (alto impacto, alto esforço) → AGENDAR
- Q3: Distrações (baixo impacto, baixo esforço) → DELEGAR
- Q4: Drenos de Energia (baixo impacto, alto esforço) → ELIMINAR

### 4. Kanban Board
- Colunas: Backlog, Em Progresso, Concluído
- Classificação signal/noise automática e manual (IA)
- Filtros: projeto, prioridade, classificação, geração de receita
- Importação: CSV, TXT, XLSX
- Stats em tempo real

### 5. Hábitos
- Tracking diário/semanal
- Streaks (sequências)
- Cues (gatilhos) e Rewards (recompensas) - Atomic Habits
- Check-ins com timestamp

### 6. Caminho Crítico
- Wizard de 3 etapas
- Caminhos ideais gerados por IA
- Tracking de desvio do progresso
- Timeline visual interativa

### 7. Calculadora de Eficiência
- Fórmula: `(Impacto × 2) / Duração em horas`
- Classificações: Excelente (≥15), Bom (10-15), Moderado (5-10), Baixo (<5)
- Ranking top 10 atividades
- Estatísticas: média, mediana, distribuição
- Alertas de custo de oportunidade

### 8. Dashboard
- Analytics consolidados
- Matriz de alavancagem visual
- Tendências de produtividade
- Atividades recentes
- Recomendações baseadas em dados

### 9. Coaching PNL (Parcial)
- **Status**: Fundação implementada, não completo
- Técnicas: modal_operator_challenge, generalization_challenge, outcome_specification
- Detecção de padrões: procrastinação, perfeccionismo, foco disperso
- Perguntas personalizadas baseadas em padrões do usuário

### 10. Voice-to-Text (Placeholder)
- **Status**: API exists, implementação parcial
- Fluxo planejado: Gravação → Transcrição (Gemini) → Atividade

## Restrições Técnicas

- **Database**: PostgreSQL (Neon) em produção, SQLite fallback em dev
- **IA**: Google Gemini primário, OpenAI opcional
- **Deploy**: Vercel (frontend + API routes), Signal Processor standalone
- **Auth**: NextAuth.js JWT (Credentials provider, 30 dias)
- **PWA/Offline**: Não implementado
- **Foco**: Single-user (multi-user existe mas não é prioridade)

## Regras de Negócio

| Regra | Valor |
|-------|-------|
| Score de sinal | 0-100 |
| Classificação | SINAL (>70), NEUTRO (40-70), RUÍDO (<40) |
| Energia | Escala 1-10 (antes e depois) |
| Impacto | Escala 1-10 |
| Esforço | Escala 1-10 |
| Eficiência | (Impacto × 2) / Horas |
| Rate limit API | 100 req/15min |
| Rate limit Auth | 5 tentativas/hora |
| Rate limit Classify | 20 req/minuto |
| JWT expiration | 30 dias |

## Gaps Conhecidos

1. Coaching PNL: fundação existe mas UX incompleta
2. Voice-to-Text: placeholder, precisa implementação real
3. PWA/Offline: não iniciado
4. Onboarding: novo usuário sem guia
5. Relatórios semanais: não implementado
6. Integração calendário: não iniciado
