-- ==============================================================================
-- ADICIONAR COLUNA 'comissao_sdr' NA TABELA UNIFICADA 'crm'
-- Tipo: BOOLEAN com valor padrão FALSE (OFF)
-- ==============================================================================

-- 1. Adicionar coluna comissao_sdr na tabela crm
ALTER TABLE IF EXISTS public.crm
  ADD COLUMN IF NOT EXISTS comissao_sdr BOOLEAN DEFAULT FALSE;

-- 2. Atualizar registros antigos para false caso estejam como null
UPDATE public.crm
SET comissao_sdr = FALSE
WHERE comissao_sdr IS NULL;
