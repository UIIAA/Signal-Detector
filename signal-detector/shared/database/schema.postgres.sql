-- PostgreSQL schema for Signal vs Noise Detector
-- Translated from SQLite

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Goals table
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value REAL DEFAULT 0,
  current_value REAL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  goal_type TEXT CHECK (goal_type IN ('short', 'medium', 'long')) DEFAULT 'short',
  ai_suggested BOOLEAN DEFAULT false
);

-- Activities table
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  
  -- Input Data
  description TEXT NOT NULL,
  duration_minutes INTEGER,
  energy_before INTEGER CHECK (energy_before BETWEEN 1 AND 10),
  energy_after INTEGER CHECK (energy_after BETWEEN 1 AND 10),
  
  -- CORE: Signal Classification
  signal_score INTEGER CHECK (signal_score BETWEEN 0 AND 100),
  classification TEXT CHECK (classification IN ('SINAL', 'RUÍDO', 'NEUTRO')),
  confidence_score REAL CHECK (confidence_score BETWEEN 0 AND 1),
  reasoning TEXT,
  classification_method TEXT, -- 'rules', 'ai', 'manual'
  
  -- Voice Support
  voice_file_path TEXT,
  transcription TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coaching Sessions table
CREATE TABLE coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
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
CREATE TABLE user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  pattern_type TEXT, -- 'procrastination', 'perfectionism', 'scattered_focus'
  confidence_score REAL CHECK (confidence_score BETWEEN 0 AND 1),
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Supporting data as JSON string
  supporting_data TEXT
);

-- Analytics Cache table
CREATE TABLE analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  cache_key TEXT NOT NULL,
  cache_data TEXT NOT NULL, -- JSON string
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_activities_user_date ON activities(user_id, created_at DESC);
CREATE INDEX idx_activities_signal_score ON activities(user_id, signal_score DESC);
CREATE INDEX idx_coaching_sessions_user ON coaching_sessions(user_id, created_at DESC);
CREATE INDEX idx_user_patterns_type ON user_patterns(user_id, pattern_type);
CREATE INDEX idx_analytics_cache_key ON analytics_cache(user_id, cache_key);
