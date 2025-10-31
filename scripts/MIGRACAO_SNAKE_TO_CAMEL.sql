-- ==========================================
-- MIGRAÇÃO: snake_case → camelCase
-- Execute este script no SQL Editor do Supabase
-- Corrige incompatibilidade entre TypeScript e PostgreSQL
-- ==========================================

-- ==========================================
-- TABELA: patients
-- ==========================================
ALTER TABLE public.patients
  RENAME COLUMN birth_date TO "birthDate";

ALTER TABLE public.patients
  RENAME COLUMN medical_history TO "medicalHistory";

ALTER TABLE public.patients
  RENAME COLUMN emergency_contact TO "emergencyContact";

ALTER TABLE public.patients
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.patients
  RENAME COLUMN updated_at TO "updatedAt";

-- ==========================================
-- TABELA: appointments
-- ==========================================
ALTER TABLE public.appointments
  RENAME COLUMN patient_id TO "patientId";

ALTER TABLE public.appointments
  RENAME COLUMN doctor_id TO "doctorId";

ALTER TABLE public.appointments
  RENAME COLUMN doctor_name TO "doctorName";

ALTER TABLE public.appointments
  RENAME COLUMN payment_method TO "paymentMethod";

ALTER TABLE public.appointments
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.appointments
  RENAME COLUMN updated_at TO "updatedAt";

-- ==========================================
-- TABELA: financial_entries
-- ==========================================
ALTER TABLE public.financial_entries
  RENAME COLUMN payment_method TO "paymentMethod";

ALTER TABLE public.financial_entries
  RENAME COLUMN is_recurring TO "isRecurring";

ALTER TABLE public.financial_entries
  RENAME COLUMN recurring_config TO "recurringConfig";

ALTER TABLE public.financial_entries
  RENAME COLUMN appointment_id TO "appointmentId";

ALTER TABLE public.financial_entries
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.financial_entries
  RENAME COLUMN updated_at TO "updatedAt";

-- ==========================================
-- TABELA: waitlist
-- ==========================================
ALTER TABLE public.waitlist
  RENAME COLUMN patient_id TO "patientId";

ALTER TABLE public.waitlist
  RENAME COLUMN patient_name TO "patientName";

ALTER TABLE public.waitlist
  RENAME COLUMN preferred_doctor TO "preferredDoctor";

ALTER TABLE public.waitlist
  RENAME COLUMN preferred_date TO "preferredDate";

ALTER TABLE public.waitlist
  RENAME COLUMN created_at TO "createdAt";

-- ==========================================
-- TABELA: professionals
-- ==========================================
ALTER TABLE public.professionals
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.professionals
  RENAME COLUMN updated_at TO "updatedAt";

-- ==========================================
-- TABELA: team_members
-- ==========================================
ALTER TABLE public.team_members
  RENAME COLUMN last_login TO "lastLogin";

ALTER TABLE public.team_members
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.team_members
  RENAME COLUMN updated_at TO "updatedAt";

-- ==========================================
-- TABELA: rooms
-- ==========================================
ALTER TABLE public.rooms
  RENAME COLUMN current_patient_id TO "currentPatientId";

ALTER TABLE public.rooms
  RENAME COLUMN current_patient_name TO "currentPatientName";

ALTER TABLE public.rooms
  RENAME COLUMN entered_at TO "enteredAt";

ALTER TABLE public.rooms
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.rooms
  RENAME COLUMN updated_at TO "updatedAt";

-- ==========================================
-- TABELA: companies
-- ==========================================
ALTER TABLE public.companies
  RENAME COLUMN business_hours TO "businessHours";

ALTER TABLE public.companies
  RENAME COLUMN ai_config TO "aiConfig";

ALTER TABLE public.companies
  RENAME COLUMN whatsapp_config TO "whatsappConfig";

ALTER TABLE public.companies
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.companies
  RENAME COLUMN updated_at TO "updatedAt";

-- ==========================================
-- TABELA: user_profiles
-- ==========================================
ALTER TABLE public.user_profiles
  RENAME COLUMN created_at TO "createdAt";

ALTER TABLE public.user_profiles
  RENAME COLUMN updated_at TO "updatedAt";

-- ==========================================
-- ATUALIZAR TRIGGERS (updated_at → updatedAt)
-- ==========================================

-- Recriar função update_updated_at para usar camelCase
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar triggers
DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_entries_updated_at ON public.financial_entries;
CREATE TRIGGER update_financial_entries_updated_at
  BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_professionals_updated_at ON public.professionals;
CREATE TRIGGER update_professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================

-- Execute esta query para verificar se funcionou:
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'patients'
ORDER BY ordinal_position;

-- Deve mostrar: birthDate, medicalHistory, emergencyContact, createdAt, updatedAt

-- ==========================================
-- ✅ MIGRAÇÃO CONCLUÍDA!
-- ==========================================
-- Agora todas as colunas estão em camelCase
-- compatível com o código TypeScript
-- ==========================================
