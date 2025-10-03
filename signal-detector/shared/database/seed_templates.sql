-- seed_templates.sql
-- Popula banco com templates de atividades e objetivos de alta alavancagem

-- ==========================================
-- TEMPLATES DE ATIVIDADES (50+ templates)
-- ==========================================

-- CARREIRA (Career)
INSERT INTO activity_templates (title, description, category, impact_estimate, effort_estimate, duration_estimate, leverage_score, tags) VALUES
('Pedir feedback formal ao gestor', 'Agendar 1:1 para discussão estruturada de performance e desenvolvimento', 'career', 9, 2, 45, 45.0, ARRAY['feedback', 'gestor', '1:1', 'carreira']),
('Apresentar para stakeholders sêniores', 'Preparar e entregar apresentação para liderança sobre projeto estratégico', 'career', 9, 6, 180, 15.0, ARRAY['apresentação', 'visibilidade', 'liderança']),
('Café informal com líder de outra área', 'Networking interno: conhecer líderes fora do seu time', 'career', 8, 1, 30, 80.0, ARRAY['networking', 'relacionamento', 'carreira']),
('Documentar conquista recente', 'Escrever brag document com métricas de impacto de projeto finalizado', 'career', 7, 2, 60, 35.0, ARRAY['documentação', 'performance', 'métricas']),
('Oferecer mentoria para júnior', 'Iniciar mentoria regular com desenvolvedor júnior do time', 'career', 8, 3, 90, 26.7, ARRAY['mentoria', 'liderança', 'desenvolvimento']),
('Liderar reunião de planejamento', 'Facilitar sessão de planning ou retrospectiva do time', 'career', 7, 3, 90, 23.3, ARRAY['liderança', 'facilitação', 'planning']),
('Propor melhoria de processo', 'Apresentar proposta documentada de otimização de workflow', 'career', 8, 4, 120, 20.0, ARRAY['processo', 'eficiência', 'proposta']),
('Participar de painel ou podcast', 'Aceitar convite para falar publicamente sobre sua expertise', 'career', 9, 5, 120, 18.0, ARRAY['visibilidade', 'marca-pessoal', 'expertise']),
('Revisar código de colega sênior', 'Code review detalhado em PR complexo de desenvolvedor mais experiente', 'career', 6, 2, 45, 30.0, ARRAY['code-review', 'aprendizado', 'qualidade']),
('Buscar projeto de impacto estratégico', 'Identificar e se voluntariar para iniciativa de alta visibilidade', 'career', 9, 3, 60, 30.0, ARRAY['projeto', 'estratégia', 'visibilidade']),

-- APRENDIZADO (Learning)
('Completar módulo específico de curso online', 'Focar em 1 módulo prático de curso relevante para objetivo', 'learning', 7, 3, 90, 23.3, ARRAY['curso', 'estudo', 'online']),
('Implementar tutorial prático hands-on', 'Seguir tutorial técnico e construir projeto funcional', 'learning', 8, 4, 120, 20.0, ARRAY['tutorial', 'prática', 'hands-on']),
('Ler artigo técnico de referência', 'Estudar paper ou artigo foundational sobre tecnologia', 'learning', 6, 2, 45, 30.0, ARRAY['leitura', 'paper', 'fundamentos']),
('Resolver desafio de código', 'Completar 1 problema médio-difícil em plataforma de coding', 'learning', 6, 3, 60, 20.0, ARRAY['coding', 'prática', 'algoritmo']),
('Assistir talk de referência', 'Ver palestra técnica de expert reconhecido na área', 'learning', 5, 1, 45, 50.0, ARRAY['talk', 'conferência', 'video']),
('Ensinar conceito para alguém', 'Explicar conceito técnico para colega ou em blog post', 'learning', 8, 3, 90, 26.7, ARRAY['ensino', 'consolidação', 'mentoria']),
('Fazer anotações estruturadas', 'Criar resumo executivo e mindmap de conteúdo estudado', 'learning', 6, 2, 45, 30.0, ARRAY['anotações', 'síntese', 'revisão']),
('Contribuir para projeto open source', 'Fazer PR pequeno mas útil em repositório relevante', 'learning', 9, 5, 150, 18.0, ARRAY['open-source', 'contribuição', 'prática']),
('Participar de coding workshop', 'Inscrever e completar workshop prático online', 'learning', 7, 4, 180, 17.5, ARRAY['workshop', 'prática', 'networking']),
('Criar flashcards de conceitos', 'Usar spaced repetition para memorizar conceitos-chave', 'learning', 5, 2, 30, 25.0, ARRAY['memorização', 'flashcards', 'revisão']),

