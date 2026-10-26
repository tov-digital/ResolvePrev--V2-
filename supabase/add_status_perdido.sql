-- ==============================================================================
-- ADICIONAR / ATUALIZAR STATUS 'Perdido' NO CRM (SE APLICÁVEL NO BANCO)
-- ==============================================================================
--
-- NOTA: No fluxo do ResolvePrev, ao marcar um lead como insucesso 
-- (Recusado, Perdido, Recuperação, No-Show, etc.), o sistema:
-- 1. Envia os dados completos com opcao_selecionada = 'perdido' e 
--    status_selecionado = 'Perdido' via webhook ao n8n:
--    https://n8n.srv1077266.hstgr.cloud/webhook/insucessos-rp
-- 2. No n8n / tabela de insucessos, o registro é arquivado/registrado.
--
-- Se você possui alguma CONSTRAINT CHECK na coluna `status` das tabelas 
-- (oportunidades_crm, operacao_crm ou insucessos_crm), execute os comandos abaixo
-- para permitir o novo status 'Perdido':

-- 1. Caso sua tabela insucessos_crm valide valores permitidos na coluna status:
DO $$
BEGIN
  -- Se houver check constraint com lista de status em insucessos_crm, 
  -- você pode recriá-la ou ampliá-la:
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'insucessos_crm_status_check'
  ) THEN
    ALTER TABLE public.insucessos_crm DROP CONSTRAINT insucessos_crm_status_check;
    ALTER TABLE public.insucessos_crm ADD CONSTRAINT insucessos_crm_status_check 
      CHECK (status IN ('recuperacao', 'no_show', 'recusado', 'perdido', 'negado', 'desqualificado', 'Recusado', 'Perdido', 'Recuperação', 'No-Show', 'Triagem', 'Desqualificado'));
  END IF;
END $$;

-- 2. Caso a tabela guarde o status como texto simples (padrão Supabase/Postgres):
-- Nenhuma alteração estrutural no banco é obrigatória, pois o campo aceita strings livremente.
