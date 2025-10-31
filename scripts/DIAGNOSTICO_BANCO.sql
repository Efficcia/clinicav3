-- ==========================================
-- DIAGNÓSTICO COMPLETO DO BANCO DE DADOS
-- Execute no SQL Editor do Supabase
-- ==========================================

-- 1. Verificar se as tabelas existem
SELECT
  '1. TABELAS EXISTENTES' as diagnostico,
  table_name,
  CASE
    WHEN table_name IN ('patients', 'appointments', 'financial_entries', 'waitlist', 'professionals', 'team_members', 'companies')
    THEN '✅ Existe'
    ELSE '❌ Não esperada'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar nomenclatura das colunas da tabela patients
SELECT
  '2. COLUNAS DA TABELA PATIENTS' as diagnostico,
  column_name,
  data_type,
  CASE
    WHEN column_name LIKE '%_%' THEN '⚠️ snake_case'
    ELSE '✅ camelCase'
  END as formato
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'patients'
ORDER BY ordinal_position;

-- 3. Verificar nomenclatura das colunas da tabela appointments
SELECT
  '3. COLUNAS DA TABELA APPOINTMENTS' as diagnostico,
  column_name,
  data_type,
  CASE
    WHEN column_name LIKE '%_%' THEN '⚠️ snake_case'
    ELSE '✅ camelCase'
  END as formato
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'appointments'
ORDER BY ordinal_position;

-- 4. Verificar status do RLS
SELECT
  '4. STATUS DO RLS' as diagnostico,
  tablename,
  CASE
    WHEN rowsecurity = true THEN '⚠️ HABILITADO'
    ELSE '✅ DESABILITADO'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('patients', 'appointments', 'financial_entries', 'waitlist', 'professionals', 'team_members', 'companies')
ORDER BY tablename;

-- 5. Contar registros em cada tabela
SELECT
  '5. QUANTIDADE DE DADOS' as diagnostico,
  'patients' as tabela,
  COUNT(*) as total_registros
FROM public.patients
UNION ALL
SELECT
  '5. QUANTIDADE DE DADOS',
  'appointments',
  COUNT(*)
FROM public.appointments
UNION ALL
SELECT
  '5. QUANTIDADE DE DADOS',
  'financial_entries',
  COUNT(*)
FROM public.financial_entries
UNION ALL
SELECT
  '5. QUANTIDADE DE DADOS',
  'waitlist',
  COUNT(*)
FROM public.waitlist
UNION ALL
SELECT
  '5. QUANTIDADE DE DADOS',
  'professionals',
  COUNT(*)
FROM public.professionals
UNION ALL
SELECT
  '5. QUANTIDADE DE DADOS',
  'team_members',
  COUNT(*)
FROM public.team_members
UNION ALL
SELECT
  '5. QUANTIDADE DE DADOS',
  'companies',
  COUNT(*)
FROM public.companies;

-- 6. Verificar se tem coluna user_id (importante para multi-tenant)
SELECT
  '6. COLUNA USER_ID (MULTI-TENANT)' as diagnostico,
  table_name,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = t.table_name
        AND column_name = 'user_id'
    ) THEN '✅ Tem user_id'
    ELSE '⚠️ SEM user_id'
  END as status
FROM (
  SELECT 'patients' as table_name
  UNION ALL SELECT 'appointments'
  UNION ALL SELECT 'financial_entries'
  UNION ALL SELECT 'waitlist'
  UNION ALL SELECT 'professionals'
  UNION ALL SELECT 'team_members'
  UNION ALL SELECT 'companies'
) t;

-- 7. Verificar sample de 1 paciente (para ver estrutura real)
SELECT
  '7. EXEMPLO DE PACIENTE (PRIMEIROS 3)' as diagnostico,
  *
FROM public.patients
LIMIT 3;

-- 8. Resumo final
SELECT
  '8. RESUMO FINAL' as diagnostico,
  'Total de tabelas: ' || COUNT(DISTINCT table_name) as info
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
UNION ALL
SELECT
  '8. RESUMO FINAL',
  'Formato esperado: camelCase (ex: birthDate, medicalHistory)'
UNION ALL
SELECT
  '8. RESUMO FINAL',
  'Se aparecer snake_case, precisa executar script de conversão';
