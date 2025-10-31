-- ============================================================================
-- SEED DATA: 6 SALAS E 5 PROFISSIONAIS
-- ============================================================================
-- Dados iniciais para sistema de ensalamento
-- ============================================================================

-- ============================================================================
-- SEED: 6 Salas com características
-- ============================================================================
INSERT INTO rooms (id, name, is_active, features) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'Sala 1 - Consultório Principal',
    TRUE,
    '{"area_m2": 20, "macas": 1, "computador": true, "ar_condicionado": true, "pia": true}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Sala 2 - Consultório Pequeno',
    TRUE,
    '{"area_m2": 12, "macas": 1, "computador": true, "ar_condicionado": true}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Sala 3 - Procedimentos',
    TRUE,
    '{"area_m2": 25, "macas": 2, "equipamentos_cirurgicos": true, "laser": true, "pia": true, "ar_condicionado": true}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Sala 4 - Terapia',
    TRUE,
    '{"area_m2": 18, "macas": 1, "som_ambiente": true, "iluminacao_ajustavel": true, "ar_condicionado": true}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'Sala 5 - Exames',
    TRUE,
    '{"area_m2": 15, "maca_exame": 1, "ultrassom": true, "ecg": true, "computador": true, "ar_condicionado": true}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'Sala 6 - Polivalente',
    TRUE,
    '{"area_m2": 16, "macas": 1, "computador": true, "multiplo_uso": true, "ar_condicionado": true}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  features = EXCLUDED.features;

-- ============================================================================
-- SEED: 5 Profissionais
-- ============================================================================
INSERT INTO professionals (id, name, specialty, is_active) VALUES
  (
    '10000000-0000-0000-0000-000000000001',
    'Dr. Carlos Silva',
    'Clínico Geral',
    TRUE
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Dra. Ana Paula Oliveira',
    'Dermatologia',
    TRUE
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Dr. Roberto Santos',
    'Ortopedia',
    TRUE
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Dra. Juliana Costa',
    'Psicologia',
    TRUE
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'Dr. Fernando Almeida',
    'Cardiologia',
    TRUE
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  specialty = EXCLUDED.specialty,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- SEED: Preferências de Sala por Profissional
-- ============================================================================
-- Cada profissional tem salas preferidas (priority menor = mais preferida)

-- Dr. Carlos Silva (Clínico Geral) - prefere salas de consultório
INSERT INTO doctor_room_prefs (professional_id, room_id, priority) VALUES
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1), -- Sala 1
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 2), -- Sala 2
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 3)  -- Sala 6
ON CONFLICT (professional_id, room_id) DO UPDATE SET priority = EXCLUDED.priority;

-- Dra. Ana Paula Oliveira (Dermatologia) - prefere sala de procedimentos e consultório principal
INSERT INTO doctor_room_prefs (professional_id, room_id, priority) VALUES
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 1), -- Sala 3 (laser)
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 2), -- Sala 1
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 3)  -- Sala 6
ON CONFLICT (professional_id, room_id) DO UPDATE SET priority = EXCLUDED.priority;

-- Dr. Roberto Santos (Ortopedia) - prefere sala de procedimentos e consultório principal
INSERT INTO doctor_room_prefs (professional_id, room_id, priority) VALUES
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 1), -- Sala 3
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 2), -- Sala 1
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000006', 3)  -- Sala 6
ON CONFLICT (professional_id, room_id) DO UPDATE SET priority = EXCLUDED.priority;

-- Dra. Juliana Costa (Psicologia) - prefere sala de terapia
INSERT INTO doctor_room_prefs (professional_id, room_id, priority) VALUES
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 1), -- Sala 4 (terapia)
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 2), -- Sala 2
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', 3)  -- Sala 6
ON CONFLICT (professional_id, room_id) DO UPDATE SET priority = EXCLUDED.priority;

-- Dr. Fernando Almeida (Cardiologia) - prefere sala de exames
INSERT INTO doctor_room_prefs (professional_id, room_id, priority) VALUES
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 1), -- Sala 5 (exames/ECG)
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 2), -- Sala 1
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', 3)  -- Sala 6
ON CONFLICT (professional_id, room_id) DO UPDATE SET priority = EXCLUDED.priority;

-- ============================================================================
-- EXEMPLO: Bloqueio de sala para manutenção
-- ============================================================================
-- Comentado para não inserir por padrão
-- Descomente para testar bloqueios

/*
-- Bloqueia Sala 3 para manutenção amanhã das 13h às 14h
INSERT INTO room_blockings (room_id, starts_at, ends_at, reason) VALUES
  (
    '00000000-0000-0000-0000-000000000003',
    (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '13 hours')::timestamptz,
    (CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours')::timestamptz,
    'Manutenção preventiva do equipamento de laser'
  );
*/

-- ============================================================================
-- VERIFICAÇÃO: Exibir resumo dos dados inseridos
-- ============================================================================

-- Mensagem de confirmação (apenas informativa)
DO $$
BEGIN
  RAISE NOTICE '✅ SEED COMPLETO!';
  RAISE NOTICE '   - 6 salas criadas';
  RAISE NOTICE '   - 5 profissionais criados';
  RAISE NOTICE '   - Preferências de sala configuradas';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Próximos passos:';
  RAISE NOTICE '   1. Testar alocação: SELECT allocate_room(appointment_id, professional_id, starts, ends)';
  RAISE NOTICE '   2. Ver candidatos: SELECT * FROM candidate_rooms(professional_id, starts, ends)';
  RAISE NOTICE '   3. Ver agenda: SELECT * FROM get_room_schedule(room_id, date, date)';
END $$;

-- Query de validação: mostra salas e profissionais
SELECT
  'rooms' AS type,
  COUNT(*) AS count,
  jsonb_agg(name ORDER BY name) AS items
FROM rooms
WHERE is_active = TRUE

UNION ALL

SELECT
  'professionals' AS type,
  COUNT(*) AS count,
  jsonb_agg(name ORDER BY name) AS items
FROM professionals
WHERE is_active = TRUE;
