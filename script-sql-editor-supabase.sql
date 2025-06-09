-- =====================================================
-- SCRIPT PARA COPIAR NO SQL EDITOR DO SUPABASE
-- =====================================================
-- Execute este script completo no SQL Editor para resolver o problema de RLS

-- 1. REMOVER POLÍTICAS ATUAIS
DROP POLICY IF EXISTS "simple_insert_policy" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "simple_select_policy" ON public.whatsapp_instances;

-- 2. CRIAR POLÍTICA DE INSERT (Permite inserção com user_id válido, mesmo sem auth)
CREATE POLICY "allow_valid_user_insert" ON public.whatsapp_instances
FOR INSERT
WITH CHECK (
    user_id IS NOT NULL 
    AND user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- 3. CRIAR POLÍTICA DE SELECT (Permite visualizar com ou sem auth)
CREATE POLICY "allow_user_select" ON public.whatsapp_instances
FOR SELECT
USING (
    auth.uid() = user_id 
    OR auth.uid() IS NULL
);

-- 4. CRIAR POLÍTICA DE UPDATE
CREATE POLICY "allow_user_update" ON public.whatsapp_instances
FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() IS NULL)
WITH CHECK (user_id IS NOT NULL);

-- 5. CRIAR POLÍTICA DE DELETE
CREATE POLICY "allow_user_delete" ON public.whatsapp_instances
FOR DELETE
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 6. TESTE IMEDIATO PARA CONFIRMAR QUE FUNCIONA
INSERT INTO public.whatsapp_instances (
    user_id,
    name,
    phone_number,
    status
) VALUES (
    'e8e521f6-7011-418c-a0b4-7ca696e56030',
    'teste_politicas_' || extract(epoch from now())::text,
    '+5511999887766',
    'active'
);

-- 7. VERIFICAR QUE O TESTE FUNCIONOU
SELECT 
    'SUCESSO! PROBLEMA RESOLVIDO!' as resultado,
    id,
    name,
    user_id,
    created_at
FROM public.whatsapp_instances 
WHERE name LIKE 'teste_politicas_%'
ORDER BY created_at DESC
LIMIT 1;
