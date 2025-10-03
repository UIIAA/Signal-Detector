-- ============================================
-- Script de Validação do Banco de Dados
-- Signal vs Noise Detector v2.0
-- ============================================

\echo '======================================'
\echo 'VALIDAÇÃO DO BANCO DE DADOS'
\echo '======================================'
\echo ''

-- ============================================
-- 1. VALIDAÇÃO DE TABELAS
-- ============================================
\echo '1. Verificando existência de tabelas...'
\echo ''

SELECT
  CASE
    WHEN COUNT(*) = 15 THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status,
  COUNT(*) as tabelas_encontradas,
  15 as tabelas_esperadas,
  ARRAY_AGG(tablename ORDER BY tablename) as tabelas
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'users',
  'goals',
  'activities',
  'key_activities',
  'activity_goals',
  'efficiency_history',
  'opportunity_cost_alerts',
  'activity_templates',
  'goal_templates',
  'time_blocks',
  'key_results',
  'habits',
  'habit_checkins',
  'gtd_contexts',
  'gtd_lists'
);

\echo ''

-- ============================================
-- 2. VALIDAÇÃO DE MIGRAÇÕES
-- ============================================
\echo '2. Verificando colunas das migrações...'
\echo ''

-- v10: ideal_path
SELECT
  CASE
    WHEN COUNT(*) = 3 THEN '✓ PASS - Migration v10 (ideal_path)'
    ELSE '✗ FAIL - Migration v10'
  END as status,
  COUNT(*) as colunas_encontradas
FROM information_schema.columns
WHERE table_name = 'goals'
AND column_name IN ('ideal_path', 'ideal_path_created_at', 'ideal_path_updated_at');

-- v11: efficiency_history
SELECT
  CASE
    WHEN COUNT(*) = 2 THEN '✓ PASS - Migration v11 (efficiency_history)'
    ELSE '✗ FAIL - Migration v11'
  END as status,
  COUNT(*) as tabelas_encontradas
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('efficiency_history', 'opportunity_cost_alerts');

-- v12: templates
SELECT
  CASE
    WHEN COUNT(*) = 2 THEN '✓ PASS - Migration v12 (templates)'
    ELSE '✗ FAIL - Migration v12'
  END as status,
  COUNT(*) as tabelas_encontradas
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('activity_templates', 'goal_templates');

-- v13: time_blocks
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✓ PASS - Migration v13 (time_blocks)'
    ELSE '✗ FAIL - Migration v13'
  END as status,
  COUNT(*) as tabelas_encontradas
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'time_blocks';

-- v14: frameworks
SELECT
  CASE
    WHEN COUNT(*) = 5 THEN '✓ PASS - Migration v14 (frameworks)'
    ELSE '✗ FAIL - Migration v14'
  END as status,
  COUNT(*) as tabelas_encontradas
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('key_results', 'habits', 'habit_checkins', 'gtd_contexts', 'gtd_lists');

\echo ''

-- ============================================
-- 3. VALIDAÇÃO DE TEMPLATES
-- ============================================
\echo '3. Verificando templates seed...'
\echo ''

-- Activity Templates
SELECT
  CASE
    WHEN COUNT(*) >= 100 THEN '✓ PASS - Activity Templates'
    ELSE '✗ FAIL - Activity Templates'
  END as status,
  COUNT(*) as templates_encontrados,
  112 as templates_esperados
FROM activity_templates;

-- Goal Templates
SELECT
  CASE
    WHEN COUNT(*) >= 20 THEN '✓ PASS - Goal Templates'
    ELSE '✗ FAIL - Goal Templates'
  END as status,
  COUNT(*) as templates_encontrados,
  24 as templates_esperados
FROM goal_templates;

\echo ''

-- ============================================
-- 4. VALIDAÇÃO DE CATEGORIAS
-- ============================================
\echo '4. Verificando distribuição de categorias...'
\echo ''

SELECT
  '✓ Activity Templates por Categoria:' as info,
  category,
  COUNT(*) as quantidade
FROM activity_templates
GROUP BY category
ORDER BY category;

\echo ''

SELECT
  '✓ Goal Templates por Categoria:' as info,
  category,
  COUNT(*) as quantidade
FROM goal_templates
GROUP BY category
ORDER BY category;

\echo ''

-- ============================================
-- 5. VALIDAÇÃO DE INTEGRIDADE
-- ============================================
\echo '5. Verificando integridade referencial...'
\echo ''

-- Verificar Foreign Keys
SELECT
  CASE
    WHEN COUNT(*) >= 10 THEN '✓ PASS - Foreign Keys'
    ELSE '✗ FAIL - Foreign Keys'
  END as status,
  COUNT(*) as fks_encontradas
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
AND table_schema = 'public';

