-- ============================================================================
-- FUNÇÕES SQL/RPC PARA ENSALAMENTO AUTOMÁTICO
-- ============================================================================
-- Funções prontas para chamar via Supabase RPC ou API
-- ============================================================================

-- ============================================================================
-- FUNÇÃO: candidate_rooms
-- ============================================================================
-- Retorna salas candidatas disponíveis para um intervalo de tempo
-- Ordenadas por: 1) preferência do profissional, 2) menor carga no dia
--
-- Uso: SELECT * FROM candidate_rooms('uuid-prof', '2025-01-15 09:00', '2025-01-15 10:00');
-- ============================================================================
CREATE OR REPLACE FUNCTION candidate_rooms(
  _professional_id UUID,
  _starts TIMESTAMPTZ,
  _ends TIMESTAMPTZ
)
RETURNS TABLE(
  room_id UUID,
  room_name TEXT,
  preference_priority INT,
  day_load_minutes INT,
  features JSONB
) AS $$
WITH base AS (
  -- Salas ativas, sem bloqueios e sem alocações no horário
  SELECT
    r.id,
    r.name,
    r.features,
    COALESCE(
      (SELECT priority FROM doctor_room_prefs p
       WHERE p.professional_id = _professional_id AND p.room_id = r.id),
      9999
    ) AS pref
  FROM rooms r
  WHERE r.is_active = TRUE
    -- Sem bloqueios no horário
    AND NOT EXISTS (
      SELECT 1 FROM room_blockings b
      WHERE b.room_id = r.id
        AND tstzrange(b.starts_at, b.ends_at, '[]') && tstzrange(_starts, _ends, '[]')
    )
    -- Sem alocações no horário
    AND NOT EXISTS (
      SELECT 1 FROM room_allocations a
      WHERE a.room_id = r.id
        AND tstzrange(a.starts_at, a.ends_at, '[]') && tstzrange(_starts, _ends, '[]')
    )
),
load AS (
  -- Carga (minutos ocupados) de cada sala no mesmo dia
  SELECT
    ra.room_id,
    SUM(EXTRACT(EPOCH FROM (ra.ends_at - ra.starts_at)) / 60)::INT AS day_load_minutes
  FROM room_allocations ra
  WHERE ra.starts_at::date = _starts::date
  GROUP BY ra.room_id
)
SELECT
  b.id AS room_id,
  b.name AS room_name,
  b.pref AS preference_priority,
  COALESCE(l.day_load_minutes, 0) AS day_load_minutes,
  b.features
FROM base b
LEFT JOIN load l ON l.room_id = b.id
ORDER BY b.pref ASC, COALESCE(l.day_load_minutes, 0) ASC, b.name ASC;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION candidate_rooms IS
'Retorna salas disponíveis para um intervalo, ordenadas por preferência e carga';


