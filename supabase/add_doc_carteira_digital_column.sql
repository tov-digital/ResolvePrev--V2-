-- ==============================================================================
-- ADICIONAR COLUNA 'doc_carteira_digital' NA TABELA UNIFICADA 'CRM'
-- Documento Obrigatório: Carteira de Trabalho Digital
-- Tipo: VARCHAR(50) ou TEXT com valor padrão 'Pendente'
-- ==============================================================================

-- 1. Adicionar na tabela unificada CRM
ALTER TABLE IF EXISTS public."CRM"
  ADD COLUMN IF NOT EXISTS doc_carteira_digital TEXT DEFAULT 'Pendente';

-- 2. Garantir que registros existentes que estejam NULL sejam preenchidos como 'Pendente'
UPDATE public."CRM"
SET doc_carteira_digital = 'Pendente'
WHERE doc_carteira_digital IS NULL;
