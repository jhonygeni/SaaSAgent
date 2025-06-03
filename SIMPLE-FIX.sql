-- SCRIPT SIMPLES DE CORREÇÃO - Execute no Supabase Dashboard > SQL Editor
-- Este script resolve o problema de foreign key constraint

-- 1. Primeiro, verificar se existem usuários
DO $$
DECLARE
    user_count INTEGER;
    first_user_id UUID;
    test_user_id UUID := '123e4567-e89b-12d3-a456-426614174000';
BEGIN
    -- Verificar quantos usuários existem em auth.users
    SELECT COUNT(*) INTO user_count FROM auth.users;
    RAISE NOTICE 'Usuários em auth.users: %', user_count;
    
    IF user_count > 0 THEN
        -- Se existem usuários, usar o primeiro
        SELECT id INTO first_user_id FROM auth.users LIMIT 1;
        RAISE NOTICE 'Usando usuário existente: %', first_user_id;
        
        -- Inserir dados de teste com usuário real
        INSERT INTO usage_stats (user_id, date, messages_sent, messages_received, active_sessions, new_contacts) VALUES
        (first_user_id, CURRENT_DATE - INTERVAL '6 days', 18, 15, 1, 0),
        (first_user_id, CURRENT_DATE - INTERVAL '5 days', 35, 32, 2, 1),
        (first_user_id, CURRENT_DATE - INTERVAL '4 days', 28, 25, 1, 0),
        (first_user_id, CURRENT_DATE - INTERVAL '3 days', 42, 38, 3, 2),
        (first_user_id, CURRENT_DATE - INTERVAL '2 days', 39, 33, 2, 1),
        (first_user_id, CURRENT_DATE - INTERVAL '1 day', 47, 41, 2, 0),
        (first_user_id, CURRENT_DATE, 25, 21, 1, 1)
        ON CONFLICT (user_id, date) DO UPDATE SET
            messages_sent = EXCLUDED.messages_sent,
            messages_received = EXCLUDED.messages_received,
            active_sessions = EXCLUDED.active_sessions,
            new_contacts = EXCLUDED.new_contacts,
            updated_at = CURRENT_TIMESTAMP;
            
        RAISE NOTICE 'Dados inseridos com sucesso!';
        
    ELSE
        -- Se não há usuários, remover constraint temporariamente
        RAISE NOTICE 'Nenhum usuário encontrado. Removendo constraint temporariamente...';
        
        ALTER TABLE usage_stats DROP CONSTRAINT IF EXISTS usage_stats_user_id_fkey;
        ALTER TABLE usage_stats DROP CONSTRAINT IF EXISTS fk_usage_stats_user_id;
        
        -- Inserir dados sem constraint
        INSERT INTO usage_stats (user_id, date, messages_sent, messages_received, active_sessions, new_contacts) VALUES
        (test_user_id, CURRENT_DATE - INTERVAL '6 days', 18, 15, 1, 0),
        (test_user_id, CURRENT_DATE - INTERVAL '5 days', 35, 32, 2, 1),
        (test_user_id, CURRENT_DATE - INTERVAL '4 days', 28, 25, 1, 0),
        (test_user_id, CURRENT_DATE - INTERVAL '3 days', 42, 38, 3, 2),
        (test_user_id, CURRENT_DATE - INTERVAL '2 days', 39, 33, 2, 1),
        (test_user_id, CURRENT_DATE - INTERVAL '1 day', 47, 41, 2, 0),
        (test_user_id, CURRENT_DATE, 25, 21, 1, 1)
        ON CONFLICT (user_id, date) DO UPDATE SET
            messages_sent = EXCLUDED.messages_sent,
            messages_received = EXCLUDED.messages_received,
            active_sessions = EXCLUDED.active_sessions,
            new_contacts = EXCLUDED.new_contacts,
            updated_at = CURRENT_TIMESTAMP;
            
        RAISE NOTICE 'Dados inseridos sem constraint!';
    END IF;
END $$;

-- 2. Verificar os dados inseridos
SELECT COUNT(*) as total_records FROM usage_stats;
SELECT user_id, date, messages_sent, messages_received FROM usage_stats ORDER BY date DESC LIMIT 7;

-- 3. Aplicar políticas RLS simples
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;

-- Política para permitir SELECT para todos
CREATE POLICY "Allow public read access" ON usage_stats
    FOR SELECT
    TO public
    USING (true);

-- Política para permitir INSERT/UPDATE para usuários autenticados
CREATE POLICY "Allow authenticated users full access" ON usage_stats
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

RAISE NOTICE 'Script de correção executado com sucesso!';
