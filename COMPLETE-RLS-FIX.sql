-- SCRIPT COMPLETO PARA CORRIGIR RLS DA TABELA usage_stats
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Remover políticas existentes problemáticas
DROP POLICY IF EXISTS "Enable read access for all users" ON usage_stats;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON usage_stats;
DROP POLICY IF EXISTS "Enable insert for anon users" ON usage_stats;
DROP POLICY IF EXISTS "usage_stats_select_policy" ON usage_stats;
DROP POLICY IF EXISTS "usage_stats_insert_policy" ON usage_stats;

-- 2. Criar políticas permissivas para desenvolvimento
CREATE POLICY "allow_read_usage_stats" ON usage_stats
    FOR SELECT
    USING (true);

CREATE POLICY "allow_insert_usage_stats" ON usage_stats
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "allow_update_usage_stats" ON usage_stats
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 3. Inserir dados de demonstração para os últimos 7 dias
INSERT INTO usage_stats (user_id, date, messages_sent, messages_received, active_sessions, new_contacts) VALUES
('123e4567-e89b-12d3-a456-426614174000'::uuid, CURRENT_DATE - INTERVAL '6 days', 18, 15, 1, 0),
('123e4567-e89b-12d3-a456-426614174000'::uuid, CURRENT_DATE - INTERVAL '5 days', 35, 32, 2, 1),
('123e4567-e89b-12d3-a456-426614174000'::uuid, CURRENT_DATE - INTERVAL '4 days', 28, 25, 1, 0),
('123e4567-e89b-12d3-a456-426614174000'::uuid, CURRENT_DATE - INTERVAL '3 days', 42, 38, 3, 2),
('123e4567-e89b-12d3-a456-426614174000'::uuid, CURRENT_DATE - INTERVAL '2 days', 39, 33, 2, 1),
('123e4567-e89b-12d3-a456-426614174000'::uuid, CURRENT_DATE - INTERVAL '1 day', 47, 41, 2, 0),
('123e4567-e89b-12d3-a456-426614174000'::uuid, CURRENT_DATE, 25, 21, 1, 1)
ON CONFLICT (user_id, date) DO UPDATE SET
    messages_sent = EXCLUDED.messages_sent,
    messages_received = EXCLUDED.messages_received,
    active_sessions = EXCLUDED.active_sessions,
    new_contacts = EXCLUDED.new_contacts,
    updated_at = CURRENT_TIMESTAMP;

-- 4. Verificar se os dados foram inseridos
SELECT * FROM usage_stats WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'::uuid ORDER BY date DESC;
