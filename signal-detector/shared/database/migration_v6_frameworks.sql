-- migration_v6_frameworks.sql
-- Adiciona suporte para Frameworks de Produtividade (OKR, Hábitos Atômicos, etc)

-- Adiciona um tipo de framework à tabela de objetivos
ALTER TABLE goals
ADD COLUMN framework_type TEXT CHECK (framework_type IN ('none', 'okr', 'atomic_habits', 'eisenhower')) NOT NULL DEFAULT 'none';

-- Cria uma tabela para os itens específicos de cada framework (ex: Key Results para OKR)
CREATE TABLE framework_items (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- ex: 'key_result', 'habit', 'important_not_urgent'
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) NOT NULL DEFAULT 'pending',
  target_value REAL,
  current_value REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_framework_items_goal_id ON framework_items(goal_id);
