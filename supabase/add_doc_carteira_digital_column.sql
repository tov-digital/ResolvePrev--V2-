-- ==============================================================================
-- ADICIONAR COLUNA 'doc_carteira_digital' NAS TABELAS DO CRM
-- Documento Obrigatório: Carteira de Trabalho Digital
-- Tipo: VARCHAR(50) ou TEXT com valor padrão 'Pendente'
-- ==============================================================================

-- 1. Adicionar na tabela de Operação (operacao_crm)
ALTER TABLE IF EXISTS public.operacao_crm
  ADD COLUMN IF NOT EXISTS doc_carteira_digital TEXT DEFAULT 'Pendente';

-- 2. Adicionar na tabela Comercial (oportunidades_crm)
ALTER TABLE IF EXISTS public.oportunidades_crm
  ADD COLUMN IF NOT EXISTS doc_carteira_digital TEXT DEFAULT 'Pendente';

-- 3. Adicionar na tabela Judicial / Insucessos (insucessos_crm)
ALTER TABLE IF EXISTS public.insucessos_crm
  ADD COLUMN IF NOT EXISTS doc_carteira_digital TEXT DEFAULT 'Pendente';

-- 4. Garantir que registros existentes que estejam NULL sejam preenchidos como 'Pendente'
UPDATE public.operacao_crm
SET doc_carteira_digital = 'Pendente'
WHERE doc_carteira_digital IS NULL;

UPDATE public.oportunidades_crm
SET doc_carteira_digital = 'Pendente'
WHERE doc_carteira_digital IS NULL;

UPDATE public.insucessos_crm
SET doc_carteira_digital = 'Pendente'
WHERE doc_carteira_digital IS NULL;
