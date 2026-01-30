-- Migration v15: Kanban Tasks
-- Sistema de tarefas com classificação SINAL/RUÍDO integrada
-- Autor: Claude AI
-- Data: 2026-01-29

-- Tabela de tarefas do Kanban
CREATE TABLE IF NOT EXISTS kanban_tasks (
    id TEXT PRIMARY KEY DEFAULT encode(gen_random_bytes(16), 'hex'),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Dados básicos
    titulo TEXT NOT NULL,
    descricao TEXT,
    projeto TEXT NOT NULL DEFAULT 'PESSOAL',
    categoria TEXT DEFAULT 'Geral',

    -- Status e prioridade
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'progress', 'done')),
    prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('alta', 'media', 'baixa')),

    -- Classificação SINAL/RUÍDO
    gera_receita BOOLEAN DEFAULT FALSE,
    urgente BOOLEAN DEFAULT FALSE,
    importante BOOLEAN DEFAULT FALSE,
    impacto INTEGER DEFAULT 5 CHECK (impacto >= 1 AND impacto <= 10),
    esforco INTEGER DEFAULT 5 CHECK (esforco >= 1 AND esforco <= 10),

    -- Classificação calculada pela IA
    signal_score INTEGER DEFAULT 50 CHECK (signal_score >= 0 AND signal_score <= 100),
    classificacao TEXT DEFAULT 'NEUTRO' CHECK (classificacao IN ('SINAL', 'NEUTRO', 'RUÍDO')),
    reasoning TEXT,

    -- Datas
    data_prevista DATE,
    data_conclusao TIMESTAMP,

    -- Metadados
    ordem INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_user_id ON kanban_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_status ON kanban_tasks(status);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_projeto ON kanban_tasks(projeto);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_classificacao ON kanban_tasks(classificacao);
CREATE INDEX IF NOT EXISTS idx_kanban_tasks_user_status ON kanban_tasks(user_id, status) WHERE is_active = TRUE;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_kanban_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_kanban_tasks_updated_at ON kanban_tasks;
CREATE TRIGGER trigger_kanban_tasks_updated_at
    BEFORE UPDATE ON kanban_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_kanban_tasks_updated_at();

-- Comentários
COMMENT ON TABLE kanban_tasks IS 'Tarefas do Kanban com classificação SINAL/RUÍDO';
COMMENT ON COLUMN kanban_tasks.signal_score IS 'Score 0-100 calculado: >=60 SINAL, 30-59 NEUTRO, <30 RUÍDO';
COMMENT ON COLUMN kanban_tasks.impacto IS 'Impacto esperado 1-10 (quanto maior, mais importante)';
COMMENT ON COLUMN kanban_tasks.esforco IS 'Esforço necessário 1-10 (quanto menor, melhor alavancagem)';
