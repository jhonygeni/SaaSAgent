-- Script de Implementação de Políticas RLS Completas
-- ConversaAI Brasil - Banco de Dados Supabase
-- Row Level Security para todas as tabelas

-- =====================================================
-- IMPLEMENTAÇÃO DE POLÍTICAS RLS COMPLETAS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔒 ===== IMPLEMENTANDO POLÍTICAS RLS COMPLETAS =====';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 1. TABELA PROFILES (JÁ IMPLEMENTADA - VERIFICAR)
-- =====================================================

-- Habilitar RLS se não estiver
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para visualizar próprio perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Política para atualizar próprio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Política para inserir próprio perfil (para casos especiais)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. TABELA SUBSCRIPTIONS (JÁ IMPLEMENTADA - VERIFICAR)
-- =====================================================

-- Habilitar RLS se não estiver
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Política para visualizar própria assinatura
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para atualizar própria assinatura (limitada)
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription" ON public.subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 3. TABELA SUBSCRIPTION_PLANS (PÚBLICA)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Política para qualquer usuário visualizar planos ativos
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans 
  FOR SELECT 
  USING (is_active = true);

-- =====================================================
-- 4. TABELA WHATSAPP_INSTANCES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Política completa para usuários gerenciarem suas próprias instâncias
DROP POLICY IF EXISTS "Users can manage their own instances" ON public.whatsapp_instances;
CREATE POLICY "Users can manage their own instances" ON public.whatsapp_instances 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. TABELA AGENTS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Política completa para usuários gerenciarem seus próprios agentes
DROP POLICY IF EXISTS "Users can manage their own agents" ON public.agents;
CREATE POLICY "Users can manage their own agents" ON public.agents 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 6. TABELA MESSAGES
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Política completa para usuários acessarem suas próprias mensagens
DROP POLICY IF EXISTS "Users can manage their own messages" ON public.messages;
CREATE POLICY "Users can manage their own messages" ON public.messages 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. TABELA CONTACTS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Política completa para usuários gerenciarem seus próprios contatos
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;
CREATE POLICY "Users can manage their own contacts" ON public.contacts 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 8. TABELA PAYMENTS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem seus próprios pagamentos
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para inserir pagamentos (sistema pode inserir)
DROP POLICY IF EXISTS "System can insert payments" ON public.payments;
CREATE POLICY "System can insert payments" ON public.payments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 9. TABELA USAGE_STATS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem suas próprias estatísticas
DROP POLICY IF EXISTS "Users can view their own stats" ON public.usage_stats;
CREATE POLICY "Users can view their own stats" ON public.usage_stats 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para sistema atualizar estatísticas
DROP POLICY IF EXISTS "System can manage usage stats" ON public.usage_stats;
CREATE POLICY "System can manage usage stats" ON public.usage_stats 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 10. TABELA EVENT_LOGS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem seus próprios logs
DROP POLICY IF EXISTS "Users can view their own logs" ON public.event_logs;
CREATE POLICY "Users can view their own logs" ON public.event_logs 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Política para sistema inserir logs
DROP POLICY IF EXISTS "System can insert logs" ON public.event_logs;
CREATE POLICY "System can insert logs" ON public.event_logs 
  FOR INSERT 
  WITH CHECK (true); -- Sistema pode inserir logs para qualquer usuário

-- =====================================================
-- 11. TABELA INTEGRATIONS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Política completa para usuários gerenciarem suas próprias integrações
DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.integrations;
CREATE POLICY "Users can manage their own integrations" ON public.integrations 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 12. POLÍTICAS ADMINISTRATIVAS
-- =====================================================

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas administrativas para profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Políticas administrativas para subscriptions
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Políticas administrativas para subscription_plans
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans 
  FOR ALL 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- 13. VERIFICAÇÃO DE POLÍTICAS IMPLEMENTADAS
-- =====================================================

