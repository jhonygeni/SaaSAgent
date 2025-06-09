-- Fix WhatsApp Instances RLS Policies
-- Este script corrige o problema de persistência das instâncias WhatsApp no Supabase
-- Problema: RLS está bloqueando inserções quando não há usuário autenticado no contexto

-- =====================================================
-- DIAGNÓSTICO DO PROBLEMA
-- =====================================================
-- O erro 42501 indica que a política RLS está bloqueando a inserção
-- Isso acontece porque:
-- 1. A política atual requer auth.uid() = user_id
-- 2. Durante a criação da instância, pode não haver contexto de usuário autenticado
-- 3. Ou a autenticação não está sendo passada corretamente

-- =====================================================
-- SOLUÇÃO: POLÍTICA RLS MAIS FLEXÍVEL
-- =====================================================

-- Primeiro, vamos remover a política existente
DROP POLICY IF EXISTS "Users can manage their own instances" ON public.whatsapp_instances;

-- Criar políticas mais específicas e flexíveis

-- 1. Política para SELECT (leitura) - usuários podem ver suas próprias instâncias
CREATE POLICY "Users can view their own instances" ON public.whatsapp_instances 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 2. Política para INSERT (criação) - permite inserção pelo sistema ou usuário autenticado
CREATE POLICY "System can create instances for users" ON public.whatsapp_instances 
  FOR INSERT 
  WITH CHECK (
    -- Permite se há usuário autenticado e o user_id corresponde
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Permite se user_id é um UUID válido existente na tabela profiles
    (user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = user_id
    ))
  );

-- 3. Política para UPDATE (atualização) - apenas o próprio usuário ou sistema
CREATE POLICY "Users can update their own instances" ON public.whatsapp_instances 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Política para DELETE (exclusão) - apenas o próprio usuário
CREATE POLICY "Users can delete their own instances" ON public.whatsapp_instances 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- =====================================================
-- POLÍTICA ADICIONAL PARA SERVICE ROLE
-- =====================================================

-- Criar função para verificar se a requisição é do service role
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica se a role atual é 'service_role'
  RETURN current_setting('role') = 'service_role';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para service role (operações críticas do sistema)
CREATE POLICY "Service role can manage all instances" ON public.whatsapp_instances 
  FOR ALL 
  USING (public.is_service_role());

-- =====================================================
-- ALTERNATIVA: POLÍTICA MAIS PERMISSIVA TEMPORÁRIA
-- =====================================================

-- Se as políticas acima não funcionarem, podemos usar uma mais permissiva
-- (descomente as linhas abaixo se necessário)

/*
-- Remove todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "System can create instances for users" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can update their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Service role can manage all instances" ON public.whatsapp_instances;

-- Política temporária mais permissiva para debug
CREATE POLICY "Temporary permissive policy" ON public.whatsapp_instances 
  FOR ALL 
  USING (
    -- Permite se há usuário autenticado
    (auth.uid() IS NOT NULL)
    OR
    -- Permite se user_id existe na tabela profiles
    (user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = user_id
    ))
    OR
    -- Permite para service role
    (public.is_service_role())
  )
  WITH CHECK (
    -- Permite se há usuário autenticado e corresponde
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    -- Permite se user_id existe na tabela profiles
    (user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = user_id
    ))
    OR
    -- Permite para service role
    (public.is_service_role())
  );
*/

-- =====================================================
-- VERIFICAÇÃO E TESTE
-- =====================================================

-- Listar políticas ativas na tabela whatsapp_instances
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

-- Função de teste para verificar se as políticas funcionam
CREATE OR REPLACE FUNCTION public.test_whatsapp_instance_policies()
RETURNS TEXT AS $$
DECLARE
  test_user_id UUID;
  test_result TEXT := '';
  inserted_id UUID;
BEGIN
  -- Buscar um usuário existente para teste
  SELECT id INTO test_user_id 
  FROM public.profiles 
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RETURN 'ERRO: Nenhum usuário encontrado na tabela profiles para teste';
  END IF;
  
  test_result := test_result || 'Testando com user_id: ' || test_user_id || E'\n';
  
  -- Testar inserção
  BEGIN
    INSERT INTO public.whatsapp_instances (
      user_id,
      name,
      status,
      evolution_instance_id,
      session_data
    ) VALUES (
      test_user_id,
      'test_' || extract(epoch from now())::text,
      'testing',
      'test_id_' || extract(epoch from now())::text,
      '{"test": true}'::jsonb
    ) RETURNING id INTO inserted_id;
    
    test_result := test_result || '✅ Inserção: SUCESSO (ID: ' || inserted_id || ')' || E'\n';
    
    -- Limpar o teste
    DELETE FROM public.whatsapp_instances WHERE id = inserted_id;
    test_result := test_result || '✅ Limpeza: SUCESSO' || E'\n';
    
  EXCEPTION WHEN OTHERS THEN
    test_result := test_result || '❌ Inserção: ERRO - ' || SQLERRM || E'\n';
  END;
  
  RETURN test_result;
END;
$$ LANGUAGE plpgsql;

-- Executar teste
SELECT public.test_whatsapp_instance_policies();

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

/*
PARA APLICAR ESTA CORREÇÃO:

1. Execute este arquivo SQL no Supabase SQL Editor:
   - Vá ao Supabase Dashboard
   - Acesse o SQL Editor
   - Cole e execute este script

2. Teste a correção executando:
   node simple-persistence-test.mjs

3. Se ainda houver problemas, descomente a seção "ALTERNATIVA" 
   e execute novamente

4. Para rollback (desfazer), execute:
   DROP POLICY IF EXISTS "Users can view their own instances" ON public.whatsapp_instances;
   DROP POLICY IF EXISTS "System can create instances for users" ON public.whatsapp_instances;
   DROP POLICY IF EXISTS "Users can update their own instances" ON public.whatsapp_instances;
   DROP POLICY IF EXISTS "Users can delete their own instances" ON public.whatsapp_instances;
   DROP POLICY IF EXISTS "Service role can manage all instances" ON public.whatsapp_instances;
   
   -- Recriar política original
   CREATE POLICY "Users can manage their own instances" ON public.whatsapp_instances 
     FOR ALL 
     USING (auth.uid() = user_id)
     WITH CHECK (auth.uid() = user_id);
*/
