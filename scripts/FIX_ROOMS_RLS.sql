-- ==========================================
-- CORREÇÃO: RLS e user_id para tabela ROOMS
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- Adicionar user_id se não existir
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_rooms_user_id ON public.rooms(user_id);

-- Ativar RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Users can view own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can insert own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can update own rooms" ON public.rooms;
DROP POLICY IF EXISTS "Users can delete own rooms" ON public.rooms;

-- Criar policies novas
CREATE POLICY "Users can view own rooms"
  ON public.rooms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rooms"
  ON public.rooms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rooms"
  ON public.rooms FOR DELETE
  USING (auth.uid() = user_id);

-- Criar trigger para auto-set user_id
CREATE OR REPLACE FUNCTION set_room_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_set_room_user_id ON public.rooms;
CREATE TRIGGER trigger_set_room_user_id
  BEFORE INSERT ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION set_room_user_id();

-- Atualizar salas existentes com user_id do usuário atual
-- ATENÇÃO: Execute isso DEPOIS de fazer login no sistema
UPDATE public.rooms
SET user_id = auth.uid()
WHERE user_id IS NULL;

-- Verificar se funcionou
SELECT id, name, user_id, "isActive"
FROM public.rooms
LIMIT 5;

-- ==========================================
-- ✅ CORREÇÃO CONCLUÍDA!
-- ==========================================
