-- Script de Reparo de Usuários Existentes
-- ConversaAI Brasil - Banco de Dados Supabase
-- Execute APÓS fix-user-trigger.sql

-- =====================================================
-- 1. REPARAR USUÁRIOS SEM PERFIL E ASSINATURA
-- =====================================================

DO $$
DECLARE
  user_rec RECORD;
  free_plan_id UUID;
  users_without_profile INTEGER := 0;
  users_without_subscription INTEGER := 0;
  profiles_created INTEGER := 0;
  subscriptions_created INTEGER := 0;
  errors_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 ===== INICIANDO REPARO DE USUÁRIOS EXISTENTES =====';
  RAISE NOTICE '';
  
  -- =====================================================
  -- 1. GARANTIR PLANO GRATUITO
  -- =====================================================
  
  RAISE NOTICE '📋 Verificando plano gratuito...';
  
  SELECT id INTO free_plan_id 
  FROM public.subscription_plans 
  WHERE name = 'Free' AND is_active = true 
  LIMIT 1;
  
  IF free_plan_id IS NULL THEN
    RAISE NOTICE '🆕 Criando plano gratuito...';
    
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
    
    RAISE NOTICE '✅ Plano gratuito criado com ID: %', free_plan_id;
  ELSE
    RAISE NOTICE '✅ Plano gratuito encontrado: %', free_plan_id;
  END IF;
  
  -- =====================================================
  -- 2. CONTAR USUÁRIOS SEM PERFIL
  -- =====================================================
  
  SELECT COUNT(*) INTO users_without_profile
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '👥 Usuários sem perfil encontrados: %', users_without_profile;
  
  -- =====================================================
  -- 3. CRIAR PERFIS PARA USUÁRIOS SEM PERFIL
  -- =====================================================
  
  IF users_without_profile > 0 THEN
    RAISE NOTICE '🔧 Criando perfis para usuários sem perfil...';
    
    FOR user_rec IN 
      SELECT 
        au.id, 
        au.email, 
        au.raw_user_meta_data,
        au.created_at
      FROM auth.users au
      LEFT JOIN public.profiles p ON au.id = p.id
      WHERE p.id IS NULL
      ORDER BY au.created_at
    LOOP
      BEGIN
        INSERT INTO public.profiles (
          id, 
          full_name, 
          is_active, 
          created_at, 
          updated_at
        )
        VALUES (
          user_rec.id,
          COALESCE(
            user_rec.raw_user_meta_data->>'full_name',
            user_rec.raw_user_meta_data->>'name',
            split_part(user_rec.email, '@', 1),
            'Usuário'
          ),
          true,
          COALESCE(user_rec.created_at, NOW()),
          NOW()
        );
        
        profiles_created := profiles_created + 1;
        
        IF profiles_created % 10 = 0 THEN
          RAISE NOTICE '   📝 Perfis criados: %/%', profiles_created, users_without_profile;
        END IF;
        
      EXCEPTION 
        WHEN unique_violation THEN
          -- Perfil já existe, ignorar
          NULL;
        WHEN OTHERS THEN
          errors_count := errors_count + 1;
          RAISE WARNING '❌ Erro ao criar perfil para usuário %: %', user_rec.id, SQLERRM;
      END;
    END LOOP;
    
    RAISE NOTICE '✅ Perfis criados: %', profiles_created;
  END IF;
  
  -- =====================================================
  -- 4. CONTAR USUÁRIOS SEM ASSINATURA
  -- =====================================================
  
  SELECT COUNT(*) INTO users_without_subscription
  FROM auth.users au
  LEFT JOIN public.subscriptions s ON au.id = s.user_id
  WHERE s.user_id IS NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '💰 Usuários sem assinatura encontrados: %', users_without_subscription;
  
  -- =====================================================
  -- 5. CRIAR ASSINATURAS PARA USUÁRIOS SEM ASSINATURA
  -- =====================================================
  
  IF users_without_subscription > 0 THEN
    RAISE NOTICE '🔧 Criando assinaturas para usuários sem assinatura...';
    
    FOR user_rec IN 
      SELECT 
        au.id, 
        au.email,
        au.created_at
      FROM auth.users au
      LEFT JOIN public.subscriptions s ON au.id = s.user_id
      WHERE s.user_id IS NULL
      ORDER BY au.created_at
    LOOP
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
          user_rec.id,
          free_plan_id,
          'active',
          COALESCE(user_rec.created_at, NOW()),
          COALESCE(user_rec.created_at, NOW()) + interval '1 year',
          COALESCE(user_rec.created_at, NOW()),
          NOW()
        );
        
        subscriptions_created := subscriptions_created + 1;
        
        IF subscriptions_created % 10 = 0 THEN
          RAISE NOTICE '   💳 Assinaturas criadas: %/%', subscriptions_created, users_without_subscription;
        END IF;
        
      EXCEPTION 
        WHEN unique_violation THEN
          -- Assinatura já existe, ignorar
          NULL;
        WHEN OTHERS THEN
          errors_count := errors_count + 1;
          RAISE WARNING '❌ Erro ao criar assinatura para usuário %: %', user_rec.id, SQLERRM;
      END;
    END LOOP;
    
    RAISE NOTICE '✅ Assinaturas criadas: %', subscriptions_created;
  END IF;
  
  -- =====================================================
  -- 6. RELATÓRIO FINAL
  -- =====================================================
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 ===== RELATÓRIO DE REPARO =====';
  RAISE NOTICE '👥 Usuários sem perfil encontrados: %', users_without_profile;
  RAISE NOTICE '📝 Perfis criados: %', profiles_created;
  RAISE NOTICE '💰 Usuários sem assinatura encontrados: %', users_without_subscription;
  RAISE NOTICE '💳 Assinaturas criadas: %', subscriptions_created;
  RAISE NOTICE '❌ Erros encontrados: %', errors_count;
  RAISE NOTICE '';
  
  IF errors_count = 0 THEN
    RAISE NOTICE '✅ REPARO CONCLUÍDO COM SUCESSO!';
  ELSE
    RAISE NOTICE '⚠️ REPARO CONCLUÍDO COM % ERROS', errors_count;
  END IF;
  
  RAISE NOTICE '';
  
