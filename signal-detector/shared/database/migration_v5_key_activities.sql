-- migration_v5_key_activities.sql
-- Adiciona a tabela para o Plano de Ação (Atividades-Chave)

CREATE TABLE key_activities (
  id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 10),
  effort INTEGER NOT NULL CHECK (effort BETWEEN 1 AND 10),
  status TEXT CHECK (status IN ('pending', 'completed')) NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_key_activities_goal_id ON key_activities(goal_id);
