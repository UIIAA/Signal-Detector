-- PostgreSQL schema for Signal vs Noise Detector
-- Complete schema with all migrations applied
-- Optimized for Vercel PostgreSQL deployment

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Goals table with framework support
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  target_value REAL DEFAULT 0,
  current_value REAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  goal_type TEXT CHECK (goal_type IN ('short', 'medium', 'long')) DEFAULT 'short',
  ai_suggested BOOLEAN DEFAULT false,
  framework_type TEXT CHECK (framework_type IN ('none', 'okr', 'atomic_habits', 'eisenhower')) DEFAULT 'none'
);

-- Framework items table (for OKR key results, habits, etc.)
CREATE TABLE IF NOT EXISTS framework_items (
  id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'key_result', 'habit', 'important_not_urgent'
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  target_value REAL DEFAULT 0,
  current_value REAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Key activities table
CREATE TABLE IF NOT EXISTS key_activities (
  id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
  goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  importance_score INTEGER CHECK (importance_score BETWEEN 1 AND 10) DEFAULT 5,
  difficulty_score INTEGER CHECK (difficulty_score BETWEEN 1 AND 10) DEFAULT 5,
  leverage_score INTEGER CHECK (leverage_score BETWEEN 1 AND 10) DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
  user_id TEXT NOT NULL DEFAULT 'default-user',
  goal_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
  key_activity_id TEXT REFERENCES key_activities(id) ON DELETE SET NULL,

  -- Input Data
  description TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  energy_before INTEGER CHECK (energy_before BETWEEN 1 AND 10),
  energy_after INTEGER CHECK (energy_after BETWEEN 1 AND 10),

  -- CORE: Signal Classification
  signal_score INTEGER CHECK (signal_score BETWEEN 0 AND 100),
  classification TEXT CHECK (classification IN ('SINAL', 'RUÍDO', 'NEUTRO')),
  confidence_score REAL CHECK (confidence_score BETWEEN 0 AND 1),
  reasoning TEXT,
  classification_method TEXT DEFAULT 'manual', -- 'rules', 'ai', 'manual'

  -- Progress tracking
  progress_percentage REAL CHECK (progress_percentage BETWEEN 0 AND 100) DEFAULT 0,

  -- Voice Support
  voice_file_path TEXT,
  transcription TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coaching Sessions table
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
  user_id TEXT NOT NULL DEFAULT 'default-user',

  -- PNL Coaching Core
  nlp_technique TEXT NOT NULL, -- 'modal_operator_challenge', 'generalization_challenge', etc
  coaching_question TEXT NOT NULL,
  user_response TEXT,

  -- Outcomes
  insights_generated TEXT, -- JSON array as string
  breakthrough_detected BOOLEAN DEFAULT false,
  user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 10),

  -- Follow-up
  next_session_recommended TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Patterns table
CREATE TABLE IF NOT EXISTS user_patterns (
  id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
  user_id TEXT NOT NULL DEFAULT 'default-user',

  pattern_type TEXT, -- 'procrastination', 'perfectionism', 'scattered_focus'
  confidence_score REAL CHECK (confidence_score BETWEEN 0 AND 1),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Supporting data as JSON string
  supporting_data TEXT
);

-- Analytics Cache table
CREATE TABLE IF NOT EXISTS analytics_cache (
  id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
  user_id TEXT NOT NULL DEFAULT 'default-user',

  cache_key TEXT NOT NULL,
  cache_data TEXT NOT NULL, -- JSON string
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_user_type ON goals(user_id, goal_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_framework_items_goal_id ON framework_items(goal_id);
CREATE INDEX IF NOT EXISTS idx_key_activities_goal_id ON key_activities(goal_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_signal_score ON activities(user_id, signal_score DESC);
CREATE INDEX IF NOT EXISTS idx_activities_goal_id ON activities(goal_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_user ON coaching_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_patterns_type ON user_patterns(user_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_key ON analytics_cache(user_id, cache_key);

-- Insert default user if not exists
INSERT INTO users (id, email, name)
SELECT 'default-user', 'default@signaldetector.com', 'Default User'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 'default-user');

-- Sample data for development/testing
INSERT INTO goals (id, user_id, title, description, goal_type, ai_suggested) VALUES
  ('sample-short-1', 'default-user', 'Aprender Next.js', 'Concluir curso online de Next.js e desenvolver primeiro projeto', 'short', false),
  ('sample-medium-1', 'default-user', 'Aumentar vendas em 20%', 'Implementar estratégias de marketing digital para aumentar receita', 'medium', false),
  ('sample-long-1', 'default-user', 'Abrir minha empresa', 'Desenvolver plano de negócios e lançar startup de tecnologia', 'long', false)
ON CONFLICT (id) DO NOTHING;