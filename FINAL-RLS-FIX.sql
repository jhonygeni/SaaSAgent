-- AJUSTE FINAL DAS POLÍTICAS RLS
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Remover políticas existentes que podem estar conflitando
DROP POLICY IF EXISTS "Allow public read access" ON usage_stats;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON usage_stats;
DROP POLICY IF EXISTS "Allow public read" ON usage_stats;
DROP POLICY IF EXISTS "Allow authenticated full access" ON usage_stats;

-- 2. Aplicar políticas RLS corretas e simplificadas
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT público (qualquer um pode ler)
CREATE POLICY "usage_stats_select_policy" ON usage_stats
    FOR SELECT
    USING (true);

-- Política para permitir INSERT/UPDATE/DELETE para usuários autenticados
CREATE POLICY "usage_stats_write_policy" ON usage_stats
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Verificar se as políticas foram aplicadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'usage_stats';

-- 4. Testar acesso
SELECT COUNT(*) as total_records FROM usage_stats;
SELECT date, messages_sent, messages_received FROM usage_stats ORDER BY date DESC LIMIT 5;

RAISE NOTICE 'Políticas RLS ajustadas com sucesso!';