-- Listar Foreign Keys
SELECT
  '  ' || tc.table_name as tabela,
  '→ ' || ccu.table_name as referencia
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

\echo ''

-- ============================================
-- 6. VALIDAÇÃO DE ÍNDICES
-- ============================================
\echo '6. Verificando índices de performance...'
\echo ''

SELECT
  CASE
    WHEN COUNT(*) >= 15 THEN '✓ PASS - Índices'
    ELSE '⚠ WARNING - Poucos índices'
  END as status,
  COUNT(*) as indices_encontrados
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%_pkey';

\echo ''

-- ============================================
-- 7. VALIDAÇÃO DE CONSTRAINTS
-- ============================================
\echo '7. Verificando constraints de validação...'
\echo ''

-- impact e effort em activities
SELECT
  CASE
    WHEN COUNT(*) = 2 THEN '✓ PASS - Constraints impact/effort'
    ELSE '✗ FAIL - Constraints impact/effort'
  END as status
FROM information_schema.columns
WHERE table_name = 'activities'
AND column_name IN ('impact', 'effort');

-- Verificar enums de block_type
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✓ PASS - time_blocks constraints'
    ELSE '✗ FAIL - time_blocks constraints'
  END as status
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%time_blocks%';

\echo ''

-- ============================================
-- 8. VALIDAÇÃO DE TIPOS DE DADOS
-- ============================================
\echo '8. Verificando tipos de dados críticos...'
\echo ''

-- JSONB fields
SELECT
  '✓ Campos JSONB:' as info,
  table_name,
  column_name
FROM information_schema.columns
WHERE data_type = 'jsonb'
AND table_schema = 'public'
ORDER BY table_name, column_name;

\echo ''

-- Generated columns
SELECT
  '✓ Colunas Calculadas:' as info,
  table_name,
  column_name
FROM information_schema.columns
WHERE is_generated = 'ALWAYS'
AND table_schema = 'public'
ORDER BY table_name;

\echo ''

-- ============================================
-- 9. ESTATÍSTICAS DO BANCO
-- ============================================
\echo '9. Estatísticas gerais do banco...'
\echo ''

SELECT
  '📊 Estatísticas:' as info,
  (SELECT COUNT(*) FROM users) as usuarios,
  (SELECT COUNT(*) FROM goals) as objetivos,
  (SELECT COUNT(*) FROM activities) as atividades,
  (SELECT COUNT(*) FROM time_blocks) as blocos_agendados,
  (SELECT COUNT(*) FROM habits) as habitos,
  (SELECT COUNT(*) FROM efficiency_history) as historico_eficiencia;

\echo ''

-- ============================================
-- 10. VALIDAÇÃO DE LEVERAGE SCORES
-- ============================================
\echo '10. Verificando leverage scores dos templates...'
\echo ''

SELECT
  CASE
    WHEN MIN(leverage_score) >= 10 THEN '✓ PASS - Leverage Scores'
    ELSE '⚠ WARNING - Alguns templates com baixo leverage'
  END as status,
  ROUND(AVG(leverage_score), 2) as media_leverage,
  MIN(leverage_score) as minimo,
  MAX(leverage_score) as maximo
FROM activity_templates
WHERE leverage_score IS NOT NULL;

\echo ''

-- Distribuição de leverage scores
SELECT
  '✓ Distribuição de Leverage:' as info,
  CASE
    WHEN leverage_score >= 20 THEN 'Excelente (>=20)'
    WHEN leverage_score >= 15 THEN 'Bom (15-19)'
    WHEN leverage_score >= 10 THEN 'Moderado (10-14)'
    ELSE 'Baixo (<10)'
  END as categoria,
  COUNT(*) as quantidade
FROM activity_templates
GROUP BY categoria
ORDER BY
  CASE categoria
    WHEN 'Excelente (>=20)' THEN 1
    WHEN 'Bom (15-19)' THEN 2
    WHEN 'Moderado (10-14)' THEN 3
    ELSE 4
  END;

\echo ''
\echo '======================================'
\echo 'VALIDAÇÃO CONCLUÍDA'
\echo '======================================'
\echo ''

-- Resumo final
SELECT
  '🎯 RESUMO:' as info,
  CASE
    WHEN
      (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'goals', 'activities', 'efficiency_history', 'time_blocks', 'habits')) = 6
      AND (SELECT COUNT(*) FROM activity_templates) >= 100
      AND (SELECT COUNT(*) FROM goal_templates) >= 20
    THEN '✅ Banco de dados validado com sucesso!'
    ELSE '⚠️ Algumas validações falharam - revise os logs acima'
  END as resultado;