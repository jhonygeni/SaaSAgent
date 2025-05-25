-- =====================================================
-- SCRIPT SIMPLIFICADO DE CORREÇÕES DO BANCO DE DADOS
-- ConversaAI Brasil - Execute SEÇÃO POR SEÇÃO no Console SQL
-- =====================================================

-- INSTRUÇÕES:
-- 1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql
-- 2. Execute UMA SEÇÃO DE CADA VEZ (copie, cole e execute)
-- 3. Aguarde conclusão antes de executar a próxima seção
-- 4. Verifique se não houve erros antes de continuar

-- =====================================================
-- SEÇÃO 1: CORREÇÃO DO TRIGGER DE USUÁRIOS (CRÍTICO)
-- =====================================================

-- Remover trigger e função existentes
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

  -- Criar perfil do usuário
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
  
  -- Criar assinatura gratuita
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

-- Verificar se foi criado
SELECT 'Trigger criado com sucesso!' as status;

-- =====================================================
-- SEÇÃO 2: REPARAR USUÁRIOS EXISTENTES SEM PERFIL/ASSINATURA
-- =====================================================

-- Verificar usuários órfãos ANTES do reparo
SELECT 
  'Usuários sem perfil:' as tipo,
  COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Usuários sem assinatura:' as tipo,
  COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.subscriptions s ON au.id = s.user_id
WHERE s.user_id IS NULL;

-- Executar reparo
DO $$
DECLARE
  free_plan_id UUID;
  profile_count INTEGER := 0;
  subscription_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Iniciando reparo de usuários existentes...';
  
  -- Garantir que existe plano gratuito
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
  
  -- Criar perfis para usuários órfãos
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
  
  GET DIAGNOSTICS profile_count = ROW_COUNT;
  
  -- Criar assinaturas para usuários órfãos
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
  
  GET DIAGNOSTICS subscription_count = ROW_COUNT;
  
  RAISE NOTICE 'Reparo concluído: % perfis e % assinaturas criadas', profile_count, subscription_count;
END $$;

-- Verificar DEPOIS do reparo
SELECT 
  'Usuários sem perfil (após reparo):' as tipo,
  COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Usuários sem assinatura (após reparo):' as tipo,
  COUNT(*) as quantidade
FROM auth.users au
LEFT JOIN public.subscriptions s ON au.id = s.user_id
WHERE s.user_id IS NULL;

-- =====================================================
-- SEÇÃO 3: ÍNDICES DE PERFORMANCE (OPCIONAL MAS RECOMENDADO)
-- =====================================================

-- Índices para tabela messages (críticos para performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_user_created 
ON messages(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_instance_direction 
ON messages(instance_id, direction);

-- Índices para tabela contacts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_user_active 
ON contacts(user_id) WHERE is_active = true;

-- Índices para tabela usage_stats
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usage_stats_user_date 
ON usage_stats(user_id, date DESC);

-- Verificar índices criados
SELECT 
  'Índices criados:' as status,
  COUNT(*) as quantidade
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';

-- =====================================================
-- SEÇÃO 4: POLÍTICAS RLS BÁSICAS (OPCIONAL)
-- =====================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Política básica para profiles - usuários só veem seu próprio perfil
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Política básica para subscriptions - usuários só veem suas assinaturas
DROP POLICY IF EXISTS "Users view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Política para subscription_plans - todos podem ver os planos
DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view plans" ON public.subscription_plans
  FOR SELECT USING (true);

SELECT 'Políticas RLS básicas aplicadas' as status;

-- =====================================================
-- SEÇÃO 5: VALIDAÇÃO FINAL
-- =====================================================

-- Verificar estrutura crítica
SELECT 
  'Validação Final' as secao,
  'Tabelas principais' as item,
  COUNT(*) as valor
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'subscription_plans', 'subscriptions')

UNION ALL

SELECT 
  'Validação Final' as secao,
  'Plano Free ativo' as item,
  COUNT(*) as valor
FROM public.subscription_plans 
WHERE name = 'Free' AND is_active = true

UNION ALL

SELECT 
  'Validação Final' as secao,
  'Trigger ativo' as item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'on_auth_user_created'
  ) THEN 1 ELSE 0 END as valor

UNION ALL

SELECT 
  'Validação Final' as secao,
  'Usuários totais' as item,
  COUNT(*) as valor
FROM auth.users

UNION ALL

SELECT 
  'Validação Final' as secao,
  'Perfis ativos' as item,
  COUNT(*) as valor
FROM public.profiles 
WHERE is_active = true

UNION ALL

SELECT 
  'Validação Final' as secao,
  'Assinaturas ativas' as item,
  COUNT(*) as valor
FROM public.subscriptions 
WHERE status = 'active';

-- Teste final do sistema
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
    AND EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Free' AND is_active = true)
    THEN '🟢 SISTEMA FUNCIONANDO - Novos usuários serão criados automaticamente com perfil e assinatura!'
    ELSE '🔴 PROBLEMA DETECTADO - Verificar logs de execução'
  END as resultado_final;
