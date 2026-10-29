-- ==============================================================================
-- TRIGGER PARA ATUALIZAR AUTOMATICAMENTE A COLUNA 'atualizado_em'
-- Tabela Unificada: public.crm
-- ==============================================================================

-- 1. Garantir que a coluna 'atualizado_em' exista com timezone na tabela crm
ALTER TABLE IF EXISTS public.crm 
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now();

-- 2. Criar ou substituir a função de gatilho (Trigger Function)
CREATE OR REPLACE FUNCTION public.handle_update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  -- Define a coluna atualizado_em com a data e hora do momento exato da alteração
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar o Trigger BEFORE UPDATE para a tabela unificada crm
DROP TRIGGER IF EXISTS trigger_atualizado_em_crm ON public.crm;
CREATE TRIGGER trigger_atualizado_em_crm
  BEFORE UPDATE ON public.crm
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_atualizado_em();
