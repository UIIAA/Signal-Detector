-- migration_v4_leverage_system.sql
-- Adiciona suporte para o Sistema de Alavancagem (Impacto vs. Esforço)

ALTER TABLE activities
ADD COLUMN impact INTEGER NOT NULL DEFAULT 5;

ALTER TABLE activities
ADD COLUMN effort INTEGER NOT NULL DEFAULT 5;

-- O valor padrão 5 é um ponto de partida neutro.
-- A aplicação pode, no futuro, incentivar o usuário a reavaliar atividades antigas.
