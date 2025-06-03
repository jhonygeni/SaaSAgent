-- CORREÇÃO IMEDIATA DO PROBLEMA DE LOGIN
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Verificar usuários com email não confirmado
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'NÃO CONFIRMADO'
        ELSE 'CONFIRMADO'
    END as status
FROM auth.users
ORDER BY created_at DESC;

-- 2. Confirmar email de TODOS os usuários existentes
-- ISSO RESOLVE O PROBLEMA DE LOGIN IMEDIATAMENTE
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 3. Verificar resultado
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmados
FROM auth.users;

-- 4. Mostrar usuários após correção
SELECT 
    id,
    email,
    email_confirmed_at,
    'CONFIRMADO AUTOMATICAMENTE' as status
FROM auth.users
ORDER BY created_at DESC;

RAISE NOTICE '✅ Todos os usuários agora têm email confirmado - LOGIN DEVE FUNCIONAR!';
