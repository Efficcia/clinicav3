-- ============================================================================
-- SISTEMA DE ENSALAMENTO - CLINICIA
-- ============================================================================
-- Migração inicial: Tabelas, constraints e funções para ensalamento real
--
-- Funcionalidades:
-- - 6 salas físicas com características
-- - 5 profissionais com preferências de sala
-- - Alocação automática sem conflitos (exclusion constraint)
-- - Bloqueios de sala (manutenção, equipamento)
-- - Integração com appointments existente
-- ============================================================================

-- Pré-requisito: extensão para exclusion constraints com range types
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- TABELA: rooms (Salas físicas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,  -- ex: {"macas":1,"laser":true,"area_m2":15}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TABELA: professionals (Profissionais - compatível com sistema existente)
-- ============================================================================
-- Nota: Se já existe tabela de profissionais, adaptar para usar a existente
CREATE TABLE IF NOT EXISTS professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  specialty TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professionals_active ON professionals(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- TABELA: doctor_room_prefs (Preferências de sala por profissional)
-- ============================================================================
-- Prioridade menor = mais preferida (1 = primeira escolha)
CREATE TABLE IF NOT EXISTS doctor_room_prefs (
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  priority INT NOT NULL CHECK (priority > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (professional_id, room_id)
);

CREATE INDEX IF NOT EXISTS idx_prefs_professional ON doctor_room_prefs(professional_id);
CREATE INDEX IF NOT EXISTS idx_prefs_priority ON doctor_room_prefs(priority);

-- ============================================================================
-- TABELA: room_blockings (Bloqueios de sala)
-- ============================================================================
-- Para manutenção, limpeza, equipamento quebrado, etc.
CREATE TABLE IF NOT EXISTS room_blockings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_by UUID,  -- referência ao usuário que criou o bloqueio
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CONSTRAINT: impede sobreposição de bloqueios na mesma sala
  CONSTRAINT blocking_valid_range CHECK (starts_at < ends_at),
  EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(starts_at, ends_at, '[]') WITH &&
  )
);

CREATE INDEX IF NOT EXISTS idx_blockings_room ON room_blockings(room_id);
CREATE INDEX IF NOT EXISTS idx_blockings_time ON room_blockings(starts_at, ends_at);

-- ============================================================================
-- TABELA: room_allocations (Alocações de sala)
-- ============================================================================
-- Ligação entre appointments e rooms
-- CONSTRAINT DE OURO: uma sala nunca pode ter dois agendamentos sobrepostos
CREATE TABLE IF NOT EXISTS room_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE,  -- referência ao appointment existente
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- CONSTRAINT: tempo válido
  CONSTRAINT allocation_valid_range CHECK (starts_at < ends_at),

  -- CONSTRAINT DE OURO: ZERO conflitos de sala por tempo
  -- Se tentarem alocar a mesma sala em horário sobreposto, dá erro
  EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(starts_at, ends_at, '[]') WITH &&
  )
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_allocations_appointment ON room_allocations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_allocations_room ON room_allocations(room_id);
CREATE INDEX IF NOT EXISTS idx_allocations_professional ON room_allocations(professional_id);
CREATE INDEX IF NOT EXISTS idx_allocations_time ON room_allocations(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_allocations_room_time ON room_allocations(room_id, starts_at, ends_at);

-- ============================================================================
-- TABELA: allocation_audit (Auditoria de mudanças)
-- ============================================================================
CREATE TABLE IF NOT EXISTS allocation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  allocation_id UUID,
  appointment_id UUID,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'conflict'
  old_room_id UUID,
  new_room_id UUID,
  old_time TSTZRANGE,
  new_time TSTZRANGE,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_appointment ON allocation_audit(appointment_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON allocation_audit(created_at DESC);

-- ============================================================================
-- TRIGGER: atualizar updated_at automaticamente
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allocations_updated_at BEFORE UPDATE ON room_allocations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================
COMMENT ON TABLE rooms IS 'Salas físicas da clínica com características';
COMMENT ON TABLE professionals IS 'Profissionais de saúde (médicos, terapeutas, etc)';
COMMENT ON TABLE doctor_room_prefs IS 'Preferências de sala por profissional (menor prioridade = mais preferida)';
COMMENT ON TABLE room_blockings IS 'Bloqueios temporários de sala (manutenção, limpeza, etc)';
COMMENT ON TABLE room_allocations IS 'Alocação de salas para appointments - FONTE DA VERDADE';
COMMENT ON TABLE allocation_audit IS 'Histórico de todas as mudanças de alocação';

COMMENT ON COLUMN room_allocations.appointment_id IS 'ID do appointment no sistema de agenda existente';
COMMENT ON COLUMN rooms.features IS 'JSON com características da sala: {"macas":2,"laser":true,"area_m2":15}';
