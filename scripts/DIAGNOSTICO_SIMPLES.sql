-- DIAGNÓSTICO SIMPLES - Execute no SQL Editor do Supabase

-- 1. Ver colunas da tabela patients
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'patients'
ORDER BY ordinal_position;