END $$;

-- =====================================================
-- 7. VERIFICAÇÃO DE INTEGRIDADE FINAL
-- =====================================================

-- Verificar usuários ainda sem perfil
DO $$
DECLARE
  orphaned_users INTEGER;
  orphaned_subscriptions INTEGER;
BEGIN
  RAISE NOTICE '🔍 ===== VERIFICAÇÃO DE INTEGRIDADE =====';
  
  -- Contar usuários sem perfil
  SELECT COUNT(*) INTO orphaned_users
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL;
  
  -- Contar usuários sem assinatura
  SELECT COUNT(*) INTO orphaned_subscriptions
  FROM auth.users au
  LEFT JOIN public.subscriptions s ON au.id = s.user_id
  WHERE s.user_id IS NULL;
  
  RAISE NOTICE '👥 Usuários sem perfil restantes: %', orphaned_users;
  RAISE NOTICE '💰 Usuários sem assinatura restantes: %', orphaned_subscriptions;
  
  IF orphaned_users = 0 AND orphaned_subscriptions = 0 THEN
    RAISE NOTICE '✅ INTEGRIDADE VERIFICADA: Todos os usuários possuem perfil e assinatura!';
  ELSE
    RAISE NOTICE '⚠️ ATENÇÃO: Ainda existem usuários sem perfil ou assinatura';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 8. ESTATÍSTICAS FINAIS
-- =====================================================

SELECT 
  'Estatísticas Finais' as categoria,
  (SELECT COUNT(*) FROM auth.users) as total_usuarios,
  (SELECT COUNT(*) FROM public.profiles) as total_perfis,
  (SELECT COUNT(*) FROM public.subscriptions) as total_assinaturas,
  (SELECT COUNT(*) FROM public.subscription_plans WHERE is_active = true) as planos_ativos;

-- Mostrar usuários e seus dados
SELECT 
  'Amostra de Usuários' as info,
  au.email,
  p.full_name,
  sp.name as plano,
  s.status as status_assinatura
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.subscriptions s ON au.id = s.user_id
LEFT JOIN public.subscription_plans sp ON s.plan_id = sp.id
ORDER BY au.created_at DESC
LIMIT 10;
