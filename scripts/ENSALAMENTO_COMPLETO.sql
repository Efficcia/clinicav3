-- ==========================================
-- SISTEMA DE ENSALAMENTO - SETUP COMPLETO
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- ==========================================
-- PARTE 0: HABILITAR EXTENSÕES NECESSÁRIAS
-- ==========================================

-- Extensão para índices GIST com UUID
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ==========================================
-- PARTE 1: ATUALIZAR TABELA ROOMS
-- ==========================================

-- Adicionar colunas que faltam na tabela rooms
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';

-- Migrar dados de status para isActive se necessário
UPDATE public.rooms
SET "isActive" = (status = 'available')
WHERE "isActive" IS NULL;

-- ==========================================
-- PARTE 2: CRIAR TABELAS DE ENSALAMENTO
-- ==========================================

-- Tabela de alocações de salas
CREATE TABLE IF NOT EXISTS public.room_allocations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "appointmentId" UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  "roomId" UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  "professionalId" UUID NOT NULL REFERENCES public.professionals(id),
  "startsAt" TIMESTAMPTZ NOT NULL,
  "endsAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ DEFAULT now(),
  "updatedAt" TIMESTAMPTZ DEFAULT now(),

  -- Constraint: não permitir sobreposição de horários na mesma sala
  CONSTRAINT no_room_overlap EXCLUDE USING gist (
    "roomId" WITH =,
    tstzrange("startsAt", "endsAt") WITH &&
  )
);

-- Tabela de bloqueios de salas
CREATE TABLE IF NOT EXISTS public.room_blocking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "roomId" UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  "startsAt" TIMESTAMPTZ NOT NULL,
  "endsAt" TIMESTAMPTZ NOT NULL,
  reason TEXT,
  "createdBy" UUID REFERENCES auth.users(id),
  "createdAt" TIMESTAMPTZ DEFAULT now(),

  -- Constraint: não permitir sobreposição de bloqueios
  CONSTRAINT no_blocking_overlap EXCLUDE USING gist (
    "roomId" WITH =,
    tstzrange("startsAt", "endsAt") WITH &&
  )
);

-- Tabela de preferências de médicos por salas
CREATE TABLE IF NOT EXISTS public.doctor_room_preferences (
  "professionalId" UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  "roomId" UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  priority INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ DEFAULT now(),

  PRIMARY KEY ("professionalId", "roomId")
);

-- Tabela de auditoria de alocações
CREATE TABLE IF NOT EXISTS public.allocation_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "allocationId" UUID REFERENCES public.room_allocations(id) ON DELETE SET NULL,
  "appointmentId" UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'conflict')),
  "oldRoomId" UUID,
  "newRoomId" UUID,
  "oldTime" TIMESTAMPTZ,
  "newTime" TIMESTAMPTZ,
  reason TEXT,
  "createdBy" UUID REFERENCES auth.users(id),
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- PARTE 3: CRIAR ÍNDICES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_room_allocations_appointment ON public.room_allocations("appointmentId");
CREATE INDEX IF NOT EXISTS idx_room_allocations_room ON public.room_allocations("roomId");
CREATE INDEX IF NOT EXISTS idx_room_allocations_professional ON public.room_allocations("professionalId");
CREATE INDEX IF NOT EXISTS idx_room_allocations_time ON public.room_allocations("startsAt", "endsAt");

CREATE INDEX IF NOT EXISTS idx_room_blocking_room ON public.room_blocking("roomId");
CREATE INDEX IF NOT EXISTS idx_room_blocking_time ON public.room_blocking("startsAt", "endsAt");

CREATE INDEX IF NOT EXISTS idx_doctor_preferences_professional ON public.doctor_room_preferences("professionalId");
CREATE INDEX IF NOT EXISTS idx_doctor_preferences_room ON public.doctor_room_preferences("roomId");

CREATE INDEX IF NOT EXISTS idx_allocation_audit_allocation ON public.allocation_audit("allocationId");
CREATE INDEX IF NOT EXISTS idx_allocation_audit_appointment ON public.allocation_audit("appointmentId");

