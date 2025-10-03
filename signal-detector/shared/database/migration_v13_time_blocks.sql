-- migration_v13_time_blocks.sql
-- Sistema de agendamento e blocos de tempo para atividades

-- Tabela de blocos de tempo agendados
CREATE TABLE IF NOT EXISTS time_blocks (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  block_type TEXT CHECK (block_type IN ('focus', 'meeting', 'break', 'learning', 'admin', 'deep-work', 'shallow-work', 'personal')) DEFAULT 'focus',

  -- Timing
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM (end_time - start_time))/60) STORED,

  -- Relações
  activity_id TEXT REFERENCES activities(id) ON DELETE SET NULL,
  goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
  template_id TEXT REFERENCES activity_templates(id) ON DELETE SET NULL,

  -- Planejamento
  planned_impact INTEGER CHECK (planned_impact >= 1 AND planned_impact <= 10),
  planned_effort INTEGER CHECK (planned_effort >= 1 AND planned_effort <= 10),

  -- Execução
  status TEXT CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled', 'missed')) DEFAULT 'scheduled',
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  actual_duration_minutes INTEGER,

  -- Avaliação pós-execução
  actual_impact INTEGER CHECK (actual_impact >= 1 AND actual_impact <= 10),
  actual_effort INTEGER CHECK (actual_effort >= 1 AND actual_effort <= 10),
  completion_notes TEXT,
  energy_before INTEGER CHECK (energy_before >= 1 AND energy_before <= 5),
  energy_after INTEGER CHECK (energy_after >= 1 AND energy_after <= 5),

  -- Recorrência
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'daily', 'weekly', 'weekdays', 'custom'
  recurrence_end_date DATE,
  parent_block_id TEXT REFERENCES time_blocks(id) ON DELETE CASCADE, -- se for instância de recorrência

  -- Metadados
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_user ON time_blocks(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_status ON time_blocks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_time_blocks_date_range ON time_blocks(scheduled_date, start_time);
CREATE INDEX IF NOT EXISTS idx_time_blocks_activity ON time_blocks(activity_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_goal ON time_blocks(goal_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_recurring ON time_blocks(parent_block_id) WHERE is_recurring = true;

COMMENT ON TABLE time_blocks IS 'Blocos de tempo agendados para time-blocking e planejamento de atividades';
COMMENT ON COLUMN time_blocks.block_type IS 'Tipo de bloco: focus (trabalho focado), meeting, break, learning, etc';
COMMENT ON COLUMN time_blocks.duration_minutes IS 'Duração planejada calculada automaticamente';
COMMENT ON COLUMN time_blocks.actual_duration_minutes IS 'Duração real se diferente do planejado';
COMMENT ON COLUMN time_blocks.parent_block_id IS 'ID do bloco pai se for instância de recorrência';

-- Tabela de conflitos de agenda detectados
CREATE TABLE IF NOT EXISTS schedule_conflicts (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  block_id_1 TEXT NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
  block_id_2 TEXT NOT NULL REFERENCES time_blocks(id) ON DELETE CASCADE,
  conflict_type TEXT CHECK (conflict_type IN ('overlap', 'back-to-back', 'overload')) NOT NULL,
  conflict_severity TEXT CHECK (conflict_severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  auto_resolved BOOLEAN DEFAULT false,
  resolution_action TEXT, -- 'ignored', 'rescheduled', 'cancelled'
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_user ON schedule_conflicts(user_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_schedule_conflicts_unresolved ON schedule_conflicts(user_id) WHERE auto_resolved = false;

COMMENT ON TABLE schedule_conflicts IS 'Conflitos de agenda detectados automaticamente';
COMMENT ON COLUMN schedule_conflicts.conflict_type IS 'overlap (sobreposição), back-to-back (sem intervalo), overload (sobrecarga)';

-- Tabela de preferências de agendamento do usuário
CREATE TABLE IF NOT EXISTS scheduling_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Horários de trabalho
  work_start_time TIME DEFAULT '09:00',
  work_end_time TIME DEFAULT '18:00',
  lunch_break_start TIME DEFAULT '12:00',
  lunch_break_duration INTEGER DEFAULT 60, -- minutos

  -- Preferências de blocos
  min_block_duration INTEGER DEFAULT 25, -- Pomodoro
  max_block_duration INTEGER DEFAULT 120,
  preferred_focus_duration INTEGER DEFAULT 90,
  break_duration INTEGER DEFAULT 15,

  -- Energia e ritmo circadiano
  peak_energy_start TIME DEFAULT '09:00',
  peak_energy_end TIME DEFAULT '12:00',
  low_energy_start TIME DEFAULT '14:00',
  low_energy_end TIME DEFAULT '16:00',

  -- Dias de trabalho
  work_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 0=domingo, 1=segunda, etc

  -- Configurações
  allow_overlapping_blocks BOOLEAN DEFAULT false,
  auto_schedule_breaks BOOLEAN DEFAULT true,
  protect_deep_work_time BOOLEAN DEFAULT true,
  max_meetings_per_day INTEGER DEFAULT 4,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduling_preferences_user ON scheduling_preferences(user_id);

COMMENT ON TABLE scheduling_preferences IS 'Preferências personalizadas de agendamento e produtividade do usuário';
COMMENT ON COLUMN scheduling_preferences.peak_energy_start IS 'Horário de pico de energia para alocar atividades de alto impacto';
COMMENT ON COLUMN scheduling_preferences.work_days IS 'Array de dias da semana de trabalho (0=domingo, 6=sábado)';

-- View para estatísticas de utilização de tempo
CREATE OR REPLACE VIEW time_utilization_stats AS
SELECT
  tb.user_id,
  DATE_TRUNC('week', tb.scheduled_date) as week_start,
  COUNT(*) as total_blocks,
  SUM(tb.duration_minutes) as planned_minutes,
  SUM(CASE WHEN tb.status = 'completed' THEN tb.actual_duration_minutes ELSE 0 END) as actual_minutes,
  SUM(CASE WHEN tb.block_type IN ('focus', 'deep-work') THEN tb.duration_minutes ELSE 0 END) as focus_minutes,
  SUM(CASE WHEN tb.block_type = 'meeting' THEN tb.duration_minutes ELSE 0 END) as meeting_minutes,
  SUM(CASE WHEN tb.block_type = 'break' THEN tb.duration_minutes ELSE 0 END) as break_minutes,
  COUNT(CASE WHEN tb.status = 'completed' THEN 1 END) as completed_blocks,
  COUNT(CASE WHEN tb.status = 'missed' THEN 1 END) as missed_blocks,
  ROUND(
    COUNT(CASE WHEN tb.status = 'completed' THEN 1 END)::DECIMAL /
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as completion_rate
FROM time_blocks tb
GROUP BY tb.user_id, DATE_TRUNC('week', tb.scheduled_date);

COMMENT ON VIEW time_utilization_stats IS 'Estatísticas semanais de utilização e efetividade do time-blocking';

-- View para próximas ações recomendadas (usado pelo Coach IA)
CREATE OR REPLACE VIEW next_recommended_actions AS
SELECT
  g.user_id,
  g.id as goal_id,
  g.title as goal_title,
  g.goal_type,
  g.progress_percentage,
  g.ideal_path,
  CASE
    WHEN g.progress_percentage < 25 THEN 'starting'
    WHEN g.progress_percentage < 75 THEN 'progressing'
    ELSE 'finishing'
  END as goal_phase,
  (
    SELECT COUNT(*)
    FROM time_blocks tb
    WHERE tb.goal_id = g.id
    AND tb.scheduled_date >= CURRENT_DATE
    AND tb.status = 'scheduled'
  ) as scheduled_blocks_count,
  (
    SELECT MAX(tb.scheduled_date)
    FROM time_blocks tb
    WHERE tb.goal_id = g.id
    AND tb.status IN ('completed', 'in-progress')
  ) as last_worked_date
FROM goals g
WHERE g.is_active = true
AND g.progress_percentage < 100;

COMMENT ON VIEW next_recommended_actions IS 'View auxiliar para Coach IA identificar próximas ações por objetivo';