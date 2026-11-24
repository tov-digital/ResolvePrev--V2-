-- ==============================================================================
-- Script de Ajuste de Permissão para 'profiles' (Compatível com sua tabela)
-- Execute este script no SQL Editor do Supabase (Dashboard -> SQL Editor -> Run)
-- ==============================================================================

-- 1. Garante que a coluna 'operacao' existe com padrão 'aposentadoria'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS operacao text DEFAULT 'aposentadoria';

-- 2. Concede permissões básicas
GRANT SELECT, INSERT, UPDATE ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE profiles TO service_role;

-- 3. Remove política anterior caso exista
DROP POLICY IF EXISTS "Admins podem atualizar qualquer perfil" ON profiles;

-- 4. Cria política permitindo atualização pelo próprio usuário ou por Administrador (role = 'admin')
CREATE POLICY "Admins podem atualizar qualquer perfil" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR p.id = '91a1904c-8f54-4943-bc8c-0b97cbcdcd26')
  )
)
WITH CHECK (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
      AND (p.role = 'admin' OR p.id = '91a1904c-8f54-4943-bc8c-0b97cbcdcd26')
  )
);