-- ==========================================
-- PARTE 4: CRIAR VIEWS
-- ==========================================

-- View: Estatísticas de uso das salas
CREATE OR REPLACE VIEW v_room_stats AS
SELECT
  r.id,
  r.name,
  r."isActive" as is_active,

  -- Consultas hoje
  COUNT(DISTINCT CASE
    WHEN DATE(ra."startsAt") = CURRENT_DATE
    THEN ra.id
  END) as appointments_today,

  -- Consultas esta semana
  COUNT(DISTINCT CASE
    WHEN DATE(ra."startsAt") >= DATE_TRUNC('week', CURRENT_DATE)
    AND DATE(ra."startsAt") < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
    THEN ra.id
  END) as appointments_this_week,

  -- Minutos usados hoje
  COALESCE(SUM(CASE
    WHEN DATE(ra."startsAt") = CURRENT_DATE
    THEN EXTRACT(EPOCH FROM (ra."endsAt" - ra."startsAt")) / 60
  END), 0) as minutes_used_today,

  -- Taxa de ocupação hoje (assumindo 10h de expediente = 600 min)
  ROUND(
    COALESCE(SUM(CASE
      WHEN DATE(ra."startsAt") = CURRENT_DATE
      THEN EXTRACT(EPOCH FROM (ra."endsAt" - ra."startsAt")) / 60
    END), 0) / 600 * 100,
    1
  ) as occupancy_rate_today_pct

FROM public.rooms r
LEFT JOIN public.room_allocations ra ON ra."roomId" = r.id
GROUP BY r.id, r.name, r."isActive";

-- View: Alocações completas (com joins)
CREATE OR REPLACE VIEW v_room_allocations_full AS
SELECT
  ra.id,
  ra."appointmentId" as appointment_id,
  ra."roomId" as room_id,
  r.name as room_name,
  ra."professionalId" as professional_id,
  p.name as professional_name,
  p.specialty as professional_specialty,
  ra."startsAt" as starts_at,
  ra."endsAt" as ends_at,
  EXTRACT(EPOCH FROM (ra."endsAt" - ra."startsAt")) / 60 as duration_minutes,
  ra."createdAt" as created_at,
  ra."updatedAt" as updated_at
FROM public.room_allocations ra
INNER JOIN public.rooms r ON r.id = ra."roomId"
INNER JOIN public.professionals p ON p.id = ra."professionalId";

-- ==========================================
-- PARTE 5: CRIAR RLS POLICIES
-- ==========================================

-- RLS para room_allocations
ALTER TABLE public.room_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own allocations" ON public.room_allocations;
CREATE POLICY "Users can view own allocations"
  ON public.room_allocations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = room_allocations."appointmentId"
    AND a.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can insert own allocations" ON public.room_allocations;
CREATE POLICY "Users can insert own allocations"
  ON public.room_allocations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = room_allocations."appointmentId"
    AND a.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update own allocations" ON public.room_allocations;
CREATE POLICY "Users can update own allocations"
  ON public.room_allocations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = room_allocations."appointmentId"
    AND a.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete own allocations" ON public.room_allocations;
CREATE POLICY "Users can delete own allocations"
  ON public.room_allocations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = room_allocations."appointmentId"
    AND a.user_id = auth.uid()
  ));

-- RLS para room_blocking
ALTER TABLE public.room_blocking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own blockings" ON public.room_blocking;
CREATE POLICY "Users can view own blockings"
  ON public.room_blocking FOR SELECT
  USING ("createdBy" = auth.uid());

DROP POLICY IF EXISTS "Users can insert own blockings" ON public.room_blocking;
CREATE POLICY "Users can insert own blockings"
  ON public.room_blocking FOR INSERT
  WITH CHECK ("createdBy" = auth.uid());

DROP POLICY IF EXISTS "Users can update own blockings" ON public.room_blocking;
CREATE POLICY "Users can update own blockings"
  ON public.room_blocking FOR UPDATE
  USING ("createdBy" = auth.uid());