-- SAÚDE (Health)
('Treino de 30min alta intensidade', 'HIIT ou treino funcional focado em eficiência', 'health', 8, 4, 30, 20.0, ARRAY['exercício', 'hiit', 'treino']),
('Preparar refeições da semana', 'Meal prep de almoços saudáveis para dias úteis', 'health', 7, 5, 120, 14.0, ARRAY['meal-prep', 'nutrição', 'planejamento']),
('Caminhar 30min ao ar livre', 'Caminhada moderada para movimento e saúde mental', 'health', 6, 2, 30, 30.0, ARRAY['caminhada', 'cardio', 'ar-livre']),
('Sessão de meditação guiada', 'Meditar 15min com app para redução de estresse', 'health', 7, 1, 15, 70.0, ARRAY['meditação', 'mindfulness', 'mental']),
('Consulta com nutricionista', 'Agendar e fazer check-in com profissional de nutrição', 'health', 9, 2, 60, 45.0, ARRAY['nutrição', 'profissional', 'saúde']),
('Estabelecer rotina de sono', 'Definir horários fixos para dormir e acordar', 'health', 9, 3, 30, 30.0, ARRAY['sono', 'rotina', 'hábito']),
('Agendar check-up médico', 'Marcar e fazer exames preventivos anuais', 'health', 8, 2, 90, 40.0, ARRAY['preventivo', 'exames', 'saúde']),
('Yoga ou alongamento', 'Sessão de flexibilidade e mobilidade', 'health', 6, 2, 30, 30.0, ARRAY['yoga', 'flexibilidade', 'mobilidade']),

-- RELACIONAMENTOS (Relationships)
('Jantar sem telas com família', 'Refeição intencional focada em conversa de qualidade', 'relationships', 9, 2, 90, 45.0, ARRAY['família', 'qualidade', 'presença']),
('Ligar para amigo distante', 'Telefonema de verdade (não mensagem) com amigo querido', 'relationships', 8, 1, 30, 80.0, ARRAY['amizade', 'conexão', 'telefonema']),
('Date night planejado', 'Atividade especial planejada com parceiro(a)', 'relationships', 9, 3, 180, 30.0, ARRAY['relacionamento', 'date', 'parceiro']),
('Escrever carta de gratidão', 'Mensagem sincera agradecendo alguém importante', 'relationships', 9, 2, 30, 45.0, ARRAY['gratidão', 'reconhecimento', 'carta']),
('Organizar encontro social', 'Reunir grupo de amigos para atividade conjunta', 'relationships', 7, 4, 180, 17.5, ARRAY['social', 'amigos', 'evento']),
('Conversa difícil necessária', 'Abordar assunto pendente com vulnerabilidade', 'relationships', 9, 6, 60, 15.0, ARRAY['conversa', 'vulnerabilidade', 'conflito']),
('Fazer algo especial para alguém', 'Ato de serviço ou presente pensado para pessoa querida', 'relationships', 8, 3, 90, 26.7, ARRAY['gentileza', 'ato-servico', 'presente']),

-- FINANÇAS (Finance)
('Revisar gastos do mês', 'Analisar extratos e categorizar despesas', 'finance', 8, 2, 45, 40.0, ARRAY['controle', 'gastos', 'análise']),
('Automatizar investimento mensal', 'Configurar aporte automático em investimentos', 'finance', 9, 2, 30, 45.0, ARRAY['investimento', 'automação', 'poupança']),
('Negociar conta ou serviço', 'Ligar para reduzir valor de assinatura ou serviço', 'finance', 8, 2, 30, 40.0, ARRAY['negociação', 'redução-custos', 'economia']),
('Calcular net worth atual', 'Listar ativos e passivos para visão financeira completa', 'finance', 7, 3, 60, 23.3, ARRAY['patrimônio', 'análise', 'planejamento']),
('Estudar nova classe de ativos', 'Pesquisar e entender fundos imobiliários, ações, etc', 'finance', 6, 3, 90, 20.0, ARRAY['estudo', 'investimentos', 'educação-financeira']),
('Revisar seguros necessários', 'Avaliar cobertura de seguro saúde, vida, etc', 'finance', 8, 3, 60, 26.7, ARRAY['seguro', 'proteção', 'planejamento']),
('Pesquisar fonte de renda extra', 'Explorar freelance, consultoria ou projeto paralelo', 'finance', 9, 4, 120, 22.5, ARRAY['renda-extra', 'freelance', 'empreendedorismo']),

