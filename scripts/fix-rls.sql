-- Script para corrigir incompatibilidades entre o esquema do banco e o código TypeScript
-- Execute este script no SQL Editor do Supabase

BEGIN;

-- 1. Corrigir nome da coluna birth_date para birthDate na tabela patients
ALTER TABLE public.patients RENAME COLUMN birth_date TO "birthDate";

-- 2. Corrigir nomes de outras colunas que podem estar inconsistentes
ALTER TABLE public.patients RENAME COLUMN medical_history TO "medicalHistory";
ALTER TABLE public.patients RENAME COLUMN emergency_contact TO "emergencyContact";
ALTER TABLE public.patients RENAME COLUMN created_at TO "createdAt";
ALTER TABLE public.patients RENAME COLUMN updated_at TO "updatedAt";
ALTER TABLE public.patients RENAME COLUMN created_by TO "createdBy";
ALTER TABLE public.patients RENAME COLUMN updated_by TO "updatedBy";

-- 3. Corrigir tabela appointments
ALTER TABLE public.appointments RENAME COLUMN patient_id TO "patientId";
ALTER TABLE public.appointments RENAME COLUMN doctor_id TO "doctorId";
ALTER TABLE public.appointments RENAME COLUMN doctor_name TO "doctorName";
ALTER TABLE public.appointments RENAME COLUMN payment_method TO "paymentMethod";
ALTER TABLE public.appointments RENAME COLUMN created_at TO "createdAt";
ALTER TABLE public.appointments RENAME COLUMN updated_at TO "updatedAt";

-- 4. Corrigir tabela financial_entries
ALTER TABLE public.financial_entries RENAME COLUMN payment_method TO "paymentMethod";
ALTER TABLE public.financial_entries RENAME COLUMN is_recurring TO "isRecurring";
ALTER TABLE public.financial_entries RENAME COLUMN recurring_config TO "recurringConfig";
ALTER TABLE public.financial_entries RENAME COLUMN appointment_id TO "appointmentId";
ALTER TABLE public.financial_entries RENAME COLUMN created_at TO "createdAt";
ALTER TABLE public.financial_entries RENAME COLUMN updated_at TO "updatedAt";

-- 5. Corrigir tabela waitlist
ALTER TABLE public.waitlist RENAME COLUMN patient_id TO "patientId";
ALTER TABLE public.waitlist RENAME COLUMN patient_name TO "patientName";
ALTER TABLE public.waitlist RENAME COLUMN preferred_doctor TO "preferredDoctor";
ALTER TABLE public.waitlist RENAME COLUMN preferred_date TO "preferredDate";
ALTER TABLE public.waitlist RENAME COLUMN created_at TO "createdAt";

-- 6. Corrigir tabela professionals
ALTER TABLE public.professionals RENAME COLUMN created_at TO "createdAt";
ALTER TABLE public.professionals RENAME COLUMN updated_at TO "updatedAt";

-- 7. Corrigir tabela team_members
ALTER TABLE public.team_members RENAME COLUMN last_login TO "lastLogin";
ALTER TABLE public.team_members RENAME COLUMN created_at TO "createdAt";
ALTER TABLE public.team_members RENAME COLUMN updated_at TO "updatedAt";

-- 8. Corrigir tabela companies
ALTER TABLE public.companies RENAME COLUMN business_hours TO "businessHours";
ALTER TABLE public.companies RENAME COLUMN ai_config TO "aiConfig";
ALTER TABLE public.companies RENAME COLUMN whatsapp_config TO "whatsappConfig";
ALTER TABLE public.companies RENAME COLUMN created_at TO "createdAt";
ALTER TABLE public.companies RENAME COLUMN updated_at TO "updatedAt";

-- 9. Atualizar triggers para usar os novos nomes de colunas
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
DROP TRIGGER IF EXISTS update_professionals_updated_at ON public.professionals;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
DROP TRIGGER IF EXISTS update_patients_updated_at ON public.patients;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_financial_entries_updated_at ON public.financial_entries;

-- Recriar triggers com nomes corretos
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_entries_updated_at BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Atualizar função trigger para usar o nome correto da coluna
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 11. Atualizar índices se necessário
DROP INDEX IF EXISTS idx_patients_email;
DROP INDEX IF EXISTS idx_patients_cpf;
DROP INDEX IF EXISTS idx_patients_phone;
DROP INDEX IF EXISTS idx_appointments_patient_id;

CREATE INDEX idx_patients_email ON public.patients(email);
CREATE INDEX idx_patients_cpf ON public.patients(cpf);
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_appointments_patient_id ON public.appointments("patientId");

-- 12. Permitir acesso anônimo para todas as operações (necessário para Netlify Functions)
DROP POLICY IF EXISTS "allow anon read patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.patients;

CREATE POLICY "Allow anon full access patients" ON public.patients FOR ALL USING (true);

DROP POLICY IF EXISTS "allow anon read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.appointments;

CREATE POLICY "Allow anon full access appointments" ON public.appointments FOR ALL USING (true);

DROP POLICY IF EXISTS "allow anon read financial_entries" ON public.financial_entries;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.financial_entries;

CREATE POLICY "Allow anon full access financial_entries" ON public.financial_entries FOR ALL USING (true);

DROP POLICY IF EXISTS "allow anon read waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.waitlist;

CREATE POLICY "Allow anon full access waitlist" ON public.waitlist FOR ALL USING (true);

DROP POLICY IF EXISTS "allow anon read professionals" ON public.professionals;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.professionals;

CREATE POLICY "Allow anon full access professionals" ON public.professionals FOR ALL USING (true);

DROP POLICY IF EXISTS "allow anon read team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.team_members;

CREATE POLICY "Allow anon full access team_members" ON public.team_members FOR ALL USING (true);

DROP POLICY IF EXISTS "allow anon read companies" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.companies;

CREATE POLICY "Allow anon full access companies" ON public.companies FOR ALL USING (true);

COMMIT;

-- Verificar se as alterações foram aplicadas com sucesso
SELECT 'Schema corrections applied successfully!' as status;

-- Mostrar estrutura da tabela patients para confirmar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'patients' AND table_schema = 'public'
ORDER BY ordinal_position;