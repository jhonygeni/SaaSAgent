-- Script para verificar e resolver problemas de RLS na tabela usage_stats

-- 1. Verificar políticas RLS existentes
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'usage_stats';

-- 2. Verificar se RLS está habilitado
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'usage_stats';

-- 3. Ver estrutura da tabela
\d usage_stats;

-- 4. Verificar dados existentes (se houver)
SELECT COUNT(*) as total_records FROM usage_stats;
SELECT user_id, COUNT(*) as records_per_user FROM usage_stats GROUP BY user_id;

-- SOLUÇÕES POSSÍVEIS:

-- OPÇÃO 1: Desabilitar RLS temporariamente para testes (NÃO RECOMENDADO PARA PRODUÇÃO)
-- ALTER TABLE usage_stats DISABLE ROW LEVEL SECURITY;

-- OPÇÃO 2: Criar política que permite acesso total (APENAS PARA DESENVOLVIMENTO)
-- CREATE POLICY "Permitir acesso total para desenvolvimento" ON usage_stats
-- FOR ALL USING (true);

-- OPÇÃO 3: Criar política específica para usuários autenticados
-- CREATE POLICY "Usuários podem ver seus próprios dados" ON usage_stats
-- FOR ALL USING (auth.uid() = user_id);

-- OPÇÃO 4: Política para permitir inserção e leitura de dados
-- CREATE POLICY "Permitir inserção de dados" ON usage_stats
-- FOR INSERT WITH CHECK (true);
-- 
-- CREATE POLICY "Permitir leitura de dados" ON usage_stats
-- FOR SELECT USING (true);

-- OPÇÃO 5: Remover todas as políticas existentes e recriar
-- DROP POLICY IF EXISTS "Enable read access for all users" ON usage_stats;
-- DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON usage_stats;
-- 
-- CREATE POLICY "usage_stats_select_policy" ON usage_stats
-- FOR SELECT USING (
--   auth.uid() = user_id OR 
--   auth.uid() IS NULL OR
--   user_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
-- );
-- 
-- CREATE POLICY "usage_stats_insert_policy" ON usage_stats
-- FOR INSERT WITH CHECK (
--   auth.uid() = user_id OR 
--   auth.uid() IS NULL OR
--   user_id = '123e4567-e89b-12d3-a456-426614174000'::uuid
-- );
