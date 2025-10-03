-- migration_v11_efficiency_metrics.sql
-- Adiciona suporte para métricas de eficiência e custo de oportunidade

-- Tabela para histórico de eficiência de atividades
CREATE TABLE IF NOT EXISTS efficiency_history (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  efficiency_score DECIMAL(10,2) NOT NULL,
  opportunity_cost DECIMAL(10,2),
  rank_position INTEGER, -- Posição no ranking quando calculado
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_efficiency_history_user ON efficiency_history(user_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_efficiency_history_activity ON efficiency_history(activity_id);
CREATE INDEX IF NOT EXISTS idx_efficiency_history_score ON efficiency_history(user_id, efficiency_score DESC);

COMMENT ON TABLE efficiency_history IS 'Histórico de cálculos de eficiência para análises temporais';
COMMENT ON COLUMN efficiency_history.efficiency_score IS 'Pontos de eficiência calculados: (Impacto × 2) / Tempo em horas';
COMMENT ON COLUMN efficiency_history.opportunity_cost IS 'Custo de oportunidade em pontos (diferença para melhor atividade possível)';

-- Tabela para alertas de custo de oportunidade apresentados ao usuário
CREATE TABLE IF NOT EXISTS opportunity_cost_alerts (
  id TEXT PRIMARY KEY DEFAULT (encode(gen_random_bytes(16), 'hex')),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  opportunity_cost DECIMAL(10,2) NOT NULL,
  alternative_suggestions JSONB, -- Array de atividades alternativas sugeridas
  user_action TEXT CHECK (user_action IN ('accepted', 'dismissed', 'pending', 'viewed')) DEFAULT 'pending',
  feedback TEXT, -- Feedback do usuário sobre o alerta
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acted_at TIMESTAMP -- Quando o usuário tomou ação
);

CREATE INDEX IF NOT EXISTS idx_opportunity_alerts_user ON opportunity_cost_alerts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_alerts_pending ON opportunity_cost_alerts(user_id) WHERE user_action = 'pending';
CREATE INDEX IF NOT EXISTS idx_opportunity_alerts_activity ON opportunity_cost_alerts(activity_id);

COMMENT ON TABLE opportunity_cost_alerts IS 'Alertas de custo de oportunidade mostrados ao usuário';
COMMENT ON COLUMN opportunity_cost_alerts.alternative_suggestions IS 'JSON array com atividades alternativas de maior eficiência sugeridas';
COMMENT ON COLUMN opportunity_cost_alerts.user_action IS 'Ação do usuário: accepted (aceitou sugestão), dismissed (dispensou), pending (ainda não viu), viewed (apenas visualizou)';

-- Exemplo de estrutura do campo alternative_suggestions:
-- [
--   {
--     "title": "Estudo para Certificação",
--     "impact": 9,
--     "effort": 2,
--     "duration_estimate": 60,
--     "efficiency_score": 18,
--     "reasoning": "Alta eficiência, contribui diretamente para objetivo principal"
--   },
--   {
--     "title": "Café 30min com gestor direto",
--     "impact": 9,
--     "effort": 1,
--     "duration_estimate": 30,
--     "efficiency_score": 36,
--     "reasoning": "Impacto direto, tempo mínimo"
--   }
-- ]

-- View para facilitar consultas de eficiência por período
CREATE OR REPLACE VIEW efficiency_stats_by_period AS
SELECT
  eh.user_id,
  DATE_TRUNC('week', eh.calculated_at) as period_start,
  COUNT(*) as total_activities,
  AVG(eh.efficiency_score) as avg_efficiency,
  MAX(eh.efficiency_score) as max_efficiency,
  MIN(eh.efficiency_score) as min_efficiency,
  SUM(CASE WHEN eh.efficiency_score >= 10 THEN 1 ELSE 0 END) as high_efficiency_count,
  SUM(CASE WHEN eh.efficiency_score < 5 THEN 1 ELSE 0 END) as low_efficiency_count
FROM efficiency_history eh
GROUP BY eh.user_id, DATE_TRUNC('week', eh.calculated_at);

COMMENT ON VIEW efficiency_stats_by_period IS 'Estatísticas de eficiência agregadas por semana para análises';