-- CRESCIMENTO PESSOAL (Personal Growth)
('Sessão de journaling reflexivo', 'Escrever sobre progresso, aprendizados e sentimentos', 'personal-growth', 7, 2, 30, 35.0, ARRAY['journaling', 'reflexão', 'autoconsciência']),
('Definir 3 prioridades da semana', 'Planejar semana focando em MITs (Most Important Tasks)', 'personal-growth', 8, 2, 30, 40.0, ARRAY['planejamento', 'priorização', 'foco']),
('Sessão de terapia', 'Consulta com psicólogo para desenvolvimento pessoal', 'personal-growth', 9, 2, 60, 45.0, ARRAY['terapia', 'saúde-mental', 'autoconhecimento']),
('Revisar objetivos trimestrais', 'Check-in de progresso em metas de longo prazo', 'personal-growth', 8, 3, 60, 26.7, ARRAY['objetivos', 'revisão', 'metas']),
('Praticar gratidão diária', 'Listar 3 coisas pelas quais sou grato hoje', 'personal-growth', 6, 1, 10, 60.0, ARRAY['gratidão', 'mindset', 'bem-estar']),
('Aprender skill não-técnica', 'Estudar comunicação, liderança, negociação', 'personal-growth', 7, 3, 90, 23.3, ARRAY['soft-skills', 'desenvolvimento', 'liderança']),
('Digital detox de 24h', 'Passar dia sem redes sociais e emails', 'personal-growth', 8, 4, 1440, 2.0, ARRAY['detox', 'foco', 'bem-estar']),

-- PROJETO PESSOAL (Side Project)
('Definir MVP do projeto', 'Escopar versão mínima viável e features essenciais', 'side-project', 9, 3, 90, 30.0, ARRAY['mvp', 'planejamento', 'escopo']),
('Implementar uma feature core', 'Desenvolver funcionalidade central do produto', 'side-project', 8, 6, 240, 13.3, ARRAY['desenvolvimento', 'feature', 'implementação']),
('Buscar primeiros beta testers', 'Recrutar 5-10 pessoas para testar versão inicial', 'side-project', 9, 3, 60, 30.0, ARRAY['beta', 'feedback', 'usuários']),
('Criar landing page', 'Desenvolver página simples para validar interesse', 'side-project', 8, 4, 180, 20.0, ARRAY['landing-page', 'validação', 'marketing']),
('Fazer post sobre progresso', 'Compartilhar jornada publicamente para accountability', 'side-project', 7, 2, 45, 35.0, ARRAY['building-public', 'networking', 'marketing']),
('Configurar analytics básico', 'Implementar tracking de métricas essenciais', 'side-project', 7, 3, 90, 23.3, ARRAY['analytics', 'métricas', 'dados']),
('Conversar com potencial usuário', 'Entrevista qualitativa de 30min sobre problema/solução', 'side-project', 9, 2, 45, 45.0, ARRAY['user-research', 'validação', 'entrevista']);

-- ==========================================
-- TEMPLATES DE OBJETIVOS (20+ templates)
-- ==========================================

-- Carreira
INSERT INTO goal_templates (title, description, category, goal_type, suggested_activities, reflective_questions, milestones, estimated_duration_weeks) VALUES
(
  'Conseguir promoção para nível sênior',
  'Demonstrar capacidades de liderança técnica e impacto estratégico para avançar na carreira',
  'career',
  'medium',
  '[]'::JSONB, -- IDs serão atualizados depois
  '[
    {"question": "Quando é o próximo ciclo de promoções da sua empresa?", "type": "date", "purpose": "Definir deadline realista"},
    {"question": "Quais são os critérios explícitos de promoção no seu nível?", "type": "text", "purpose": "Alinhar ações com expectativas"},
    {"question": "Quem são seus principais stakeholders para essa promoção?", "type": "text", "purpose": "Identificar relacionamentos-chave"}
  ]'::JSONB,
  '[
    {"week": 4, "description": "Feedback formal do gestor recebido e brag document iniciado"},
    {"week": 12, "description": "Projeto de alto impacto liderado com sucesso"},
    {"week": 20, "description": "Visibilidade estabelecida com stakeholders sêniores"},
    {"week": 24, "description": "Promoção oficializada"}
  ]'::JSONB,
  24
),
(
  'Mudar de carreira para Tech',
  'Transição estruturada de área não-técnica para desenvolvimento de software',
  'career',
  'long',
  '[]'::JSONB,
  '[
    {"question": "Você já tem alguma experiência com programação?", "type": "text", "purpose": "Ajustar ponto de partida"},
    {"question": "Qual área de tech te atrai mais? (Frontend, Backend, Data, etc)", "type": "text", "purpose": "Focar estudos"},
    {"question": "Quanto tempo por semana pode dedicar aos estudos?", "type": "number", "purpose": "Calibrar timeline realista"}
  ]'::JSONB,
  '[
    {"week": 12, "description": "Fundamentos de programação dominados (lógica, estruturas de dados)"},
    {"week": 24, "description": "Primeiro projeto pessoal completo no portfolio"},
    {"week": 36, "description": "3+ projetos demonstráveis e primeiras aplicações enviadas"},
    {"week": 52, "description": "Primeira posição tech conquistada"}
  ]'::JSONB,
  52
);

