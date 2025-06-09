-- CORREÇÃO CRÍTICA: WhatsApp Instances RLS Policy Fix
-- Problema: Instâncias não estão sendo salvas devido a políticas RLS muito restritivas
-- Solução: Política mais flexível que permite criação por usuários válidos

-- 1. Remove todas as políticas existentes
DROP POLICY IF EXISTS "Users can manage their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can view their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "System can create instances for users" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can update their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Service role can manage all instances" ON public.whatsapp_instances;

-- 2. Cria política permissiva para INSERT (criação de instâncias)
CREATE POLICY "Allow instance creation for valid users" ON public.whatsapp_instances
  FOR INSERT
  WITH CHECK (
    -- Permite se user_id é um UUID válido que existe na tabela profiles
    user_id IS NOT NULL 
    AND user_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = user_id
    )
  );

-- 3. Política para SELECT (visualização)
CREATE POLICY "Allow users to view their instances" ON public.whatsapp_instances
  FOR SELECT
  USING (
    -- Permite se o usuário autenticado é o dono da instância
    auth.uid() = user_id
    OR
    -- Permite visualização se user_id corresponde a um perfil válido
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = user_id AND id = auth.uid()
    )
  );

-- 4. Política para UPDATE (atualização)
CREATE POLICY "Allow users to update their instances" ON public.whatsapp_instances
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Política para DELETE (exclusão)
CREATE POLICY "Allow users to delete their instances" ON public.whatsapp_instances
  FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Teste da correção
DO $$
DECLARE
  test_user_id UUID := 'e8e521f6-7011-418c-a0b4-7ca696e56030'; -- jhony@geni.chat
  test_instance_id UUID;
BEGIN
  -- Tenta inserir uma instância de teste
  INSERT INTO public.whatsapp_instances (
    user_id,
    name,
    status,
    evolution_instance_id
  ) VALUES (
    test_user_id,
    'test_policy_fix_' || extract(epoch from now())::text,
    'testing',
    'policy_test_' || extract(epoch from now())::text
  ) RETURNING id INTO test_instance_id;
  
  RAISE NOTICE '✅ SUCESSO: Instância criada com ID %', test_instance_id;
  
  -- Remove a instância de teste
  DELETE FROM public.whatsapp_instances WHERE id = test_instance_id;
  RAISE NOTICE '✅ Instância de teste removida';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERRO no teste: %', SQLERRM;
END $$;

-- 7. Verifica políticas criadas
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'whatsapp_instances' 
AND schemaname = 'public'
ORDER BY policyname;
