-- TESTE DEFINITIVO: TEMPORARIAMENTE DESABILITAR RLS
-- ⚠️  SÓ PARA DIAGNÓSTICO - REABILITAR APÓS TESTE

-- 1. Verificar estado atual do RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as force_rls
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
JOIN pg_namespace pn ON pn.oid = pc.relnamespace
WHERE pt.tablename = 'whatsapp_instances'
AND pn.nspname = 'public';

-- 2. TEMPORARIAMENTE DESABILITAR RLS (SÓ PARA TESTE!)
ALTER TABLE public.whatsapp_instances DISABLE ROW LEVEL SECURITY;

-- 3. TESTE SEM RLS
INSERT INTO public.whatsapp_instances (
  user_id,
  name,
  phone_number,
  status,
  evolution_instance_id,
  session_data
) VALUES (
  'e8e521f6-7011-418c-a0b4-7ca696e56030', -- jhony@geni.chat
  'teste_sem_rls_' || extract(epoch from now())::text,
  '+5511999887766',
  'offline',
  'no_rls_test_' || extract(epoch from now())::text,
  '{"test": "without_rls", "success": true}'::jsonb
);

-- 4. VERIFICAR SE FUNCIONOU
SELECT 
  id,
  name,
  phone_number,
  status,
  user_id,
  created_at
FROM public.whatsapp_instances 
WHERE name LIKE 'teste_sem_rls_%'
ORDER BY created_at DESC
LIMIT 1;

-- 5. CONTAR TOTAL DE INSTÂNCIAS DO USUÁRIO
SELECT COUNT(*) as total_instancias
FROM public.whatsapp_instances 
WHERE user_id = 'e8e521f6-7011-418c-a0b4-7ca696e56030';

-- 6. SE FUNCIONOU SEM RLS, REABILITAR E CRIAR POLÍTICAS CORRETAS
-- ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Política correta para INSERT (descomente se funcionou sem RLS)
/*
CREATE POLICY "working_insert_policy" ON public.whatsapp_instances
  FOR INSERT
  WITH CHECK (
    user_id IS NOT NULL
  );

CREATE POLICY "working_select_policy" ON public.whatsapp_instances
  FOR SELECT
  USING (auth.uid() = user_id);
*/

-- 7. MENSAGEM DE RESULTADO
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ SUCESSO: Problema era RLS - aplicar políticas corretas'
    ELSE '❌ FALHA: Problema não é RLS - investigar mais'
  END as resultado
FROM public.whatsapp_instances 
WHERE name LIKE 'teste_sem_rls_%';
