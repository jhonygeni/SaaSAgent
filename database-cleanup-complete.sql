-- ===================================
-- CONVERSA AI BRASIL - LIMPEZA COMPLETA DO BANCO
-- Arquivo: database-cleanup-complete.sql
-- Data: 2025-01-25
-- ===================================

-- 1. LIMPEZA DE PLANOS DUPLICADOS
-- Remove planos Free duplicados, mantendo apenas o mais recente
WITH duplicate_free_plans AS (
  SELECT id, name, message_limit, created_at,
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
  FROM public.subscription_plans 
  WHERE name = 'Free'
)
DELETE FROM public.subscription_plans 
WHERE id IN (
  SELECT id FROM duplicate_free_plans WHERE rn > 1
);

-- Verificar se há assinaturas órfãs após limpeza de planos
UPDATE public.subscriptions 
SET plan_id = (
  SELECT id FROM public.subscription_plans 
  WHERE name = 'Free' 
  LIMIT 1
) 
WHERE plan_id NOT IN (
  SELECT id FROM public.subscription_plans
);

-- 2. OTIMIZAÇÃO DE PERFORMANCE - ÍNDICES
-- Índices para tabela messages (otimizar consultas de mensagens)
CREATE INDEX IF NOT EXISTS idx_messages_instance_id ON public.messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_phone_number ON public.messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON public.messages(direction);

-- Índices para tabela contacts (otimizar consultas de contatos)
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_number ON public.contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at DESC);

-- Índices para tabela usage_stats (otimizar consultas de estatísticas)
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON public.usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_date ON public.usage_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_date ON public.usage_stats(user_id, date);

-- Índices para tabela whatsapp_instances (otimizar consultas de instâncias)
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id ON public.whatsapp_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON public.whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_created_at ON public.whatsapp_instances(created_at DESC);

-- Índices para tabela agents (otimizar consultas de agentes)
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_instance_id ON public.agents(instance_id);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON public.agents(is_active);

-- Índices para tabela payments (otimizar consultas de pagamentos)
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON public.payments(stripe_payment_intent_id);

-- 3. RESTRIÇÕES DE INTEGRIDADE
-- Unique constraint para contacts (evitar contatos duplicados por usuário)
ALTER TABLE public.contacts 
DROP CONSTRAINT IF EXISTS unique_user_phone;

ALTER TABLE public.contacts 
ADD CONSTRAINT unique_user_phone 
UNIQUE (user_id, phone_number);

-- Unique constraint para usage_stats (evitar estatísticas duplicadas por data)
ALTER TABLE public.usage_stats 
DROP CONSTRAINT IF EXISTS unique_user_date;

ALTER TABLE public.usage_stats 
ADD CONSTRAINT unique_user_date 
UNIQUE (user_id, date);

-- Unique constraint para whatsapp_instances (evitar instâncias duplicadas por usuário com mesmo nome)
ALTER TABLE public.whatsapp_instances 
DROP CONSTRAINT IF EXISTS unique_user_instance_name;

ALTER TABLE public.whatsapp_instances 
ADD CONSTRAINT unique_user_instance_name 
UNIQUE (user_id, name);

-- 4. POLÍTICAS RLS COMPLETAS
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_instances
DROP POLICY IF EXISTS "Users can view their own instances" ON public.whatsapp_instances;
CREATE POLICY "Users can view their own instances" ON public.whatsapp_instances 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own instances" ON public.whatsapp_instances;
CREATE POLICY "Users can insert their own instances" ON public.whatsapp_instances 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own instances" ON public.whatsapp_instances;
CREATE POLICY "Users can update their own instances" ON public.whatsapp_instances 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own instances" ON public.whatsapp_instances;
CREATE POLICY "Users can delete their own instances" ON public.whatsapp_instances 
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para agents
DROP POLICY IF EXISTS "Users can view their own agents" ON public.agents;
CREATE POLICY "Users can view their own agents" ON public.agents 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own agents" ON public.agents;
CREATE POLICY "Users can insert their own agents" ON public.agents 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own agents" ON public.agents;
CREATE POLICY "Users can update their own agents" ON public.agents 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own agents" ON public.agents;
CREATE POLICY "Users can delete their own agents" ON public.agents 
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para messages (baseado em instance_id -> user_id)
DROP POLICY IF EXISTS "Users can view messages from their instances" ON public.messages;
CREATE POLICY "Users can view messages from their instances" ON public.messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_instances 
      WHERE id = messages.instance_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert messages to their instances" ON public.messages;
