-- =====================================================
-- SCRIPT SIMPLIFICADO DE CORREÇÕES DO BANCO DE DADOS
-- ConversaAI Brasil - Versão Compatível com Todas as Versões PostgreSQL
-- =====================================================

-- Instruções:
-- 1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql
-- 2. Execute este script SEÇÃO POR SEÇÃO (não tudo de uma vez)
-- 3. Aguarde cada seção terminar antes de executar a próxima

-- =====================================================
-- SEÇÃO 1: CRIAR TABELAS SE NÃO EXISTIREM
-- =====================================================

-- Tabela de planos (se não existir)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  price INTEGER NOT NULL DEFAULT 0,
  interval TEXT NOT NULL DEFAULT 'month',
  message_limit INTEGER NOT NULL DEFAULT 50,
  agent_limit INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis (se não existir)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'client',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de assinaturas (se não existir)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '100 years',
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Inserir plano gratuito
INSERT INTO public.subscription_plans (name, price, interval, message_limit, agent_limit, is_active, description, features)
VALUES ('Free', 0, 'month', 50, 1, true, 'Plano gratuito com recursos limitados', '{"basic_ai": true, "single_agent": true, "whatsapp_integration": true}')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SEÇÃO 2: CORRIGIR TRIGGER DE USUÁRIOS
-- =====================================================

-- Remover trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

-- Criar função corrigida
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Buscar plano gratuito
  SELECT id INTO free_plan_id 
  FROM public.subscription_plans 
  WHERE name = 'Free' AND is_active = true 
  LIMIT 1;
  
  -- Se não encontrou, criar plano
  IF free_plan_id IS NULL THEN
    INSERT INTO public.subscription_plans (name, price, interval, message_limit, agent_limit, is_active, description, features)
    VALUES ('Free', 0, 'month', 50, 1, true, 'Plano gratuito', '{"basic_ai": true}')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO free_plan_id;
    
    -- Se ainda não tem ID, buscar novamente
    IF free_plan_id IS NULL THEN
      SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1;
    END IF;
  END IF;

  -- Criar perfil do usuário
  BEGIN
    INSERT INTO public.profiles (id, full_name, is_active, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'Usuário'
      ),
      true,
      NOW(),
      NOW()
    );
  EXCEPTION 
    WHEN unique_violation THEN
      -- Perfil já existe, continuar
      NULL;
    WHEN OTHERS THEN
      -- Log do erro mas não falhar
      NULL;
  END;
  
  -- Criar assinatura
  IF free_plan_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
      VALUES (NEW.id, free_plan_id, 'active', NOW(), (NOW() + interval '1 year'), NOW(), NOW());
    EXCEPTION 
      WHEN unique_violation THEN
        -- Assinatura já existe, continuar
        NULL;
      WHEN OTHERS THEN
        -- Log do erro mas não falhar
        NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- =====================================================
-- SEÇÃO 3: REPARAR USUÁRIOS EXISTENTES
-- =====================================================

DO $$
DECLARE
  free_plan_id UUID;
  repair_count INTEGER := 0;
BEGIN
  -- Buscar plano gratuito
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' AND is_active = true LIMIT 1;
  
  IF free_plan_id IS NULL THEN
    INSERT INTO public.subscription_plans (name, price, interval, message_limit, agent_limit, is_active, description, features)
    VALUES ('Free', 0, 'month', 50, 1, true, 'Plano gratuito', '{"basic_ai": true}')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO free_plan_id;
    
    IF free_plan_id IS NULL THEN
      SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1;
    END IF;
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
  RAISE NOTICE 'Perfis reparados: %', repair_count;
  
  -- Reparar usuários sem assinatura
  IF free_plan_id IS NOT NULL THEN
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
    RAISE NOTICE 'Assinaturas reparadas: %', repair_count;
  END IF;
END $$;

-- =====================================================
-- SEÇÃO 4: POLÍTICAS RLS BÁSICAS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para subscription_plans
DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view plans" ON public.subscription_plans 
  FOR SELECT USING (true);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
  table_count INTEGER := 0;
  plan_count INTEGER := 0;
  trigger_exists BOOLEAN := false;
  profile_count INTEGER := 0;
  subscription_count INTEGER := 0;
BEGIN
  -- Contar tabelas
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'subscription_plans', 'subscriptions');
  
  -- Contar plano gratuito
  SELECT COUNT(*) INTO plan_count
  FROM public.subscription_plans 
  WHERE name = 'Free' AND is_active = true;
  
  -- Verificar trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  -- Contar perfis e assinaturas
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO subscription_count FROM public.subscriptions;
  
  -- Relatório
  RAISE NOTICE '=====================================';
  RAISE NOTICE '       RELATÓRIO DE CORREÇÕES       ';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'Tabelas criadas: %/3', table_count;
  RAISE NOTICE 'Plano Free ativo: %', CASE WHEN plan_count > 0 THEN 'SIM' ELSE 'NÃO' END;
  RAISE NOTICE 'Trigger funcionando: %', CASE WHEN trigger_exists THEN 'SIM' ELSE 'NÃO' END;
  RAISE NOTICE 'Total de perfis: %', profile_count;
  RAISE NOTICE 'Total de assinaturas: %', subscription_count;
  
  IF table_count = 3 AND plan_count > 0 AND trigger_exists THEN
    RAISE NOTICE '✅ CORREÇÕES APLICADAS COM SUCESSO!';
    RAISE NOTICE 'O sistema está funcionando corretamente.';
  ELSE
    RAISE NOTICE '⚠️ Algumas correções podem precisar de atenção';
    RAISE NOTICE 'Verifique os passos acima individualmente';
  END IF;
  
  RAISE NOTICE '=====================================';
END $$;
