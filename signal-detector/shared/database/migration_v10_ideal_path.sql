-- migration_v10_ideal_path.sql
-- Adiciona suporte para Rota Ideal vs Progresso Real

-- Adicionar campo ideal_path na tabela goals
ALTER TABLE goals ADD COLUMN IF NOT EXISTS ideal_path JSONB;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS ideal_path_created_at TIMESTAMP;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS ideal_path_updated_at TIMESTAMP;

-- Índice para consultas de goals com rota ideal definida
CREATE INDEX IF NOT EXISTS idx_goals_ideal_path ON goals ((ideal_path IS NOT NULL));

-- Comentários para documentação
COMMENT ON COLUMN goals.ideal_path IS 'JSON com atividades planejadas, milestones e timeline da rota crítica';
COMMENT ON COLUMN goals.ideal_path_created_at IS 'Data de criação da rota ideal';
COMMENT ON COLUMN goals.ideal_path_updated_at IS 'Data da última atualização da rota ideal';

-- Exemplo de estrutura do campo ideal_path:
-- {
--   "activities": [
--     {
--       "id": "activity-1",
--       "title": "Buscar feedback formal do gestor",
--       "description": "Agendar 1:1 para discussão de performance",
--       "impact": 9,
--       "effort": 2,
--       "deadline": "2025-10-15",
--       "status": "pending",
--       "order": 1
--     },
--     {
--       "id": "activity-2",
--       "title": "Liderar apresentação importante",
--       "description": "Preparar e apresentar para stakeholders",
--       "impact": 8,
--       "effort": 6,
--       "deadline": "2025-10-30",
--       "status": "pending",
--       "order": 2
--     }
--   ],
--   "milestones": [
--     {
--       "percentage": 25,
--       "date": "2025-10-15",
--       "description": "Primeira atividade completa"
--     },
--     {
--       "percentage": 50,
--       "date": "2025-11-01",
--       "description": "Metade da rota concluída"
--     },
--     {
--       "percentage": 100,
--       "date": "2025-12-31",
--       "description": "Objetivo alcançado"
--     }
--   ],
--   "metadata": {
--     "ai_generated": true,
--     "confidence_score": 0.85,
--     "based_on_templates": ["career-promotion"]
--   }
-- }