-- Aprendizado
INSERT INTO goal_templates (title, description, category, goal_type, reflective_questions, estimated_duration_weeks) VALUES
(
  'Dominar novo framework/tecnologia',
  'Aprender framework moderno (React, Next.js, etc) até nível de produção',
  'learning',
  'short',
  '[
    {"question": "Qual tecnologia específica você quer aprender?", "type": "text", "purpose": "Definir foco"},
    {"question": "Você tem projeto real para aplicar o aprendizado?", "type": "text", "purpose": "Aumentar retenção com prática"},
    {"question": "Qual seu nível atual com tecnologias similares?", "type": "text", "purpose": "Calibrar dificuldade"}
  ]'::JSONB,
  12
),
(
  'Conquistar certificação técnica',
  'Obter certificação profissional (AWS, GCP, Azure, etc)',
  'learning',
  'medium',
  '[
    {"question": "Qual certificação específica você busca?", "type": "text", "purpose": "Definir currículo de estudos"},
    {"question": "Sua empresa paga ou incentiva certificações?", "type": "text", "purpose": "Aproveitar recursos disponíveis"},
    {"question": "Quando pretende fazer o exame?", "type": "date", "purpose": "Criar deadline motivadora"}
  ]'::JSONB,
  16
);

-- Saúde
INSERT INTO goal_templates (title, description, category, goal_type, reflective_questions, estimated_duration_weeks) VALUES
(
  'Perder 10kg de forma saudável',
  'Emagrecer com déficit calórico moderado e exercícios regulares',
  'health',
  'medium',
  '[
    {"question": "Você já consultou médico/nutricionista sobre este objetivo?", "type": "text", "purpose": "Garantir segurança"},
    {"question": "Qual tipo de exercício você mais gosta?", "type": "text", "purpose": "Aumentar aderência"},
    {"question": "Quais são seus principais gatilhos de alimentação emocional?", "type": "text", "purpose": "Antecipar obstáculos"}
  ]'::JSONB,
  20
),
(
  'Correr primeira meia-maratona',
  'Treinar do zero até completar 21km',
  'health',
  'medium',
  '[
    {"question": "Você consegue correr 5km atualmente?", "type": "text", "purpose": "Avaliar ponto de partida"},
    {"question": "Tem histórico de lesões?", "type": "text", "purpose": "Prevenir problemas"},
    {"question": "Quando é a prova que você quer participar?", "type": "date", "purpose": "Definir deadline"}
  ]'::JSONB,
  16
);

-- Relacionamentos
INSERT INTO goal_templates (title, description, category, goal_type, reflective_questions, estimated_duration_weeks) VALUES
(
  'Fortalecer relacionamento com parceiro(a)',
  'Investir intencionalmente em conexão e intimidade',
  'relationships',
  'short',
  '[
    {"question": "Quais são as principais áreas de melhoria no relacionamento?", "type": "text", "purpose": "Focar esforços"},
    {"question": "Seu parceiro(a) sabe deste objetivo?", "type": "text", "purpose": "Alinhar expectativas"},
    {"question": "Qual a principal linguagem de amor do seu parceiro(a)?", "type": "text", "purpose": "Personalizar ações"}
  ]'::JSONB,
  12
),
(
  'Construir rede de amizades sólida',
  'Sair do isolamento e cultivar amizades significativas',
  'relationships',
  'medium',
  '[
    {"question": "Quantas amizades próximas você gostaria de ter?", "type": "number", "purpose": "Definir escopo realista"},
    {"question": "Que tipos de atividades você gosta de fazer socialmente?", "type": "text", "purpose": "Guiar encontros"},
    {"question": "Você se considera introvertido ou extrovertido?", "type": "text", "purpose": "Calibrar intensidade"}
  ]'::JSONB,
  24
);

