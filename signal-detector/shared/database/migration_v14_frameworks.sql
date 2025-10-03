-- migration_v14_frameworks.sql
-- Suporte para diferentes frameworks de produtividade (OKR, Habits, SMART, Getting Things Done)

-- Adicionar coluna de framework type na tabela goals (se ainda não existir)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS framework_type TEXT CHECK (framework_type IN ('none', 'okr', 'smart', 'habits', 'gtd', 'custom'));
ALTER TABLE goals ADD COLUMN IF NOT EXISTS framework_data JSONB;

-- Índices
CREATE INDEX IF NOT EXISTS idx_goals_framework ON goals(framework_type) WHERE framework_type IS NOT NULL;

COMMENT ON COLUMN goals.framework_type IS 'Framework de produtividade aplicado: okr, smart, habits, gtd, custom';
COMMENT ON COLUMN goals.framework_data IS 'Dados específicos do framework escolhido em formato JSON';

-- Tabela de Key Results (para framework OKR)
CREATE TABLE IF NOT EXISTS key_results (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,

  -- Métricas
  metric_type TEXT CHECK (metric_type IN ('number', 'percentage', 'boolean', 'currency')) DEFAULT 'number',
  target_value DECIMAL(15,2) NOT NULL,
  current_value DECIMAL(15,2) DEFAULT 0,
  initial_value DECIMAL(15,2) DEFAULT 0,
  unit TEXT, -- '%', 'R$', 'users', 'hours', etc

  -- Progress
  progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN target_value = initial_value THEN 0
      WHEN metric_type = 'boolean' THEN CASE WHEN current_value >= target_value THEN 100 ELSE 0 END
      ELSE LEAST(100, GREATEST(0, ((current_value - initial_value) / NULLIF(target_value - initial_value, 0)) * 100))
    END
  ) STORED,

  status TEXT CHECK (status IN ('not-started', 'at-risk', 'on-track', 'completed')) DEFAULT 'not-started',
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 5), -- 1=baixa, 5=alta

  -- Timing
  start_date DATE,
  target_date DATE,
  completed_date DATE,

  -- Tracking
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_frequency TEXT CHECK (update_frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'weekly',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_key_results_goal ON key_results(goal_id);
CREATE INDEX IF NOT EXISTS idx_key_results_user ON key_results(user_id);
CREATE INDEX IF NOT EXISTS idx_key_results_status ON key_results(user_id, status);

COMMENT ON TABLE key_results IS 'Key Results para framework OKR - métricas quantificáveis para objetivos';
COMMENT ON COLUMN key_results.confidence_level IS 'Confiança na capacidade de atingir (1-5)';
COMMENT ON COLUMN key_results.progress_percentage IS 'Calculado automaticamente baseado em current_value e target_value';

-- Tabela de Hábitos (para framework de Hábitos)
CREATE TABLE IF NOT EXISTS habits (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,

  -- Configuração do hábito
  habit_type TEXT CHECK (habit_type IN ('build', 'break', 'maintain')) DEFAULT 'build', -- construir, quebrar, manter
  frequency_type TEXT CHECK (frequency_type IN ('daily', 'weekly', 'custom')) DEFAULT 'daily',
  target_days_per_week INTEGER DEFAULT 7,
  target_streak INTEGER, -- meta de dias consecutivos

  -- Timing
  preferred_time_of_day TEXT CHECK (preferred_time_of_day IN ('morning', 'afternoon', 'evening', 'any')) DEFAULT 'any',
  estimated_duration INTEGER, -- minutos

  -- Tracking
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_completions INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),

  -- Cue e Reward (Habit Loop)
  cue TEXT, -- gatilho que dispara o hábito
  reward TEXT, -- recompensa ao completar

  -- Status
  is_active BOOLEAN DEFAULT true,
  paused_until DATE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habits_goal ON habits(goal_id);

COMMENT ON TABLE habits IS 'Sistema de rastreamento de hábitos com streak e success rate';
COMMENT ON COLUMN habits.habit_type IS 'build (construir novo), break (quebrar ruim), maintain (manter existente)';
COMMENT ON COLUMN habits.cue IS 'Gatilho/trigger do hábito (ex: "após café da manhã")';

-- Tabela de check-ins de hábitos
CREATE TABLE IF NOT EXISTS habit_checkins (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  completed BOOLEAN NOT NULL,
  notes TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5), -- quão difícil foi
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(habit_id, checkin_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_checkins_habit ON habit_checkins(habit_id, checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_habit_checkins_user ON habit_checkins(user_id, checkin_date DESC);

COMMENT ON TABLE habit_checkins IS 'Registro diário de execução de hábitos';

-- Tabela de Ações do GTD (Getting Things Done)
CREATE TABLE IF NOT EXISTS gtd_actions (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- GTD Context
  context TEXT, -- '@computer', '@home', '@errands', '@phone', etc
  gtd_list TEXT CHECK (gtd_list IN ('inbox', 'next-actions', 'waiting-for', 'someday-maybe', 'projects', 'reference')) DEFAULT 'inbox',

  -- Priority e Timing
  is_next_action BOOLEAN DEFAULT false,
  energy_required TEXT CHECK (energy_required IN ('low', 'medium', 'high')) DEFAULT 'medium',
  time_required INTEGER, -- minutos estimados

  -- Status
  status TEXT CHECK (status IN ('inbox', 'actionable', 'waiting', 'done', 'archived')) DEFAULT 'inbox',
  waiting_for TEXT, -- se status = 'waiting', quem/o que está aguardando

  -- Datas
  due_date DATE,
  defer_until DATE, -- não mostrar até esta data
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gtd_actions_user ON gtd_actions(user_id, gtd_list);
CREATE INDEX IF NOT EXISTS idx_gtd_actions_context ON gtd_actions(user_id, context) WHERE context IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gtd_actions_next ON gtd_actions(user_id) WHERE is_next_action = true;

COMMENT ON TABLE gtd_actions IS 'Ações organizadas segundo metodologia Getting Things Done';
COMMENT ON COLUMN gtd_actions.context IS 'Contexto onde ação pode ser realizada (@computer, @home, etc)';
COMMENT ON COLUMN gtd_actions.gtd_list IS 'Lista GTD: inbox, next-actions, waiting-for, someday-maybe, projects';

-- Tabela de Critérios SMART
CREATE TABLE IF NOT EXISTS smart_criteria (
  goal_id TEXT PRIMARY KEY REFERENCES goals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- S - Specific
  specific_description TEXT NOT NULL,

  -- M - Measurable
  measurable_metric TEXT NOT NULL,
  measurement_method TEXT,
  target_number DECIMAL(15,2),
  target_unit TEXT,

  -- A - Achievable
  achievable_why TEXT,
  resources_needed TEXT[],
  skills_required TEXT[],

  -- R - Relevant
  relevant_why TEXT,
  aligned_with TEXT, -- objetivos maiores/missão pessoal

  -- T - Time-bound
  deadline DATE NOT NULL,
  milestones_dates JSONB, -- array de {date, description}

  -- Tracking
  verified_at TIMESTAMP,
  verification_notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_smart_criteria_user ON smart_criteria(user_id);

COMMENT ON TABLE smart_criteria IS 'Critérios SMART estruturados para objetivos';
COMMENT ON COLUMN smart_criteria.resources_needed IS 'Recursos necessários (tempo, dinheiro, pessoas, ferramentas)';

-- View agregada de progresso de frameworks
CREATE OR REPLACE VIEW framework_progress_summary AS
SELECT
  g.id as goal_id,
  g.user_id,
  g.title as goal_title,
  g.framework_type,
  g.progress_percentage as goal_progress,
  CASE g.framework_type
    WHEN 'okr' THEN (
      SELECT json_build_object(
        'total_krs', COUNT(*),
        'completed_krs', COUNT(*) FILTER (WHERE kr.status = 'completed'),
        'avg_confidence', ROUND(AVG(kr.confidence_level), 2),
        'on_track_krs', COUNT(*) FILTER (WHERE kr.status = 'on-track')
      )
      FROM key_results kr WHERE kr.goal_id = g.id
    )::TEXT
    WHEN 'habits' THEN (
      SELECT json_build_object(
        'total_habits', COUNT(*),
        'active_habits', COUNT(*) FILTER (WHERE h.is_active = true),
        'avg_success_rate', ROUND(AVG(h.success_rate), 2),
        'longest_streak', MAX(h.longest_streak)
      )
      FROM habits h WHERE h.goal_id = g.id
    )::TEXT
    WHEN 'gtd' THEN (
      SELECT json_build_object(
        'total_actions', COUNT(*),
        'next_actions', COUNT(*) FILTER (WHERE gtd.is_next_action = true),
        'completed', COUNT(*) FILTER (WHERE gtd.status = 'done'),
        'waiting', COUNT(*) FILTER (WHERE gtd.status = 'waiting')
      )
      FROM gtd_actions gtd WHERE gtd.goal_id = g.id
    )::TEXT
    ELSE NULL
  END as framework_metrics
FROM goals g
WHERE g.framework_type IS NOT NULL;

COMMENT ON VIEW framework_progress_summary IS 'Resumo consolidado de progresso por framework aplicado';