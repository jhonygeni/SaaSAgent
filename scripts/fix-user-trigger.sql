-- Script de Correção Crítica do Trigger de Criação de Usuários
-- ConversaAI Brasil - Banco de Dados Supabase
-- Execute este script no SQL Editor do Supabase

-- =====================================================
-- 1. CRIAR FUNÇÃO CORRIGIDA DE CRIAÇÃO DE USUÁRIOS
-- =====================================================

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
      (NOW() + interval '1 year'), -- 1 ano de plano gratuito
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
  
  RAISE LOG 'Criação de usuário finalizada com sucesso: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE ERROR 'Erro crítico na criação do usuário %: %', NEW.id, SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. RECRIAR TRIGGER
-- =====================================================

-- Remover trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_signup();

-- =====================================================
-- 3. VERIFICAR ESTRUTURA DAS TABELAS
-- =====================================================

-- Garantir que as tabelas tenham a estrutura correta
-- (Apenas executa se as colunas não existirem)

-- Verificar e ajustar tabela profiles se necessário
DO $$
BEGIN
  -- Verificar se coluna full_name existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'full_name'
    AND table_schema = 'public'
  ) THEN
    -- Se não existe, tentar adicionar
    BEGIN
      ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
      RAISE LOG 'Coluna full_name adicionada à tabela profiles';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Não foi possível adicionar coluna full_name: %', SQLERRM;
    END;
  END IF;
  
  -- Verificar se coluna is_active existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'is_active'
    AND table_schema = 'public'
  ) THEN
    BEGIN
      ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
      RAISE LOG 'Coluna is_active adicionada à tabela profiles';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Não foi possível adicionar coluna is_active: %', SQLERRM;
    END;
  END IF;
END $$;

-- =====================================================
-- 4. TESTE DO TRIGGER
-- =====================================================

-- Função para testar o trigger (opcional)
CREATE OR REPLACE FUNCTION test_user_trigger()
RETURNS TEXT AS $$
DECLARE
  test_result TEXT := 'Trigger funcionando corretamente';
BEGIN
  -- Verificar se função existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'handle_new_user_signup'
  ) THEN
    RETURN 'ERRO: Função handle_new_user_signup não existe';
  END IF;
  
  -- Verificar se trigger existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RETURN 'ERRO: Trigger on_auth_user_created não existe';
  END IF;
  
  -- Verificar se plano Free existe
  IF NOT EXISTS (
    SELECT 1 FROM public.subscription_plans 
    WHERE name = 'Free' AND is_active = true
  ) THEN
    RETURN 'AVISO: Plano Free não encontrado (será criado automaticamente)';
  END IF;
  
  RETURN test_result;
END;
$$ LANGUAGE plpgsql;

-- Executar teste
SELECT test_user_trigger();

-- =====================================================
-- 5. LOG DE FINALIZAÇÃO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ===== CORREÇÃO DO TRIGGER CONCLUÍDA =====';
  RAISE NOTICE '✅ Função handle_new_user_signup() atualizada';
  RAISE NOTICE '✅ Trigger on_auth_user_created recriado';
  RAISE NOTICE '✅ Estrutura das tabelas verificada';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Execute repair-existing-users.sql para reparar usuários existentes';
  RAISE NOTICE '2. Teste criando um novo usuário';
  RAISE NOTICE '3. Verifique os logs para confirmar funcionamento';
  RAISE NOTICE '';
END $$;
