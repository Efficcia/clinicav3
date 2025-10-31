-- Ver formato da coluna date em appointments
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'appointments'
  AND column_name = 'date';

-- Ver exemplos reais de datas na tabela
SELECT
  id,
  date,
  time,
  status,
  "patientId"
FROM public.appointments
LIMIT 10;

-- Ver se tem appointments hoje
SELECT
  COUNT(*) as total,
  date
FROM public.appointments
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;