-- Finanças
INSERT INTO goal_templates (title, description, category, goal_type, reflective_questions, estimated_duration_weeks) VALUES
(
  'Construir fundo de emergência',
  'Poupar 6 meses de despesas em reserva líquida',
  'finance',
  'medium',
  '[
    {"question": "Quanto você gasta por mês em média?", "type": "number", "purpose": "Calcular meta em reais"},
    {"question": "Quanto você consegue poupar por mês atualmente?", "type": "number", "purpose": "Estimar prazo"},
    {"question": "Você já tem algum valor guardado?", "type": "number", "purpose": "Definir ponto de partida"}
  ]'::JSONB,
  26
),
(
  'Quitar dívidas e sair do vermelho',
  'Eliminar dívidas de cartão e empréstimos',
  'finance',
  'short',
  '[
    {"question": "Qual o valor total das suas dívidas?", "type": "number", "purpose": "Quantificar desafio"},
    {"question": "Quais são as taxas de juros de cada dívida?", "type": "text", "purpose": "Priorizar quitação"},
    {"question": "Consegue negociar desconto com credores?", "type": "text", "purpose": "Explorar alternativas"}
  ]'::JSONB,
  12
);

-- Crescimento Pessoal
INSERT INTO goal_templates (title, description, category, goal_type, reflective_questions, estimated_duration_weeks) VALUES
(
  'Desenvolver consistência com journaling',
  'Criar hábito diário de reflexão escrita',
  'personal-growth',
  'short',
  '[
    {"question": "Você já tentou journaling antes? O que funcionou/não funcionou?", "type": "text", "purpose": "Aprender com experiência"},
    {"question": "Prefere escrever de manhã ou à noite?", "type": "text", "purpose": "Ancorar em rotina existente"},
    {"question": "Físico (papel) ou digital?", "type": "text", "purpose": "Remover fricção"}
  ]'::JSONB,
  8
),
(
  'Superar síndrome do impostor',
  'Construir autoconfiança baseada em evidências reais',
  'personal-growth',
  'medium',
  '[
    {"question": "Em quais situações você mais sente síndrome do impostor?", "type": "text", "purpose": "Identificar padrões"},
    {"question": "Você considera fazer terapia como parte do processo?", "type": "text", "purpose": "Sugerir suporte profissional"},
    {"question": "Quem são pessoas que te validam e apoiam?", "type": "text", "purpose": "Ativar rede de suporte"}
  ]'::JSONB,
  16
);

-- Projeto Pessoal
INSERT INTO goal_templates (title, description, category, goal_type, reflective_questions, estimated_duration_weeks) VALUES
(
  'Lançar MVP de produto digital',
  'Criar e colocar no ar primeira versão de SaaS ou app',
  'side-project',
  'medium',
  '[
    {"question": "Qual problema específico seu produto resolve?", "type": "text", "purpose": "Clarificar proposta de valor"},
    {"question": "Você já validou que pessoas pagariam por isso?", "type": "text", "purpose": "Evitar desperdício de esforço"},
    {"question": "Quantas horas por semana pode dedicar ao projeto?", "type": "number", "purpose": "Estimar timeline realista"}
  ]'::JSONB,
  16
),
(
  'Monetizar side project existente',
  'Transformar projeto hobby em fonte de renda',
  'side-project',
  'short',
  '[
    {"question": "Quantos usuários/visitantes você tem atualmente?", "type": "number", "purpose": "Avaliar potencial"},
    {"question": "Quais modelos de monetização fazem sentido? (ads, subscription, freemium)", "type": "text", "purpose": "Definir estratégia"},
    {"question": "Quanto você gostaria de faturar por mês?", "type": "number", "purpose": "Definir meta"}
  ]'::JSONB,
  12
);

-- Atualizar success_rate com valores iniciais realistas
UPDATE activity_templates SET success_rate = 75.0 WHERE leverage_score >= 40;
UPDATE activity_templates SET success_rate = 65.0 WHERE leverage_score >= 20 AND leverage_score < 40;
UPDATE activity_templates SET success_rate = 55.0 WHERE leverage_score < 20;

UPDATE goal_templates SET success_rate = 60.0 WHERE goal_type = 'short';
UPDATE goal_templates SET success_rate = 45.0 WHERE goal_type = 'medium';
UPDATE goal_templates SET success_rate = 30.0 WHERE goal_type = 'long';