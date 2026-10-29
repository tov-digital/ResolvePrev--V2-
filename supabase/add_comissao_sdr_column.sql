-- ==============================================================================
-- ADICIONAR COLUNA 'comissao_sdr' NA TABELA UNIFICADA 'CRM'
-- Tipo: BOOLEAN com valor padrão FALSE (OFF)
-- ==============================================================================

-- 1. Adicionar coluna comissao_sdr na tabela CRM
ALTER TABLE IF EXISTS public."CRM"
  ADD COLUMN IF NOT EXISTS comissao_sdr BOOLEAN DEFAULT FALSE;

-- 2. Atualizar registros antigos para false caso estejam como null
UPDATE public."CRM"
SET comissao_sdr = FALSE
WHERE comissao_sdr IS NULL;
