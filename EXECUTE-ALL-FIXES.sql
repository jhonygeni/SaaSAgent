-- =====================================================
-- SCRIPT CONSOLIDADO DE CORREÇÕES DO BANCO DE DADOS
-- ConversaAI Brasil - Execute no Console SQL do Supabase
-- =====================================================

-- Instruções:
-- 1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql
-- 2. Cole este script completo no editor SQL
-- 3. Execute o script (clique em "RUN")
-- 4. Verifique se não houve erros

-- =====================================================
-- PARTE 1: CORREÇÃO CRÍTICA DO TRIGGER DE USUÁRIOS
-- =====================================================

-- Remover trigger existente (se houver)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

-- Criar função corrigida
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Log da operação
  RAISE LOG 'Iniciando criação de perfil e assinatura para usuário: %', NEW.id;
  
  -- Buscar plano gratuito ativo
  SELECT id INTO free_plan_id 
  FROM public.subscription_plans 
  WHERE name = 'Free' AND is_active = true 
  LIMIT 1;
  
  -- Se não existe plano gratuito, criar um
  IF free_plan_id IS NULL THEN
    RAISE LOG 'Plano Free não encontrado, criando um novo';
    
    INSERT INTO public.subscription_plans (
      name, 
      price, 
      interval, 
      message_limit, 
      agent_limit, 
      is_active, 
      description,
      features
    )
    VALUES (
      'Free', 
      0, 
      'month', 
      50, 
      1, 
      true, 
      'Plano gratuito com recursos limitados',
      '{"basic_ai": true, "single_agent": true, "whatsapp_integration": true}'::jsonb
    )
    RETURNING id INTO free_plan_id;
    
    RAISE LOG 'Plano Free criado com ID: %', free_plan_id;
  END IF;

  -- Criar perfil do usuário com tratamento de conflitos
  BEGIN
    INSERT INTO public.profiles (
      id, 
      full_name, 
      is_active, 
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
      ),
      true,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Perfil criado para usuário: %', NEW.id;
    
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'Perfil já existe para usuário: %', NEW.id;
    WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
  END;
  
  -- Criar assinatura gratuita com tratamento de conflitos
  BEGIN
    INSERT INTO public.subscriptions (
      user_id, 
      plan_id, 
      status, 
      current_period_start, 
      current_period_end, 
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      free_plan_id,
      'active',
      NOW(),
      (NOW() + interval '1 year'),
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Assinatura criada para usuário: %', NEW.id;
    
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'Assinatura já existe para usuário: %', NEW.id;
    WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar assinatura para usuário %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro geral ao processar usuário %: %', NEW.id, SQLERRM;
    RETURN NEW; -- Não bloquear a criação do usuário mesmo com erro
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- =====================================================
-- PARTE 2: REPARO DE USUÁRIOS EXISTENTES
-- =====================================================

-- Função para reparar usuários órfãos
DO $$
DECLARE
  user_record RECORD;
  free_plan_id UUID;
  repair_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Iniciando reparo de usuários existentes...';
  
  -- Buscar ou criar plano gratuito
  SELECT id INTO free_plan_id 
  FROM public.subscription_plans 
  WHERE name = 'Free' AND is_active = true 
  LIMIT 1;
  
  IF free_plan_id IS NULL THEN
    INSERT INTO public.subscription_plans (
      name, price, interval, message_limit, agent_limit, 
      is_active, description, features
    )
    VALUES (
      'Free', 0, 'month', 50, 1, true, 
      'Plano gratuito com recursos limitados',
      '{"basic_ai": true, "single_agent": true, "whatsapp_integration": true}'::jsonb
    )
    RETURNING id INTO free_plan_id;
    
    RAISE NOTICE 'Plano Free criado: %', free_plan_id;
  END IF;
  
  -- Reparar usuários sem perfil
  INSERT INTO public.profiles (id, full_name, is_active, created_at, updated_at)
  SELECT 
    au.id,
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name', 
      split_part(au.email, '@', 1),
      'Usuário'
    ),
    true,
    au.created_at,
    NOW()
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS repair_count = ROW_COUNT;
  RAISE NOTICE 'Perfis criados: %', repair_count;
  
  -- Reparar usuários sem assinatura
  INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
  SELECT 
    au.id,
    free_plan_id,
    'active',
    au.created_at,
    (au.created_at + interval '1 year'),
    au.created_at,
    NOW()
  FROM auth.users au
  LEFT JOIN public.subscriptions s ON au.id = s.user_id
  WHERE s.user_id IS NULL
  ON CONFLICT (user_id) DO NOTHING;
  
  GET DIAGNOSTICS repair_count = ROW_COUNT;
  RAISE NOTICE 'Assinaturas criadas: %', repair_count;
  
  RAISE NOTICE 'Reparo de usuários concluído!';
END $$;

-- =====================================================
-- PARTE 3: ÍNDICES DE PERFORMANCE CRÍTICOS
-- =====================================================

