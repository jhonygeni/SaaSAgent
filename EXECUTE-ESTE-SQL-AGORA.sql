-- APLICAÇÃO MANUAL DAS CORREÇÕES RLS
-- 🚨 EXECUTE ESTE SQL NO DASHBOARD DO SUPABASE AGORA MESMO
-- URL: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/sql

-- =============================================================================
-- CORREÇÃO CRÍTICA: POLÍTICAS RLS DA TABELA MESSAGES
-- Esta correção resolve o erro 403 Forbidden (código 42501) ao inserir mensagens
-- =============================================================================

-- 1. HABILITAR RLS NA TABELA MESSAGES
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. REMOVER TODAS AS POLÍTICAS EXISTENTES QUE ESTÃO CAUSANDO PROBLEMAS
DROP POLICY IF EXISTS "Users can view messages from their instances" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their instances" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages from their instances" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages from their instances" ON public.messages;
DROP POLICY IF EXISTS "Users can access their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can access messages via instance" ON public.messages;
DROP POLICY IF EXISTS "allow_select_own_messages" ON public.messages;
DROP POLICY IF EXISTS "allow_insert_own_messages" ON public.messages;
DROP POLICY IF EXISTS "allow_update_own_messages" ON public.messages;
DROP POLICY IF EXISTS "allow_delete_own_messages" ON public.messages;

-- 3. CRIAR POLÍTICAS CORRETAS BASEADAS DIRETAMENTE EM user_id
-- Estas políticas permitem acesso apenas quando auth.uid() = user_id

CREATE POLICY "messages_select_policy" ON public.messages 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "messages_insert_policy" ON public.messages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "messages_update_policy" ON public.messages 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "messages_delete_policy" ON public.messages 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. VERIFICAR POLÍTICAS CRIADAS
SELECT 
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'messages'
ORDER BY policyname;

-- =============================================================================
-- INSTRUÇÕES PÓS-EXECUÇÃO:
-- =============================================================================
-- 1. Após executar este SQL no dashboard do Supabase
-- 2. Volte para a aplicação em http://localhost:8080
-- 3. Teste enviando uma mensagem no chat
-- 4. O erro 403 Forbidden deve estar resolvido
-- 
-- Se ainda houver problemas:
-- - Verifique se o usuário está autenticado (user.id deve existir)
-- - Confirme que user_id está sendo preenchido nas inserções
-- =============================================================================