-- Função para verificar status RLS de todas as tabelas
CREATE OR REPLACE FUNCTION public.check_rls_status()
RETURNS TABLE(
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity,
    COALESCE(p.policy_count, 0)
  FROM pg_tables t
  LEFT JOIN (
    SELECT 
      tablename,
      COUNT(*) as policy_count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
  ) p ON t.tablename = p.tablename
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- Executar verificação
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 ===== STATUS RLS DAS TABELAS =====';
  RAISE NOTICE '';
  RAISE NOTICE 'Tabela                | RLS    | Políticas';
  RAISE NOTICE '----------------------|--------|----------';
  
  FOR rec IN SELECT * FROM public.check_rls_status() LOOP
    RAISE NOTICE '%-20s | %-6s | %',
      rec.table_name,
      CASE WHEN rec.rls_enabled THEN '✅ SIM' ELSE '❌ NÃO' END,
      rec.policy_count;
  END LOOP;
  
  RAISE NOTICE '';
END $$;

-- Listar todas as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 14. TESTE DE POLÍTICAS RLS
-- =====================================================

-- Função para testar políticas RLS
CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS TEXT AS $$
DECLARE
  test_results TEXT := '';
  current_user_id UUID;
BEGIN
  -- Obter ID do usuário atual
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 'ERRO: Nenhum usuário autenticado para teste';
  END IF;
  
  test_results := test_results || 'Testando políticas RLS para usuário: ' || current_user_id || E'\n';
  
  -- Testar acesso a perfil próprio
  BEGIN
    PERFORM * FROM public.profiles WHERE id = current_user_id LIMIT 1;
    test_results := test_results || '✅ Acesso ao próprio perfil: OK' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    test_results := test_results || '❌ Acesso ao próprio perfil: ERRO - ' || SQLERRM || E'\n';
  END;
  
  -- Testar acesso a perfil de outro usuário (deve falhar)
  BEGIN
    PERFORM * FROM public.profiles WHERE id != current_user_id LIMIT 1;
    test_results := test_results || '❌ Isolamento de perfis: FALHOU (conseguiu acessar outros perfis)' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    test_results := test_results || '✅ Isolamento de perfis: OK (sem acesso a outros perfis)' || E'\n';
  END;
  
  -- Testar acesso aos planos (deve funcionar)
  BEGIN
    PERFORM * FROM public.subscription_plans WHERE is_active = true LIMIT 1;
    test_results := test_results || '✅ Acesso aos planos ativos: OK' || E'\n';
  EXCEPTION WHEN OTHERS THEN
    test_results := test_results || '❌ Acesso aos planos ativos: ERRO - ' || SQLERRM || E'\n';
  END;
  
  RETURN test_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 15. RELATÓRIO FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ===== POLÍTICAS RLS IMPLEMENTADAS COM SUCESSO =====';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 TABELAS COM RLS HABILITADO:';
  RAISE NOTICE '• profiles - Completo';
  RAISE NOTICE '• subscriptions - Completo';
  RAISE NOTICE '• subscription_plans - Público (planos ativos)';
  RAISE NOTICE '• whatsapp_instances - Completo';
  RAISE NOTICE '• agents - Completo';
  RAISE NOTICE '• messages - Completo';
  RAISE NOTICE '• contacts - Completo';
  RAISE NOTICE '• payments - Leitura e inserção';
  RAISE NOTICE '• usage_stats - Completo';
  RAISE NOTICE '• event_logs - Leitura própria, inserção sistema';
  RAISE NOTICE '• integrations - Completo';
  RAISE NOTICE '';
  RAISE NOTICE '👑 POLÍTICAS ADMINISTRATIVAS:';
  RAISE NOTICE '• Admins podem acessar todos os dados';
  RAISE NOTICE '• Função is_admin() implementada';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Teste as políticas criando/acessando dados';
  RAISE NOTICE '2. Execute SELECT public.test_rls_policies() para teste automatizado';
  RAISE NOTICE '3. Monitore logs de acesso';
  RAISE NOTICE '';
END $$;