DROP POLICY IF EXISTS "Users can delete own blockings" ON public.room_blocking;
CREATE POLICY "Users can delete own blockings"
  ON public.room_blocking FOR DELETE
  USING ("createdBy" = auth.uid());

-- RLS para doctor_room_preferences
ALTER TABLE public.doctor_room_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON public.doctor_room_preferences;
CREATE POLICY "Users can view own preferences"
  ON public.doctor_room_preferences FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = doctor_room_preferences."professionalId"
    AND p.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can manage own preferences" ON public.doctor_room_preferences;
CREATE POLICY "Users can manage own preferences"
  ON public.doctor_room_preferences FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = doctor_room_preferences."professionalId"
    AND p.user_id = auth.uid()
  ));

-- RLS para allocation_audit
ALTER TABLE public.allocation_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit" ON public.allocation_audit;
CREATE POLICY "Users can view own audit"
  ON public.allocation_audit FOR SELECT
  USING ("createdBy" = auth.uid());

DROP POLICY IF EXISTS "Users can insert audit" ON public.allocation_audit;
CREATE POLICY "Users can insert audit"
  ON public.allocation_audit FOR INSERT
  WITH CHECK ("createdBy" = auth.uid());

-- ==========================================
-- PARTE 6: CRIAR TRIGGERS
-- ==========================================

-- Trigger para atualizar updatedAt
CREATE OR REPLACE FUNCTION update_room_allocation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_room_allocation_timestamp ON public.room_allocations;
CREATE TRIGGER trigger_update_room_allocation_timestamp
  BEFORE UPDATE ON public.room_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_room_allocation_timestamp();

