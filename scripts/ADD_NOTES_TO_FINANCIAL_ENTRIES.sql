-- Adiciona coluna notes à tabela financial_entries
ALTER TABLE public.financial_entries
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Adiciona comentário à coluna
COMMENT ON COLUMN public.financial_entries.notes IS 'Observações adicionais sobre o lançamento financeiro';
