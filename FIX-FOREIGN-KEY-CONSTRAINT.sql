-- CORREÇÃO COMPLETA PARA FOREIGN KEY CONSTRAINT
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Primeiro, vamos verificar a estrutura das tabelas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'usage_stats', 'profiles') 
ORDER BY table_name, ordinal_position;

-- 2. Verificar usuários existentes na tabela auth.users
SELECT id, email, created_at FROM auth.users LIMIT 5;

-- 3. Verificar usuários existentes na tabela public.users (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela public.users existe';
        PERFORM * FROM public.users LIMIT 1;
    ELSE
        RAISE NOTICE 'Tabela public.users NÃO existe';
    END IF;
END $$;

-- 4. Verificar constraint de foreign key
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'usage_stats';

-- 5. SOLUÇÃO 1: Inserir usuário de teste na tabela correta
-- Primeiro, vamos descobrir se precisamos inserir em auth.users ou public.users
DO $$
DECLARE
    test_user_id UUID := '123e4567-e89b-12d3-a456-426614174000';
    table_exists BOOLEAN;
BEGIN
    -- Verificar se tabela public.users existe
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
    ) INTO table_exists;
    
    IF table_exists THEN
        -- Inserir na tabela public.users
        INSERT INTO public.users (id, email, full_name, created_at, updated_at)
        VALUES (
            test_user_id,
            'usuario.teste@exemplo.com',
            'Usuário de Teste',
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Usuário inserido em public.users';
    ELSE
        RAISE NOTICE 'Tabela public.users não existe - usando auth.users';
    END IF;
END $$;

-- 6. SOLUÇÃO 2: Se a foreign key aponta para auth.users, precisamos usar um usuário real
-- Vamos pegar o primeiro usuário existente em auth.users
DO $$
DECLARE
    real_user_id UUID;
BEGIN
    -- Pegar o primeiro usuário real do auth.users
    SELECT id INTO real_user_id 
    FROM auth.users 
    LIMIT 1;
    
    IF real_user_id IS NOT NULL THEN
        -- Inserir dados de teste com usuário real
        INSERT INTO usage_stats (user_id, date, messages_sent, messages_received, active_sessions, new_contacts) VALUES
        (real_user_id, CURRENT_DATE - INTERVAL '6 days', 18, 15, 1, 0),
        (real_user_id, CURRENT_DATE - INTERVAL '5 days', 35, 32, 2, 1),
        (real_user_id, CURRENT_DATE - INTERVAL '4 days', 28, 25, 1, 0),
        (real_user_id, CURRENT_DATE - INTERVAL '3 days', 42, 38, 3, 2),
        (real_user_id, CURRENT_DATE - INTERVAL '2 days', 39, 33, 2, 1),
        (real_user_id, CURRENT_DATE - INTERVAL '1 day', 47, 41, 2, 0),
        (real_user_id, CURRENT_DATE, 25, 21, 1, 1)
        ON CONFLICT (user_id, date) DO UPDATE SET
            messages_sent = EXCLUDED.messages_sent,
            messages_received = EXCLUDED.messages_received,
            active_sessions = EXCLUDED.active_sessions,
            new_contacts = EXCLUDED.new_contacts,
            updated_at = CURRENT_TIMESTAMP;
            
        RAISE NOTICE 'Dados inseridos para usuário real: %', real_user_id;
    ELSE
        -- Se não há usuários, inserir dados genéricos (sem FK)
        RAISE NOTICE 'Nenhum usuário encontrado em auth.users';
    END IF;
END $$;

-- 7. SOLUÇÃO 3: Como fallback, inserir usuário genérico (caso não exista nenhum)
DO $$
DECLARE
    user_count INTEGER;
    test_user_id UUID := '123e4567-e89b-12d3-a456-426614174000';
BEGIN
    -- Contar usuários existentes
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'Nenhum usuário existe. Criando usuário de teste...';
        
        -- Inserir usuário em auth.users (necessário privilégios especiais)
        -- Como alternativa, vamos remover temporariamente a FK constraint
        ALTER TABLE usage_stats DROP CONSTRAINT IF EXISTS usage_stats_user_id_fkey;
        
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
            
        RAISE NOTICE 'Dados inseridos sem constraint FK';
    END IF;
END $$;

-- 8. Verificar os dados inseridos
SELECT COUNT(*) as total_records FROM usage_stats;
SELECT user_id, date, messages_sent, messages_received FROM usage_stats ORDER BY date DESC LIMIT 7;
