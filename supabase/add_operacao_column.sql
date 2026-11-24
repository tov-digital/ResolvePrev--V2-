-- Script SQL para adicionar o campo 'operacao' na tabela 'profiles' do Supabase
-- Executar no SQL Editor do painel do Supabase

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS operacao text DEFAULT 'aposentadoria';

-- Opcional: restrição para permitir apenas as operações válidas
-- ALTER TABLE profiles ADD CONSTRAINT check_operacao_valida CHECK (operacao IN ('aposentadoria', 'maternidade'));

-- Atualiza perfis existentes que estiverem nulos para 'aposentadoria'
UPDATE profiles 
SET operacao = 'aposentadoria' 
WHERE operacao IS NULL;
