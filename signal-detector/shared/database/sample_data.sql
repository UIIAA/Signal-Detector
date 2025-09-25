-- Sample data for testing dashboard

-- Insert a default user
INSERT OR IGNORE INTO users (id, email, name) VALUES ('default-user', 'user@test.com', 'Usuário Teste');

-- Insert sample goals with progress
INSERT OR IGNORE INTO goals (id, user_id, title, description, goal_type, progress_percentage, ai_suggested) VALUES
('goal-1', 'default-user', 'Aprender React Avançado', 'Dominar hooks, context e performance', 'short', 75, 0),
('goal-2', 'default-user', 'Melhorar Produtividade', 'Otimizar rotina de trabalho e foco', 'medium', 45, 1),
('goal-3', 'default-user', 'Carreira em Tech', 'Transição para desenvolvedor sênior', 'long', 20, 0),
('goal-4', 'default-user', 'Estudar Next.js', 'Aprender framework completo', 'short', 90, 1),
('goal-5', 'default-user', 'Projeto Pessoal', 'Criar aplicativo de produtividade', 'medium', 60, 0);

-- Insert sample activities
INSERT OR IGNORE INTO activities (id, user_id, description, duration_minutes, energy_before, energy_after, signal_score, classification, confidence_score, reasoning, classification_method) VALUES
('act-1', 'default-user', 'Estudei React hooks por 2 horas', 120, 7, 8, 85, 'SINAL', 0.9, 'Atividade de aprendizado diretamente relacionada aos objetivos de desenvolvimento', 'ai'),
('act-2', 'default-user', 'Navegei redes sociais sem propósito', 45, 6, 4, 15, 'RUÍDO', 0.85, 'Atividade distrativa sem contribuição para objetivos', 'ai'),
('act-3', 'default-user', 'Codifiquei componente do projeto', 90, 8, 9, 92, 'SINAL', 0.95, 'Desenvolvimento prático aplicando conhecimentos', 'ai'),
('act-4', 'default-user', 'Li documentação do Next.js', 60, 7, 7, 80, 'SINAL', 0.88, 'Estudo focado em tecnologia relevante', 'ai'),
('act-5', 'default-user', 'Assisti vídeos aleatórios no YouTube', 30, 5, 3, 10, 'RUÍDO', 0.92, 'Consumo passivo sem valor agregado', 'ai'),
('act-6', 'default-user', 'Planejei arquitetura do projeto', 45, 8, 8, 88, 'SINAL', 0.9, 'Planejamento estratégico para objetivos', 'ai'),
('act-7', 'default-user', 'Fiz exercícios e meditação', 40, 6, 9, 65, 'NEUTRO', 0.8, 'Atividade de bem-estar, indiretamente produtiva', 'ai'),
('act-8', 'default-user', 'Revisei código e refatorei', 75, 7, 8, 87, 'SINAL', 0.89, 'Melhoria de qualidade do código', 'ai');

-- Link activities to goals
INSERT OR IGNORE INTO activity_goals (activity_id, goal_id) VALUES
('act-1', 'goal-1'),
('act-3', 'goal-1'),
('act-3', 'goal-5'),
('act-4', 'goal-4'),
('act-6', 'goal-5'),
('act-8', 'goal-1'),
('act-8', 'goal-5');