-- Trigger para auditoria de alocações
CREATE OR REPLACE FUNCTION audit_room_allocation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.allocation_audit (
      "allocationId",
      "appointmentId",
      action,
      "newRoomId",
      "newTime",
      "createdBy"
    ) VALUES (
      NEW.id,
      NEW."appointmentId",
      'created',
      NEW."roomId",
      NEW."startsAt",
      auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.allocation_audit (
      "allocationId",
      "appointmentId",
      action,
      "oldRoomId",
      "newRoomId",
      "oldTime",
      "newTime",
      "createdBy"
    ) VALUES (
      NEW.id,
      NEW."appointmentId",
      'updated',
      OLD."roomId",
      NEW."roomId",
      OLD."startsAt",
      NEW."startsAt",
      auth.uid()
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.allocation_audit (
      "allocationId",
      "appointmentId",
      action,
      "oldRoomId",
      "oldTime",
      "createdBy"
    ) VALUES (
      OLD.id,
      OLD."appointmentId",
      'deleted',
      OLD."roomId",
      OLD."startsAt",
      auth.uid()
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_audit_room_allocation ON public.room_allocations;
CREATE TRIGGER trigger_audit_room_allocation
  AFTER INSERT OR UPDATE OR DELETE ON public.room_allocations
  FOR EACH ROW
  EXECUTE FUNCTION audit_room_allocation();

-- ==========================================
-- PARTE 7: FUNÇÃO RPC PARA ALOCAR SALA
-- ==========================================

CREATE OR REPLACE FUNCTION allocate_room(
  p_appointment_id UUID,
  p_professional_id UUID,
  p_starts_at TIMESTAMPTZ,
  p_ends_at TIMESTAMPTZ
)
RETURNS TABLE (
  room_id UUID,
  room_name TEXT,
  allocation_id UUID
) AS $$
DECLARE
  v_room_id UUID;
  v_room_name TEXT;
  v_allocation_id UUID;
BEGIN
  -- Buscar sala disponível (primeiro por preferência, depois por menor carga)
  SELECT r.id, r.name INTO v_room_id, v_room_name
  FROM public.rooms r
  LEFT JOIN public.doctor_room_preferences drp
    ON drp."roomId" = r.id AND drp."professionalId" = p_professional_id
  WHERE r."isActive" = true
    -- Verificar se não há alocação no período
    AND NOT EXISTS (
      SELECT 1 FROM public.room_allocations ra
      WHERE ra."roomId" = r.id
        AND tstzrange(ra."startsAt", ra."endsAt") && tstzrange(p_starts_at, p_ends_at)
    )
    -- Verificar se não há bloqueio no período
    AND NOT EXISTS (
      SELECT 1 FROM public.room_blocking rb
      WHERE rb."roomId" = r.id
        AND tstzrange(rb."startsAt", rb."endsAt") && tstzrange(p_starts_at, p_ends_at)
    )
  ORDER BY
    drp.priority DESC NULLS LAST,
    (SELECT COUNT(*) FROM public.room_allocations ra2
     WHERE ra2."roomId" = r.id
     AND DATE(ra2."startsAt") = DATE(p_starts_at)) ASC
  LIMIT 1;

  -- Se encontrou sala, criar alocação
  IF v_room_id IS NOT NULL THEN
    INSERT INTO public.room_allocations (
      "appointmentId",
      "roomId",
      "professionalId",
      "startsAt",
      "endsAt"
    ) VALUES (
      p_appointment_id,
      v_room_id,
      p_professional_id,
      p_starts_at,
      p_ends_at
    ) RETURNING id INTO v_allocation_id;

    RETURN QUERY SELECT v_room_id, v_room_name, v_allocation_id;
  ELSE
    -- Nenhuma sala disponível
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::UUID;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- PARTE 8: POPULAR ROOMS COM DADOS MOCK
-- ==========================================

-- Apenas se a tabela estiver vazia
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.rooms LIMIT 1) THEN
    INSERT INTO public.rooms (name, "isActive", features, user_id) VALUES
    ('Sala 1 - Consultório Principal', true, '{"area_m2": 20, "macas": 1, "computador": true, "ar_condicionado": true, "pia": true}'::jsonb, auth.uid()),
    ('Sala 2 - Consultório Pequeno', true, '{"area_m2": 12, "macas": 1, "computador": true, "ar_condicionado": true}'::jsonb, auth.uid()),
    ('Sala 3 - Procedimentos', true, '{"area_m2": 25, "macas": 2, "equipamentos_cirurgicos": true, "laser": true, "pia": true, "ar_condicionado": true}'::jsonb, auth.uid()),
    ('Sala 4 - Terapia', true, '{"area_m2": 15, "macas": 1, "som_ambiente": true, "iluminacao_ajustavel": true}'::jsonb, auth.uid()),
    ('Sala 5 - Exames', true, '{"area_m2": 18, "maca_exame": 1, "ultrassom": true, "ecg": true, "computador": true}'::jsonb, auth.uid()),
    ('Sala 6 - Multiuso', true, '{"area_m2": 30, "macas": 2, "multiplo_uso": true, "ar_condicionado": true}'::jsonb, auth.uid());
  END IF;
END $$;

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================

-- Contar tabelas criadas
SELECT
  COUNT(*) FILTER (WHERE table_name = 'room_allocations') as allocations_table,
  COUNT(*) FILTER (WHERE table_name = 'room_blocking') as blocking_table,
  COUNT(*) FILTER (WHERE table_name = 'doctor_room_preferences') as preferences_table,
  COUNT(*) FILTER (WHERE table_name = 'allocation_audit') as audit_table
FROM information_schema.tables
WHERE table_schema = 'public';

-- Verificar views
SELECT
  COUNT(*) FILTER (WHERE table_name = 'v_room_stats') as stats_view,
  COUNT(*) FILTER (WHERE table_name = 'v_room_allocations_full') as allocations_view
FROM information_schema.views
WHERE table_schema = 'public';

-- Verificar função RPC
SELECT COUNT(*) as allocate_function
FROM pg_proc
WHERE proname = 'allocate_room';

-- ==========================================
-- ✅ SETUP DE ENSALAMENTO CONCLUÍDO!
-- ==========================================
