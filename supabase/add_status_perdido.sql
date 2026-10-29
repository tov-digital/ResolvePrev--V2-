-- ==============================================================================
-- ADICIONAR / ATUALIZAR STATUS 'Perdido' NA TABELA UNIFICADA 'crm' (SE APLICÁVEL)
-- ==============================================================================
--
-- NOTA: No fluxo do ResolvePrev, ao marcar um lead como insucesso 
-- (Recusado, Perdido, Recuperação, No-Show, Triagem/Negado, Desqualificado),
-- o sistema atualiza diretamente a coluna `status` na tabela unificada `public.crm`.
--
-- Se você possui alguma CONSTRAINT CHECK na coluna `status` da tabela `public.crm`,
-- execute os comandos abaixo para permitir todos os status do sistema:

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'crm_status_check'
  ) THEN
    ALTER TABLE public.crm DROP CONSTRAINT crm_status_check;
    ALTER TABLE public.crm ADD CONSTRAINT crm_status_check 
      CHECK (status IN (
        'novo', 'qualificacao', 'acompanhamento', 'reuniao', 'proposta', 'planejamento',
        'documentacao', 'na_fila', 'requerido', 'exigencia', 'concedido',
        'recuperacao', 'no_show', 'recusado', 'perdido', 'negado', 'desqualificado'
      ));
  END IF;
END $$;
