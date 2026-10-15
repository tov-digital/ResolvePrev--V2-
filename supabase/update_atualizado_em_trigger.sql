-- ==============================================================================
-- TRIGGER PARA ATUALIZAR AUTOMATICAMENTE A COLUNA 'atualizado_em'
-- Tabelas: oportunidades_crm, operacao_crm, insucessos_crm
-- ==============================================================================

-- 1. Garantir que a coluna 'atualizado_em' exista com timezone em cada tabela
ALTER TABLE IF EXISTS public.oportunidades_crm 
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now();

ALTER TABLE IF EXISTS public.operacao_crm 
  ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT now();

ALTER TABLE IF EXISTS public.insucessos_crm 
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

-- 3. Criar os Triggers BEFORE UPDATE para cada uma das 3 tabelas

-- Tabela: oportunidades_crm
DROP TRIGGER IF EXISTS trigger_atualizado_em_oportunidades ON public.oportunidades_crm;
CREATE TRIGGER trigger_atualizado_em_oportunidades
  BEFORE UPDATE ON public.oportunidades_crm
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_atualizado_em();

-- Tabela: operacao_crm
DROP TRIGGER IF EXISTS trigger_atualizado_em_operacao ON public.operacao_crm;
CREATE TRIGGER trigger_atualizado_em_operacao
  BEFORE UPDATE ON public.operacao_crm
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_atualizado_em();

-- Tabela: insucessos_crm
DROP TRIGGER IF EXISTS trigger_atualizado_em_insucessos ON public.insucessos_crm;
CREATE TRIGGER trigger_atualizado_em_insucessos
  BEFORE UPDATE ON public.insucessos_crm
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_update_atualizado_em();
