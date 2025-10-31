-- Ver estrutura e dados da tabela appointments
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'appointments'
ORDER BY ordinal_position;

-- Ver todos os appointments que existem
SELECT * FROM public.appointments LIMIT 5;

-- Contar total
SELECT COUNT(*) as total_appointments FROM public.appointments;
