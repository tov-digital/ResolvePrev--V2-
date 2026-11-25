-- ==============================================================================
-- ATUALIZAÇÃO / SUPORTE AO CARGO 'analista' NA TABELA 'profiles'
-- ==============================================================================
-- Se a tabela 'profiles' tiver alguma restrição CHECK para a coluna 'role',
-- este script garante que 'analista' seja aceito sem erros.
-- ==============================================================================

DO $$
BEGIN
  -- Se houver restrição CHECK com 'role', atualiza permitindo 'analista'
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
      CHECK (role IN (
        'admin', 
        'operador_comercial', 
        'analista',
        'supervisor_comercial', 
        'operador_juridico', 
        'supervisor_juridico', 
        'usuario', 
        'advogado'
      ));
  END IF;
END $$;