CREATE POLICY "Users can insert messages to their instances" ON public.messages 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_instances 
      WHERE id = messages.instance_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update messages from their instances" ON public.messages;
CREATE POLICY "Users can update messages from their instances" ON public.messages 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_instances 
      WHERE id = messages.instance_id AND user_id = auth.uid()
    )
  );

-- Políticas para contacts
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
CREATE POLICY "Users can view their own contacts" ON public.contacts 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts;
CREATE POLICY "Users can insert their own contacts" ON public.contacts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
CREATE POLICY "Users can update their own contacts" ON public.contacts 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;
CREATE POLICY "Users can delete their own contacts" ON public.contacts 
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
CREATE POLICY "Users can insert their own payments" ON public.payments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para usage_stats
DROP POLICY IF EXISTS "Users can view their own usage stats" ON public.usage_stats;
CREATE POLICY "Users can view their own usage stats" ON public.usage_stats 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage stats" ON public.usage_stats;
CREATE POLICY "Users can insert their own usage stats" ON public.usage_stats 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage stats" ON public.usage_stats;
CREATE POLICY "Users can update their own usage stats" ON public.usage_stats 
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. VERIFICAÇÕES FINAIS
-- Função para verificar integridade do banco
CREATE OR REPLACE FUNCTION public.verify_database_integrity()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Verificar planos Free duplicados
  RETURN QUERY
  SELECT 
    'duplicate_free_plans'::TEXT,
    CASE WHEN count(*) = 1 THEN 'OK' ELSE 'ERROR' END::TEXT,
    'Found ' || count(*) || ' Free plans'::TEXT
  FROM public.subscription_plans 
  WHERE name = 'Free';
  
  -- Verificar usuários órfãos (sem profile)
  RETURN QUERY
  SELECT 
    'orphaned_users'::TEXT,
    CASE WHEN count(*) = 0 THEN 'OK' ELSE 'WARNING' END::TEXT,
    'Found ' || count(*) || ' users without profiles'::TEXT
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL;
  
  -- Verificar assinaturas órfãs (sem plano válido)
  RETURN QUERY
  SELECT 
    'orphaned_subscriptions'::TEXT,
    CASE WHEN count(*) = 0 THEN 'OK' ELSE 'ERROR' END::TEXT,
    'Found ' || count(*) || ' subscriptions with invalid plan_id'::TEXT
  FROM public.subscriptions s
  LEFT JOIN public.subscription_plans sp ON s.plan_id = sp.id
  WHERE sp.id IS NULL;
  
  -- Verificar instâncias órfãs (sem usuário válido)
  RETURN QUERY
  SELECT 
    'orphaned_instances'::TEXT,
    CASE WHEN count(*) = 0 THEN 'OK' ELSE 'ERROR' END::TEXT,
    'Found ' || count(*) || ' instances with invalid user_id'::TEXT
  FROM public.whatsapp_instances wi
  LEFT JOIN auth.users au ON wi.user_id = au.id
  WHERE au.id IS NULL;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar verificação
SELECT * FROM public.verify_database_integrity();

-- ===================================
-- SCRIPT CONCLUÍDO COM SUCESSO!
-- ===================================

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ Limpeza completa do banco de dados executada com sucesso!';
  RAISE NOTICE '📋 Itens processados:';
  RAISE NOTICE '   1. Remoção de planos Free duplicados';
  RAISE NOTICE '   2. Criação de índices de performance';
  RAISE NOTICE '   3. Adição de restrições de integridade';
  RAISE NOTICE '   4. Aplicação de políticas RLS completas';
  RAISE NOTICE '   5. Verificação de integridade final';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Próximos passos recomendados:';
  RAISE NOTICE '   1. Configurar Auth Hooks no dashboard Supabase';
  RAISE NOTICE '   2. Testar fluxo completo de criação de usuário';
  RAISE NOTICE '   3. Monitorar performance das consultas';
END;
$$;
