-- Verificar se os dados têm user_id preenchido

-- 1. Ver user_id do usuário logado
SELECT 'User ID do admin@efficia.com:' as info, id, email
FROM auth.users
WHERE email = 'admin@efficia.com';

-- 2. Contar quantos registros TÊM vs NÃO TÊM user_id
SELECT
  'patients' as tabela,
  COUNT(*) as total,
  COUNT(user_id) as com_user_id,
  COUNT(*) - COUNT(user_id) as sem_user_id
FROM public.patients
UNION ALL
SELECT
  'appointments',
  COUNT(*),
  COUNT(user_id),
  COUNT(*) - COUNT(user_id)
FROM public.appointments
UNION ALL
SELECT
  'financial_entries',
  COUNT(*),
  COUNT(user_id),
  COUNT(*) - COUNT(user_id)
FROM public.financial_entries
UNION ALL
SELECT
  'waitlist',
  COUNT(*),
  COUNT(user_id),
  COUNT(*) - COUNT(user_id)
FROM public.waitlist
UNION ALL
SELECT
  'professionals',
  COUNT(*),
  COUNT(user_id),
  COUNT(*) - COUNT(user_id)
FROM public.professionals
UNION ALL
SELECT
  'team_members',
  COUNT(*),
  COUNT(user_id),
  COUNT(*) - COUNT(user_id)
FROM public.team_members
UNION ALL
SELECT
  'companies',
  COUNT(*),
  COUNT(user_id),
  COUNT(*) - COUNT(user_id)
FROM public.companies;

-- 3. Ver exemplo de 3 appointments com seus user_ids
SELECT
  id,
  date,
  time,
  status,
  user_id,
  "patientId"
FROM public.appointments
LIMIT 3;