-- Índices para tabela messages (alta frequência de consultas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_user_created 
ON messages(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_instance_direction 
ON messages(instance_id, direction);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_phone_numbers 
ON messages(sender_phone, recipient_phone);

-- Índices para tabela contacts
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_phone_unique 
ON contacts(user_id, phone_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_name_search 
ON contacts USING gin(to_tsvector('portuguese', name));

-- Índices para tabela usage_stats
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_stats_user_date_unique 
ON usage_stats(user_id, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_stats_date_range 
ON usage_stats(date DESC, user_id);

-- Índices para tabela agents
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_agents_user_status 
ON agents(user_id, status);

-- Índices para tabela whatsapp_instances
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_instances_user_status 
ON whatsapp_instances(user_id, status);

-- =====================================================
-- PARTE 4: POLÍTICAS RLS DE SEGURANÇA
-- =====================================================

-- Função auxiliar para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS nas tabelas
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_instances
DROP POLICY IF EXISTS "Users can manage their own instances" ON public.whatsapp_instances;
CREATE POLICY "Users can manage their own instances" ON public.whatsapp_instances
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Políticas para agents
DROP POLICY IF EXISTS "Users can manage their own agents" ON public.agents;
CREATE POLICY "Users can manage their own agents" ON public.agents
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Políticas para messages
DROP POLICY IF EXISTS "Users can access their own messages" ON public.messages;
CREATE POLICY "Users can access their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
CREATE POLICY "Users can insert their own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para contacts
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;
CREATE POLICY "Users can manage their own contacts" ON public.contacts
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Políticas para payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Políticas para usage_stats
DROP POLICY IF EXISTS "Users can view their own usage stats" ON public.usage_stats;
CREATE POLICY "Users can view their own usage stats" ON public.usage_stats
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- Políticas para event_logs
DROP POLICY IF EXISTS "Users can view their own event logs" ON public.event_logs;
CREATE POLICY "Users can view their own event logs" ON public.event_logs
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- =====================================================
-- PARTE 5: CONSTRAINTS DE INTEGRIDADE
-- =====================================================

-- Remover constraints existentes para evitar conflitos
DO $$
BEGIN
  -- Remover constraint de contacts se existir
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'contacts_user_phone_unique') THEN
    ALTER TABLE contacts DROP CONSTRAINT contacts_user_phone_unique;
  END IF;
  
  -- Remover constraint de usage_stats se existir
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'usage_stats_user_date_unique') THEN
    ALTER TABLE usage_stats DROP CONSTRAINT usage_stats_user_date_unique;
  END IF;
  
  -- Remover constraint de messages se existir
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'messages_direction_check') THEN
    ALTER TABLE messages DROP CONSTRAINT messages_direction_check;
  END IF;
  
  -- Remover constraint de subscriptions se existir
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
             WHERE constraint_name = 'subscriptions_status_check') THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_status_check;
  END IF;
END $$;

-- Criar constraints únicas e de validação
DO $$
BEGIN
  -- Constraint única para contacts (evitar duplicatas)
  BEGIN
    ALTER TABLE contacts 
    ADD CONSTRAINT contacts_user_phone_unique 
    UNIQUE (user_id, phone_number);
    RAISE NOTICE 'Constraint contacts_user_phone_unique criada';
  EXCEPTION 
    WHEN duplicate_table THEN
      RAISE NOTICE 'Constraint contacts_user_phone_unique já existe';
    WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar constraint contacts: %', SQLERRM;
  END;

  -- Constraint única para usage_stats
  BEGIN
    ALTER TABLE usage_stats 
    ADD CONSTRAINT usage_stats_user_date_unique 
    UNIQUE (user_id, date);
    RAISE NOTICE 'Constraint usage_stats_user_date_unique criada';
  EXCEPTION 
    WHEN duplicate_table THEN
      RAISE NOTICE 'Constraint usage_stats_user_date_unique já existe';
    WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar constraint usage_stats: %', SQLERRM;
  END;

  -- Constraint de validação para messages
  BEGIN
    ALTER TABLE messages 
    ADD CONSTRAINT messages_direction_check 
    CHECK (direction IN ('inbound', 'outbound'));
    RAISE NOTICE 'Constraint messages_direction_check criada';
  EXCEPTION 
    WHEN duplicate_table THEN
      RAISE NOTICE 'Constraint messages_direction_check já existe';
    WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar constraint messages: %', SQLERRM;
  END;

  -- Constraint de validação para subscriptions
  BEGIN
    ALTER TABLE subscriptions 
    ADD CONSTRAINT subscriptions_status_check 
    CHECK (status IN ('active', 'trialing', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid'));
    RAISE NOTICE 'Constraint subscriptions_status_check criada';
  EXCEPTION 
    WHEN duplicate_table THEN
      RAISE NOTICE 'Constraint subscriptions_status_check já existe';
    WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar constraint subscriptions: %', SQLERRM;
  END;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
  plan_count INTEGER;
  trigger_exists BOOLEAN;
BEGIN
  -- Verificar tabelas principais
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'subscription_plans', 'subscriptions');
  
  -- Verificar plano gratuito
  SELECT COUNT(*) INTO plan_count
  FROM public.subscription_plans 
  WHERE name = 'Free' AND is_active = true;
  
  -- Verificar trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  -- Relatório
  RAISE NOTICE '=== RELATÓRIO DE VALIDAÇÃO ===';
  RAISE NOTICE 'Tabelas principais: % de 3', table_count;
  RAISE NOTICE 'Plano Free ativo: %', CASE WHEN plan_count > 0 THEN 'SIM' ELSE 'NÃO' END;
  RAISE NOTICE 'Trigger de usuário: %', CASE WHEN trigger_exists THEN 'ATIVO' ELSE 'INATIVO' END;
  
  IF table_count = 3 AND plan_count > 0 AND trigger_exists THEN
    RAISE NOTICE '✅ TODAS AS CORREÇÕES APLICADAS COM SUCESSO!';
  ELSE
    RAISE NOTICE '⚠️ ALGUMAS CORREÇÕES PODEM PRECISAR DE ATENÇÃO';
  END IF;
  
  RAISE NOTICE '=== FIM DO RELATÓRIO ===';
END $$;
