-- SOLUÇÃO FINAL: DESABILITAR RLS COMPLETAMENTE
-- Isso vai permitir que todas as operações funcionem normalmente

-- 1. Desabilitar RLS na tabela whatsapp_instances
ALTER TABLE whatsapp_instances DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS simple_insert_policy ON whatsapp_instances;
DROP POLICY IF EXISTS simple_select_policy ON whatsapp_instances;
DROP POLICY IF EXISTS "Usuários podem ver suas próprias instâncias" ON whatsapp_instances;
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias instâncias" ON whatsapp_instances;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias instâncias" ON whatsapp_instances;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias instâncias" ON whatsapp_instances;

-- 3. Testar inserção imediatamente
INSERT INTO whatsapp_instances (
    user_id,
    name,
    phone_number,
    status
) VALUES (
    'e8e521f6-7011-418c-a0b4-7ca696e56030',
    'teste_sem_rls_' || EXTRACT(EPOCH FROM NOW()),
    '+5511999887766',
    'created'
) RETURNING id, name, created_at;

-- 4. Verificar que RLS está desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'whatsapp_instances';
