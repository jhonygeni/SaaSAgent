-- FIX MESSAGES RLS POLICY
-- Script para corrigir as políticas RLS da tabela messages
-- Este script resolve o erro 403 Forbidden (código 42501) ao inserir mensagens

-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA A TABELA MESSAGES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 ===== CORRIGINDO POLÍTICAS RLS DA TABELA MESSAGES =====';
  RAISE NOTICE '';
END $$;

-- 1. HABILITAR RLS NA TABELA MESSAGES (se não estiver habilitado)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS EXISTENTES PROBLEMÁTICAS
DROP POLICY IF EXISTS "Users can view messages from their instances" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their instances" ON public.messages; 
DROP POLICY IF EXISTS "Users can update messages from their instances" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages from their instances" ON public.messages;
DROP POLICY IF EXISTS "Users can access their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.messages;

-- 3. CRIAR POLÍTICA CORRETA PARA SELECT (baseada em user_id direto)
CREATE POLICY "Users can view their own messages" ON public.messages 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 4. CRIAR POLÍTICA CORRETA PARA INSERT (baseada em user_id direto)
CREATE POLICY "Users can insert their own messages" ON public.messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 5. CRIAR POLÍTICA CORRETA PARA UPDATE (baseada em user_id direto)
CREATE POLICY "Users can update their own messages" ON public.messages 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. CRIAR POLÍTICA CORRETA PARA DELETE (baseada em user_id direto)
CREATE POLICY "Users can delete their own messages" ON public.messages 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 7. POLÍTICA ALTERNATIVA BASEADA EM INSTANCE_ID (caso necessário)
-- Esta política adicional permite acesso via instância caso o user_id não esteja sendo preenchido corretamente
CREATE POLICY "Users can access messages via instance" ON public.messages 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_instances 
      WHERE id = messages.instance_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_instances 
      WHERE id = messages.instance_id AND user_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICAÇÃO E VALIDAÇÃO
-- =====================================================

-- Verificar se RLS está habilitado
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT pg_class.relrowsecurity INTO rls_enabled
  FROM pg_class 
  WHERE pg_class.relname = 'messages' AND pg_class.relnamespace = 'public'::regnamespace;
  
  IF rls_enabled THEN
    RAISE NOTICE '✅ RLS habilitado na tabela messages';
  ELSE
    RAISE NOTICE '❌ RLS NÃO está habilitado na tabela messages';
  END IF;
END $$;

-- Listar políticas criadas
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'messages'
ORDER BY policyname;

-- =====================================================
-- TESTE BÁSICO DAS POLÍTICAS
-- =====================================================

-- Função para testar as políticas RLS da tabela messages
CREATE OR REPLACE FUNCTION public.test_messages_rls()
RETURNS TEXT AS $$
DECLARE
  current_user_id UUID;
  test_result TEXT := '';
BEGIN
  -- Obter ID do usuário atual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 'ERRO: Nenhum usuário autenticado para teste';
  END IF;
  
  test_result := test_result || 'Testando políticas RLS da tabela messages para usuário: ' || current_user_id || E'\n';
  
  -- Testar acesso às próprias mensagens
  BEGIN
    PERFORM * FROM public.messages WHERE user_id = current_user_id LIMIT 1;
    test_result := test_result || '✅ Acesso às próprias mensagens: OK' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    test_result := test_result || '❌ Acesso às próprias mensagens: ERRO - ' || SQLERRM || E'\n';
  END;
  
  -- Testar acesso a mensagens de outros usuários (deve falhar)
  BEGIN
    PERFORM * FROM public.messages WHERE user_id != current_user_id LIMIT 1;
    test_result := test_result || '❌ Isolamento de mensagens: FALHOU (conseguiu acessar mensagens de outros)' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    test_result := test_result || '✅ Isolamento de mensagens: OK (sem acesso a mensagens de outros)' || E'\n';
  END;
  
  RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RELATÓRIO FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ===== POLÍTICAS RLS DA TABELA MESSAGES CORRIGIDAS =====';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 POLÍTICAS CRIADAS:';
  RAISE NOTICE '• Users can view their own messages - SELECT baseado em user_id';
  RAISE NOTICE '• Users can insert their own messages - INSERT baseado em user_id';
  RAISE NOTICE '• Users can update their own messages - UPDATE baseado em user_id';
  RAISE NOTICE '• Users can delete their own messages - DELETE baseado em user_id';
  RAISE NOTICE '• Users can access messages via instance - Política baseada em instance_id como fallback';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Teste inserindo uma mensagem através da aplicação';
  RAISE NOTICE '2. Execute SELECT public.test_messages_rls() para teste automatizado';
  RAISE NOTICE '3. Verifique se o user_id está sendo preenchido corretamente na aplicação';
  RAISE NOTICE '';
END $$;
