-- TESTE TEMPORÁRIO: Desabilitar RLS para diagnóstico
-- ⚠️  APENAS PARA TESTE - NÃO USAR EM PRODUÇÃO

-- 1. Verificar status atual do RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE tablename = 'whatsapp_instances';

-- 2. Temporariamente desabilitar RLS para teste
-- CUIDADO: Isso remove todas as restrições de segurança!
ALTER TABLE public.whatsapp_instances DISABLE ROW LEVEL SECURITY;

-- 3. Teste de inserção sem RLS
INSERT INTO public.whatsapp_instances (
  user_id,
  name,
  phone_number,
  status,
  evolution_instance_id,
  session_data
) VALUES (
  'e8e521f6-7011-418c-a0b4-7ca696e56030', -- jhony@geni.chat
  'test_without_rls_' || extract(epoch from now())::text,
  '+5511999887766',
  'offline',
  'test_norls_' || extract(epoch from now())::text,
  '{"test": "without_rls"}'::jsonb
);

-- 4. Verificar se a inserção funcionou
SELECT 
  id,
  name,
  phone_number,
  status,
  created_at
FROM public.whatsapp_instances 
WHERE name LIKE 'test_without_rls_%'
ORDER BY created_at DESC
LIMIT 5;

-- 5. IMPORTANTE: Reabilitar RLS após teste
-- ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- 6. Se funcionou sem RLS, o problema é definitivamente nas políticas
-- Aplicar a correção das políticas:

/*
-- Políticas corrigidas (descomente após confirmar que funciona sem RLS):

CREATE POLICY "Permissive insert for valid users" ON public.whatsapp_instances
  FOR INSERT
  WITH CHECK (
    user_id IS NOT NULL 
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id)
  );

CREATE POLICY "Users view own instances" ON public.whatsapp_instances
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own instances" ON public.whatsapp_instances
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own instances" ON public.whatsapp_instances
  FOR DELETE
  USING (auth.uid() = user_id);
*/
