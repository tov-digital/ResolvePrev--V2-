-- ==============================================================================
-- ADICIONAR COLUNA 'data_reuniao' NA TABELA UNIFICADA 'crm'
-- Tipo: TIMESTAMPTZ (grava data, hora e fuso horário ISO 8601)
-- ==============================================================================

-- 1. Adicionar coluna data_reuniao na tabela crm
ALTER TABLE IF EXISTS public.crm
  ADD COLUMN IF NOT EXISTS data_reuniao TIMESTAMPTZ DEFAULT NULL;

-- Comentário explicativo na coluna
COMMENT ON COLUMN public.crm.data_reuniao IS 'Data e hora do agendamento de reunião com o cliente';

