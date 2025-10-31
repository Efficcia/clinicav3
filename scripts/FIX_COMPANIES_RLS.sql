-- Adicionar user_id à tabela companies se não existir
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
DROP POLICY IF EXISTS "Users can insert own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update own company" ON public.companies;
DROP POLICY IF EXISTS "Users can delete own company" ON public.companies;

-- Criar policies para RLS
CREATE POLICY "Users can view own company"
  ON public.companies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company"
  ON public.companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own company"
  ON public.companies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own company"
  ON public.companies FOR DELETE
  USING (auth.uid() = user_id);

-- Criar trigger para auto-preencher user_id
DROP TRIGGER IF EXISTS trigger_set_company_user_id ON public.companies;
DROP FUNCTION IF EXISTS set_company_user_id();

CREATE OR REPLACE FUNCTION set_company_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_set_company_user_id
  BEFORE INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION set_company_user_id();

-- Atualizar empresas existentes sem user_id (se houver)
-- IMPORTANTE: Substitua 'SEU_USER_ID_AQUI' pelo seu user_id real
-- Para descobrir seu user_id, execute: SELECT auth.uid();
-- UPDATE public.companies
-- SET user_id = 'SEU_USER_ID_AQUI'
-- WHERE user_id IS NULL;
