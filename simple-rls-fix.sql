-- CORREÇÃO RÁPIDA E SIMPLES DAS POLÍTICAS RLS
-- Remove conflitos e cria política funcional

-- 1. Ver políticas atuais
SELECT policyname FROM pg_policies 
WHERE tablename = 'whatsapp_instances' AND schemaname = 'public';

-- 2. Remover todas as políticas conflitantes
DROP POLICY IF EXISTS "Allow instance creation for valid users" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Allow users to view their instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Allow users to update their instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Allow users to delete their instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can manage their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can view their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "System can create instances for users" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can update their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Service role can manage all instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can insert their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "temp_permissive_insert" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "temp_permissive_select" ON public.whatsapp_instances;

-- 3. Criar política simples para INSERT
CREATE POLICY "simple_insert_policy" ON public.whatsapp_instances
  FOR INSERT
  WITH CHECK (user_id IS NOT NULL);

-- 4. Criar política simples para SELECT
CREATE POLICY "simple_select_policy" ON public.whatsapp_instances
  FOR SELECT
  USING (auth.uid() = user_id);

-- 5. Teste imediato
INSERT INTO public.whatsapp_instances (
  user_id,
  name,
  status
) VALUES (
  'e8e521f6-7011-418c-a0b4-7ca696e56030',
  'teste_simples_' || extract(epoch from now())::text,
  'testing'
);

-- 6. Verificar sucesso
SELECT 'SUCESSO!' as resultado, id, name, created_at
FROM public.whatsapp_instances 
WHERE name LIKE 'teste_simples_%'
ORDER BY created_at DESC
LIMIT 1;