-- ============================================================================
-- FUNÇÃO: allocate_room
-- ============================================================================
-- Aloca automaticamente uma sala para um appointment
-- Retorna o UUID da sala alocada ou NULL se não conseguiu
--
-- Uso: SELECT allocate_room('uuid-appointment', 'uuid-professional', '2025-01-15 09:00', '2025-01-15 10:00');
-- ============================================================================
CREATE OR REPLACE FUNCTION allocate_room(
  _appointment_id UUID,
  _professional_id UUID,
  _starts TIMESTAMPTZ,
  _ends TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  cand RECORD;
  chosen_room_id UUID;
BEGIN
  -- Busca candidatos em ordem de preferência
  FOR cand IN
    SELECT * FROM candidate_rooms(_professional_id, _starts, _ends)
  LOOP
    BEGIN
      -- Tenta inserir a alocação
      INSERT INTO room_allocations(
        appointment_id,
        room_id,
        professional_id,
        starts_at,
        ends_at
      ) VALUES (
        _appointment_id,
        cand.room_id,
        _professional_id,
        _starts,
        _ends
      );

      chosen_room_id := cand.room_id;

      -- Auditoria: criação
      INSERT INTO allocation_audit(
        allocation_id,
        appointment_id,
        action,
        new_room_id,
        new_time,
        reason
      ) VALUES (
        (SELECT id FROM room_allocations WHERE appointment_id = _appointment_id),
        _appointment_id,
        'created',
        cand.room_id,
        tstzrange(_starts, _ends, '[]'),
        'Auto-alocação'
      );

      EXIT; -- Sucesso! Sai do loop

    EXCEPTION WHEN exclusion_violation THEN
      -- Condição de corrida: outra requisição pegou esta sala
      -- Continua para próxima sala candidata
      CONTINUE;
    END;
  END LOOP;

  RETURN chosen_room_id; -- NULL se não conseguiu alocar
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION allocate_room IS
'Aloca automaticamente uma sala disponível para um appointment';


-- ============================================================================
-- FUNÇÃO: deallocate_room
-- ============================================================================
-- Remove alocação de sala de um appointment
--
-- Uso: SELECT deallocate_room('uuid-appointment');
-- ============================================================================
CREATE OR REPLACE FUNCTION deallocate_room(_appointment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  old_allocation RECORD;
BEGIN
  -- Busca alocação existente
  SELECT * INTO old_allocation
  FROM room_allocations
  WHERE appointment_id = _appointment_id;

  IF NOT FOUND THEN
    RETURN FALSE; -- Não havia alocação
  END IF;

  -- Remove alocação
  DELETE FROM room_allocations WHERE appointment_id = _appointment_id;

  -- Auditoria: deleção
  INSERT INTO allocation_audit(
    allocation_id,
    appointment_id,
    action,
    old_room_id,
    old_time,
    reason
  ) VALUES (
    old_allocation.id,
    _appointment_id,
    'deleted',
    old_allocation.room_id,
    tstzrange(old_allocation.starts_at, old_allocation.ends_at, '[]'),
    'Desalocação manual'
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION deallocate_room IS
'Remove alocação de sala de um appointment';


-- ============================================================================
-- FUNÇÃO: reallocate_room
-- ============================================================================
-- Troca a sala de um appointment (mantém ou atualiza horário)
-- Tenta manter a mesma sala se horário mudou; se conflitar, busca outra
--
-- Uso: SELECT reallocate_room('uuid-appointment', 'uuid-professional', '2025-01-15 10:00', '2025-01-15 11:00');
-- ============================================================================
CREATE OR REPLACE FUNCTION reallocate_room(
  _appointment_id UUID,
  _professional_id UUID,
  _new_starts TIMESTAMPTZ,
  _new_ends TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  old_allocation RECORD;
  new_room_id UUID;
BEGIN
  -- Busca alocação existente
  SELECT * INTO old_allocation
  FROM room_allocations
  WHERE appointment_id = _appointment_id;

  IF NOT FOUND THEN
    -- Não tinha alocação: faz alocação nova
    RETURN allocate_room(_appointment_id, _professional_id, _new_starts, _new_ends);
  END IF;

  -- Tenta manter a mesma sala atualizando horário
  BEGIN
    UPDATE room_allocations
    SET starts_at = _new_starts,
        ends_at = _new_ends,
        professional_id = _professional_id
    WHERE appointment_id = _appointment_id;

    -- Auditoria: atualização (mesma sala, horário diferente)
    INSERT INTO allocation_audit(
      allocation_id,
      appointment_id,
      action,
      old_room_id,
      new_room_id,
      old_time,
      new_time,
      reason
    ) VALUES (
      old_allocation.id,
      _appointment_id,
      'updated',
      old_allocation.room_id,
      old_allocation.room_id,
      tstzrange(old_allocation.starts_at, old_allocation.ends_at, '[]'),
      tstzrange(_new_starts, _new_ends, '[]'),
      'Atualização de horário'
    );

    RETURN old_allocation.room_id; -- Manteve a mesma sala

  EXCEPTION WHEN exclusion_violation THEN
    -- Conflito: mesma sala não disponível no novo horário
    -- Remove alocação antiga e tenta alocar em outra sala
    DELETE FROM room_allocations WHERE appointment_id = _appointment_id;

    new_room_id := allocate_room(_appointment_id, _professional_id, _new_starts, _new_ends);

    -- Auditoria: troca de sala por conflito
    IF new_room_id IS NOT NULL THEN
      INSERT INTO allocation_audit(
        allocation_id,
        appointment_id,
        action,
        old_room_id,
        new_room_id,
        old_time,
        new_time,
        reason
      ) VALUES (
        (SELECT id FROM room_allocations WHERE appointment_id = _appointment_id),
        _appointment_id,
        'updated',
        old_allocation.room_id,
        new_room_id,
        tstzrange(old_allocation.starts_at, old_allocation.ends_at, '[]'),
        tstzrange(_new_starts, _new_ends, '[]'),
        'Troca de sala por conflito de horário'
      );
    ELSE
      -- Não conseguiu alocar: registra conflito
      INSERT INTO allocation_audit(
        appointment_id,
        action,
        old_room_id,
        old_time,
        new_time,
        reason
      ) VALUES (
        _appointment_id,
        'conflict',
        old_allocation.room_id,
        tstzrange(old_allocation.starts_at, old_allocation.ends_at, '[]'),
        tstzrange(_new_starts, _new_ends, '[]'),
        'CONFLITO: Nenhuma sala disponível'
      );
    END IF;

    RETURN new_room_id;
  END;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION reallocate_room IS
'Atualiza alocação de sala (tenta manter mesma sala, senão busca outra)';


-- ============================================================================
-- FUNÇÃO: get_room_schedule
-- ============================================================================
-- Retorna agenda completa de uma sala em um período
--
-- Uso: SELECT * FROM get_room_schedule('uuid-sala', '2025-01-15', '2025-01-15');
-- ============================================================================
CREATE OR REPLACE FUNCTION get_room_schedule(
  _room_id UUID,
  _date_start DATE,
  _date_end DATE
)
RETURNS TABLE(
  allocation_id UUID,
  appointment_id UUID,
  professional_id UUID,
  professional_name TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  duration_minutes INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ra.id AS allocation_id,
    ra.appointment_id,
    ra.professional_id,
    p.name AS professional_name,
    ra.starts_at,
    ra.ends_at,
    EXTRACT(EPOCH FROM (ra.ends_at - ra.starts_at))::INT / 60 AS duration_minutes
  FROM room_allocations ra
  JOIN professionals p ON p.id = ra.professional_id
  WHERE ra.room_id = _room_id
    AND ra.starts_at::date BETWEEN _date_start AND _date_end
  ORDER BY ra.starts_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_room_schedule IS
'Retorna agenda de uma sala em um período';


-- ============================================================================
-- FUNÇÃO: get_professional_schedule
-- ============================================================================
-- Retorna agenda completa de um profissional em um período
--
-- Uso: SELECT * FROM get_professional_schedule('uuid-prof', '2025-01-15', '2025-01-15');
-- ============================================================================
CREATE OR REPLACE FUNCTION get_professional_schedule(
  _professional_id UUID,
  _date_start DATE,
  _date_end DATE
)
RETURNS TABLE(
  allocation_id UUID,
  appointment_id UUID,
  room_id UUID,
  room_name TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  duration_minutes INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ra.id AS allocation_id,
    ra.appointment_id,
    ra.room_id,
    r.name AS room_name,
    ra.starts_at,
    ra.ends_at,
    EXTRACT(EPOCH FROM (ra.ends_at - ra.starts_at))::INT / 60 AS duration_minutes
  FROM room_allocations ra
  JOIN rooms r ON r.id = ra.room_id
  WHERE ra.professional_id = _professional_id
    AND ra.starts_at::date BETWEEN _date_start AND _date_end
  ORDER BY ra.starts_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_professional_schedule IS
'Retorna agenda de um profissional em um período';


-- ============================================================================
-- FUNÇÃO: check_conflicts
-- ============================================================================
-- Verifica se há conflitos de alocação (não deveria haver!)
-- Retorna lista de conflitos se existirem
--
-- Uso: SELECT * FROM check_conflicts();
-- ============================================================================
CREATE OR REPLACE FUNCTION check_conflicts()
RETURNS TABLE(
  room_id UUID,
  room_name TEXT,
  conflict_count BIGINT,
  conflicts JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH overlaps AS (
    SELECT
      a1.room_id,
      a1.id AS alloc1_id,
      a2.id AS alloc2_id,
      a1.starts_at AS starts1,
      a1.ends_at AS ends1,
      a2.starts_at AS starts2,
      a2.ends_at AS ends2
    FROM room_allocations a1
    JOIN room_allocations a2 ON a1.room_id = a2.room_id AND a1.id < a2.id
    WHERE tstzrange(a1.starts_at, a1.ends_at, '[]') && tstzrange(a2.starts_at, a2.ends_at, '[]')
  )
  SELECT
    o.room_id,
    r.name AS room_name,
    COUNT(*) AS conflict_count,
    jsonb_agg(
      jsonb_build_object(
        'alloc1_id', o.alloc1_id,
        'alloc2_id', o.alloc2_id,
        'overlap', jsonb_build_object(
          'time1', jsonb_build_object('start', o.starts1, 'end', o.ends1),
          'time2', jsonb_build_object('start', o.starts2, 'end', o.ends2)
        )
      )
    ) AS conflicts
  FROM overlaps o
  JOIN rooms r ON r.id = o.room_id
  GROUP BY o.room_id, r.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_conflicts IS
'Verifica integridade: retorna conflitos de alocação (não deveria haver!)';


-- ============================================================================
-- FUNÇÃO: suggest_alternative_slots
-- ============================================================================
-- Sugere horários alternativos quando não há sala disponível
-- Retorna 3 sugestões: próximas janelas livres
--
-- Uso: SELECT * FROM suggest_alternative_slots('uuid-prof', '2025-01-15 09:00', '2025-01-15 10:00');
-- ============================================================================
CREATE OR REPLACE FUNCTION suggest_alternative_slots(
  _professional_id UUID,
  _desired_starts TIMESTAMPTZ,
  _desired_ends TIMESTAMPTZ,
  _max_suggestions INT DEFAULT 3
)
RETURNS TABLE(
  room_id UUID,
  room_name TEXT,
  suggested_starts TIMESTAMPTZ,
  suggested_ends TIMESTAMPTZ,
  offset_minutes INT
) AS $$
DECLARE
  duration_minutes INT;
  search_date DATE;
BEGIN
  duration_minutes := EXTRACT(EPOCH FROM (_desired_ends - _desired_starts))::INT / 60;
  search_date := _desired_starts::date;

  RETURN QUERY
  WITH RECURSIVE time_slots AS (
    -- Gera slots de 30 minutos no dia desejado (8h às 18h)
    SELECT
      (search_date + interval '8 hours')::timestamptz AS slot_start
    UNION ALL
    SELECT slot_start + interval '30 minutes'
    FROM time_slots
    WHERE slot_start < (search_date + interval '18 hours')::timestamptz
  ),
  available_slots AS (
    SELECT
      ts.slot_start,
      ts.slot_start + (duration_minutes || ' minutes')::interval AS slot_end,
      r.id AS room_id,
      r.name AS room_name,
      ABS(EXTRACT(EPOCH FROM (ts.slot_start - _desired_starts))::INT / 60) AS offset_minutes
    FROM time_slots ts
    CROSS JOIN rooms r
    WHERE r.is_active = TRUE
      -- Não tem bloqueio
      AND NOT EXISTS (
        SELECT 1 FROM room_blockings b
        WHERE b.room_id = r.id
          AND tstzrange(b.starts_at, b.ends_at, '[]') &&
              tstzrange(ts.slot_start, ts.slot_start + (duration_minutes || ' minutes')::interval, '[]')
      )
      -- Não tem alocação
      AND NOT EXISTS (
        SELECT 1 FROM room_allocations a
        WHERE a.room_id = r.id
          AND tstzrange(a.starts_at, a.ends_at, '[]') &&
              tstzrange(ts.slot_start, ts.slot_start + (duration_minutes || ' minutes')::interval, '[]')
      )
  )
  SELECT
    room_id,
    room_name,
    slot_start AS suggested_starts,
    slot_end AS suggested_ends,
    offset_minutes
  FROM available_slots
  ORDER BY offset_minutes ASC, room_name ASC
  LIMIT _max_suggestions;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION suggest_alternative_slots IS
'Sugere horários e salas alternativos quando não há disponibilidade';


-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View: alocações com detalhes completos
CREATE OR REPLACE VIEW v_room_allocations_full AS
SELECT
  ra.id,
  ra.appointment_id,
  ra.room_id,
  r.name AS room_name,
  ra.professional_id,
  p.name AS professional_name,
  p.specialty AS professional_specialty,
  ra.starts_at,
  ra.ends_at,
  EXTRACT(EPOCH FROM (ra.ends_at - ra.starts_at))::INT / 60 AS duration_minutes,
  ra.created_at,
  ra.updated_at
FROM room_allocations ra
JOIN rooms r ON r.id = ra.room_id
JOIN professionals p ON p.id = ra.professional_id;

COMMENT ON VIEW v_room_allocations_full IS
'View com detalhes completos de alocações (join com rooms e professionals)';


-- View: salas com estatísticas de uso
CREATE OR REPLACE VIEW v_room_stats AS
SELECT
  r.id,
  r.name,
  r.is_active,
  COUNT(ra.id) FILTER (WHERE ra.starts_at::date = CURRENT_DATE) AS appointments_today,
  COUNT(ra.id) FILTER (WHERE ra.starts_at >= date_trunc('week', CURRENT_DATE)) AS appointments_this_week,
  COALESCE(
    SUM(EXTRACT(EPOCH FROM (ra.ends_at - ra.starts_at)) / 60)
    FILTER (WHERE ra.starts_at::date = CURRENT_DATE),
    0
  )::INT AS minutes_used_today,
  COALESCE(
    ROUND(
      SUM(EXTRACT(EPOCH FROM (ra.ends_at - ra.starts_at)) / 60)
      FILTER (WHERE ra.starts_at::date = CURRENT_DATE) / 600.0 * 100,
      1
    ),
    0
  ) AS occupancy_rate_today_pct
FROM rooms r
LEFT JOIN room_allocations ra ON ra.room_id = r.id
GROUP BY r.id, r.name, r.is_active;

COMMENT ON VIEW v_room_stats IS
'Estatísticas de uso de salas (hoje e semana)';
