-- ==============================================================================
-- ADICIONAR COLUNA 'comissao_sdr' NA TABELA 'operacao_crm' (E 'oportunidades_crm')
-- Tipo: BOOLEAN com valor padrão FALSE (OFF)
-- ==============================================================================

-- 1. Adicionar coluna comissao_sdr na tabela operacao_crm
ALTER TABLE IF EXISTS public.operacao_crm
  ADD COLUMN IF NOT EXISTS comissao_sdr BOOLEAN DEFAULT FALSE;

-- 2. (Opcional/Recomendado) Adicionar também em oportunidades_crm para manter paridade se o card for migrado
ALTER TABLE IF EXISTS public.oportunidades_crm
  ADD COLUMN IF NOT EXISTS comissao_sdr BOOLEAN DEFAULT FALSE;

-- 3. Atualizar registros antigos para false caso estejam como null
UPDATE public.operacao_crm
SET comissao_sdr = FALSE
WHERE comissao_sdr IS NULL;
