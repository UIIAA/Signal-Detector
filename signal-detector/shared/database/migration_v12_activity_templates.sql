-- migration_v12_activity_templates.sql
-- Adiciona sistema de templates de atividades e objetivos

-- Tabela de templates de atividades
CREATE TABLE IF NOT EXISTS activity_templates (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('career', 'learning', 'health', 'relationships', 'finance', 'personal-growth', 'side-project', 'general')),
  impact_estimate INTEGER CHECK (impact_estimate >= 1 AND impact_estimate <= 10),
  effort_estimate INTEGER CHECK (effort_estimate >= 1 AND effort_estimate <= 10),
  duration_estimate INTEGER, -- em minutos
  tags TEXT[], -- array de tags para busca
  leverage_score DECIMAL(10,2), -- calculado como (impact / effort) * 10
  use_count INTEGER DEFAULT 0, -- quantas vezes foi usado
  success_rate DECIMAL(5,2), -- % de usuários que completaram com sucesso
  is_ai_suggested BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_templates_category ON activity_templates(category);
CREATE INDEX IF NOT EXISTS idx_activity_templates_leverage ON activity_templates(leverage_score DESC);
CREATE INDEX IF NOT EXISTS idx_activity_templates_tags ON activity_templates USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_activity_templates_active ON activity_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE activity_templates IS 'Templates reutilizáveis de atividades de alta alavancagem';
COMMENT ON COLUMN activity_templates.leverage_score IS 'Score de alavancagem: (impact / effort) * 10';
COMMENT ON COLUMN activity_templates.use_count IS 'Número de vezes que o template foi usado por usuários';
COMMENT ON COLUMN activity_templates.success_rate IS 'Taxa de sucesso: % de usuários que marcaram como concluída com impacto positivo';

-- Tabela de templates de objetivos
CREATE TABLE IF NOT EXISTS goal_templates (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('career', 'learning', 'health', 'relationships', 'finance', 'personal-growth', 'side-project', 'general')),
  goal_type TEXT CHECK (goal_type IN ('short', 'medium', 'long')),
  suggested_activities JSONB, -- Array de activity_template_ids
  reflective_questions JSONB, -- Array de perguntas para ajudar o usuário a refletir
  milestones JSONB, -- Array de milestones sugeridos
  estimated_duration_weeks INTEGER,
  use_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_goal_templates_category ON goal_templates(category);
CREATE INDEX IF NOT EXISTS idx_goal_templates_type ON goal_templates(goal_type);
CREATE INDEX IF NOT EXISTS idx_goal_templates_active ON goal_templates(is_active) WHERE is_active = true;

COMMENT ON TABLE goal_templates IS 'Templates de objetivos comuns com atividades sugeridas';
COMMENT ON COLUMN goal_templates.suggested_activities IS 'Array de IDs de activity_templates recomendados';
COMMENT ON COLUMN goal_templates.reflective_questions IS 'Perguntas para ajudar usuário a personalizar o objetivo';

-- Exemplo de estrutura do campo reflective_questions:
-- [
--   {
--     "question": "Qual é o prazo ideal para você alcançar isso?",
--     "type": "date",
--     "purpose": "Ajustar milestones e timeline"
--   },
--   {
--     "question": "O que você já tentou antes? O que funcionou/não funcionou?",
--     "type": "text",
--     "purpose": "Evitar repetir erros passados"
--   },
--   {
--     "question": "Quem pode te apoiar neste objetivo?",
--     "type": "text",
--     "purpose": "Identificar rede de suporte"
--   }
-- ]

-- Tabela de relação entre usuários e templates usados
CREATE TABLE IF NOT EXISTS user_template_usage (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL, -- pode ser activity_template ou goal_template
  template_type TEXT NOT NULL CHECK (template_type IN ('activity', 'goal')),
  activity_id TEXT REFERENCES activities(id) ON DELETE CASCADE, -- se foi usado para criar atividade
  goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE, -- se foi usado para criar objetivo
  customizations JSONB, -- modificações feitas pelo usuário
  outcome TEXT CHECK (outcome IN ('completed', 'abandoned', 'in_progress')),
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  feedback TEXT,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_template_usage_user ON user_template_usage(user_id, used_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_template_usage_template ON user_template_usage(template_id, template_type);
CREATE INDEX IF NOT EXISTS idx_user_template_usage_outcome ON user_template_usage(outcome);

COMMENT ON TABLE user_template_usage IS 'Rastreamento de uso de templates por usuários para melhorar recomendações';
COMMENT ON COLUMN user_template_usage.customizations IS 'JSON com as modificações feitas pelo usuário ao aplicar o template';
COMMENT ON COLUMN user_template_usage.satisfaction_rating IS 'Avaliação do usuário sobre o template (1-5 estrelas)';

-- Tabela de substituições inteligentes sugeridas
CREATE TABLE IF NOT EXISTS smart_substitutions (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_activity_id TEXT REFERENCES activities(id) ON DELETE CASCADE,
  original_description TEXT NOT NULL,
  original_impact INTEGER,
  original_effort INTEGER,
  original_duration INTEGER,
  suggested_template_id TEXT REFERENCES activity_templates(id),
  suggested_activity JSONB NOT NULL, -- Template completo sugerido
  reasoning TEXT, -- Por que esta substituição foi sugerida
  improvement_potential DECIMAL(10,2), -- Quanto de melhoria de eficiência (em pontos)
  user_action TEXT CHECK (user_action IN ('accepted', 'rejected', 'ignored', 'pending')) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_smart_substitutions_user ON smart_substitutions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_substitutions_pending ON smart_substitutions(user_id) WHERE user_action = 'pending';
CREATE INDEX IF NOT EXISTS idx_smart_substitutions_original ON smart_substitutions(original_activity_id);

COMMENT ON TABLE smart_substitutions IS 'Histórico de substituições inteligentes sugeridas';
COMMENT ON COLUMN smart_substitutions.improvement_potential IS 'Ganho estimado de eficiência em pontos';
COMMENT ON COLUMN smart_substitutions.reasoning IS 'Explicação de por que a substituição foi sugerida';

-- View para estatísticas de templates mais efetivos
CREATE OR REPLACE VIEW template_effectiveness AS
SELECT
  at.id,
  at.title,
  at.category,
  at.leverage_score,
  at.use_count,
  COUNT(utu.id) as total_uses,
  COUNT(CASE WHEN utu.outcome = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN utu.satisfaction_rating >= 4 THEN 1 END) as high_satisfaction_count,
  ROUND(
    COUNT(CASE WHEN utu.outcome = 'completed' THEN 1 END)::DECIMAL /
    NULLIF(COUNT(utu.id), 0) * 100,
    2
  ) as completion_rate
FROM activity_templates at
LEFT JOIN user_template_usage utu ON at.id = utu.template_id AND utu.template_type = 'activity'
GROUP BY at.id, at.title, at.category, at.leverage_score, at.use_count;

COMMENT ON VIEW template_effectiveness IS 'Métricas de efetividade dos templates baseadas em uso real';