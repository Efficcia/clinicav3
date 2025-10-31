-- DESABILITAR RLS COMPLETAMENTE EM TODAS AS TABELAS
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard/project/vdjzluhnwcfonqxctpce/sql/new)

BEGIN;

-- Desabilitar RLS em todas as tabelas
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas (só para garantir)
DROP POLICY IF EXISTS "Allow anon full access patients" ON public.patients;
DROP POLICY IF EXISTS "Allow anon full access appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow anon full access financial_entries" ON public.financial_entries;
DROP POLICY IF EXISTS "Allow anon full access waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow anon full access professionals" ON public.professionals;
DROP POLICY IF EXISTS "Allow anon full access team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow anon full access companies" ON public.companies;

DROP POLICY IF EXISTS "allow anon read patients" ON public.patients;
DROP POLICY IF EXISTS "allow anon read appointments" ON public.appointments;
DROP POLICY IF EXISTS "allow anon read financial_entries" ON public.financial_entries;
DROP POLICY IF EXISTS "allow anon read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "allow anon read professionals" ON public.professionals;
DROP POLICY IF EXISTS "allow anon read team_members" ON public.team_members;
DROP POLICY IF EXISTS "allow anon read companies" ON public.companies;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.financial_entries;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.waitlist;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.professionals;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.team_members;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.companies;

COMMIT;

-- Verificar status do RLS
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('patients', 'appointments', 'financial_entries', 'waitlist', 'professionals', 'team_members', 'companies')
ORDER BY tablename;

-- Se tudo estiver 'false' na coluna rls_enabled, significa que o RLS está DESABILITADO (correto)
