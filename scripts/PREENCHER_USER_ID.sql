-- ==========================================
-- PREENCHER user_id EM TODAS AS TABELAS
-- Execute no SQL Editor do Supabase
-- ==========================================

-- Primeiro, vamos verificar o user_id do admin@efficia.com
SELECT
  'User ID encontrado:' as info,
  id,
  email
FROM auth.users
WHERE email = 'admin@efficia.com';

-- Agora vamos atualizar todas as tabelas com esse user_id
-- Substitua 'SEU_USER_ID_AQUI' pelo ID que apareceu acima

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Pega o ID do usuário admin@efficia.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@efficia.com'
  LIMIT 1;

  -- Se não encontrou, para aqui
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário admin@efficia.com não encontrado!';
  END IF;

  -- Atualiza todas as tabelas
  UPDATE public.patients SET user_id = admin_user_id WHERE user_id IS NULL;
  UPDATE public.appointments SET user_id = admin_user_id WHERE user_id IS NULL;
  UPDATE public.financial_entries SET user_id = admin_user_id WHERE user_id IS NULL;
  UPDATE public.waitlist SET user_id = admin_user_id WHERE user_id IS NULL;
  UPDATE public.professionals SET user_id = admin_user_id WHERE user_id IS NULL;
  UPDATE public.team_members SET user_id = admin_user_id WHERE user_id IS NULL;
  UPDATE public.companies SET user_id = admin_user_id WHERE user_id IS NULL;

  RAISE NOTICE 'user_id atualizado com sucesso: %', admin_user_id;
END $$;

-- Verificar quantos registros foram atualizados
SELECT 'patients' as tabela, COUNT(*) as total, COUNT(user_id) as com_user_id
FROM public.patients
UNION ALL
SELECT 'appointments', COUNT(*), COUNT(user_id)
FROM public.appointments
UNION ALL
SELECT 'financial_entries', COUNT(*), COUNT(user_id)
FROM public.financial_entries
UNION ALL
SELECT 'waitlist', COUNT(*), COUNT(user_id)
FROM public.waitlist
UNION ALL
SELECT 'professionals', COUNT(*), COUNT(user_id)
FROM public.professionals
UNION ALL
SELECT 'team_members', COUNT(*), COUNT(user_id)
FROM public.team_members
UNION ALL
SELECT 'companies', COUNT(*), COUNT(user_id)
FROM public.companies;
