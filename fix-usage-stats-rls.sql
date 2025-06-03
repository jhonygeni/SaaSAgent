-- Correção das políticas RLS para a tabela usage_stats
-- Script para resolver problemas de acesso aos dados de estatísticas

-- 1. Primeiro, verificar status atual
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'usage_stats';

-- 2. Verificar políticas existentes
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'usage_stats';

-- 3. Remover políticas existentes que podem estar causando problema
DROP POLICY IF EXISTS "Enable read access for all users" ON usage_stats;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON usage_stats;
DROP POLICY IF EXISTS "Enable insert for anon users" ON usage_stats;
DROP POLICY IF EXISTS "usage_stats_select_policy" ON usage_stats;
DROP POLICY IF EXISTS "usage_stats_insert_policy" ON usage_stats;

-- 4. Criar política permissiva para leitura (permite acesso a todos os dados)
CREATE POLICY "allow_read_usage_stats" ON usage_stats
    FOR SELECT
    USING (true);

-- 5. Criar política permissiva para inserção 
CREATE POLICY "allow_insert_usage_stats" ON usage_stats
    FOR INSERT
    WITH CHECK (true);

-- 6. Criar política permissiva para atualização
CREATE POLICY "allow_update_usage_stats" ON usage_stats
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 7. Verificar se RLS está habilitado (deve estar para segurança)
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'usage_stats';

-- 8. Verificar as novas políticas
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'usage_stats';

-- 9. Inserir dados de teste para verificar se está funcionando
INSERT INTO usage_stats (
    user_id,
    date,
    messages_sent,
    messages_received,
    active_sessions,
    new_contacts
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000'::uuid,
    CURRENT_DATE,
    10,
    8,
    1,
    2
) ON CONFLICT (user_id, date) DO UPDATE SET
    messages_sent = usage_stats.messages_sent + EXCLUDED.messages_sent,
    messages_received = usage_stats.messages_received + EXCLUDED.messages_received,
    updated_at = CURRENT_TIMESTAMP;

-- 10. Verificar se os dados foram inseridos
SELECT * FROM usage_stats WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'::uuid;
