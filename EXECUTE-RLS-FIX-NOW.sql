-- CORREÇÃO CRÍTICA DAS POLÍTICAS RLS DA TABELA MESSAGES
-- Execução: Use este SQL diretamente no Supabase Dashboard ou via psql

-- 1. Habilitar RLS na tabela messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes da tabela messages
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

-- 3. Criar políticas corretas baseadas diretamente em user_id
CREATE POLICY "allow_select_own_messages" ON public.messages 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "allow_insert_own_messages" ON public.messages 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_update_own_messages" ON public.messages 
    FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_delete_own_messages" ON public.messages 
    FOR DELETE 
    USING (auth.uid() = user_id);

-- 4. Verificar políticas criadas
SELECT 
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'messages'
ORDER BY policyname;
