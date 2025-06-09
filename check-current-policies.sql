-- Verificar políticas RLS atuais
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check 
FROM pg_policies 
WHERE tablename = 'whatsapp_instances';

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'whatsapp_instances';

-- Testar inserção simples diretamente
INSERT INTO whatsapp_instances (
    user_id,
    name,
    phone_number,
    status
) VALUES (
    'e8e521f6-7011-418c-a0b4-7ca696e56030',
    'teste_direto_sql',
    '+5511999887766',
    'created'
) RETURNING id, name, created_at;
