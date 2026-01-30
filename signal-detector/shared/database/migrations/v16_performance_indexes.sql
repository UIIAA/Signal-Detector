-- Performance Optimization Indexes
-- FASE 3: PERFORMANCE - Elevando performance de 7/10 para 8/10

-- Índices para filtros comuns em activities
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_goal ON activities(user_id, goal_id) WHERE goal_id IS NOT NULL;

-- Índices para goals e habits filtrados por usuário e status
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON goals(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits(user_id) WHERE is_active = TRUE;

-- Índices para kanban tasks com filtro de status ativo
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_user_status_active ON kanban_tasks(user_id, status) WHERE is_active = TRUE;

-- Índice para ordenação de tarefas no Kanban
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_ordem ON kanban_tasks(user_id, ordem) WHERE is_active = TRUE;
