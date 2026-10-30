-- ==============================================================================
-- ADICIONAR COLUNA 'pasta_fechada' NA TABELA UNIFICADA 'crm'
-- Tipo: BOOLEAN com valor padrão FALSE (OFF)
-- ==============================================================================

-- 1. Adicionar coluna pasta_fechada na tabela crm
ALTER TABLE IF EXISTS public.crm
  ADD COLUMN IF NOT EXISTS pasta_fechada BOOLEAN DEFAULT FALSE;

-- 2. Atualizar registros antigos para false caso estejam como null
UPDATE public.crm
SET pasta_fechada = FALSE
WHERE pasta_fechada IS NULL;

-- 3. Comentário explicativo
COMMENT ON COLUMN public.crm.pasta_fechada IS 'Status da pasta de documentos no Drive (fechada/aberta)';

