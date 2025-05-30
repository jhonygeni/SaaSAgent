-- Script SQL para configurar triggers de usuário diretamente no Console do Supabase
-- Instruções:
-- 1. Acesse o Console do Supabase: https://app.supabase.io
-- 2. Selecione seu projeto
-- 3. Vá para "SQL Editor"
-- 4. Cole este script completo na janela do editor SQL
-- 5. Execute o script (clique em "RUN")
-- 6. Verifique se não houve erros na execução

-- Certifique-se de que as tabelas necessárias existam
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '100 years',
  cancel_at TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_intent_id TEXT
);

-- Inserir plano gratuito se não existir
INSERT INTO public.subscription_plans (name, price, interval, message_limit, agent_limit, is_active, description, features)
SELECT 'Free', 0, 'month', 50, 1, true, 'Plano gratuito com recursos limitados', '{"basic_ai": true, "single_agent": true}'
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Free');

-- Criar ou substituir função para lidar com novos registros de usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Garantir que temos um plano gratuito
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1;
  
  -- Se não existir plano gratuito, criar um
  IF free_plan_id IS NULL THEN
    INSERT INTO public.subscription_plans (name, price, interval, message_limit, agent_limit, is_active, description, features)
    VALUES ('Free', 0, 'month', 50, 1, true, 'Plano gratuito com recursos limitados', '{"basic_ai": true, "single_agent": true}')
    RETURNING id INTO free_plan_id;
  END IF;

  -- Criar perfil para o novo usuário
  INSERT INTO public.profiles (id, full_name, avatar_url, is_active, created_at, updated_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NULL, true, NOW(), NOW());
  
  -- Criar assinatura gratuita para o novo usuário
  INSERT INTO public.subscriptions (user_id, plan_id, status, created_at, updated_at, current_period_start, current_period_end)
  VALUES (NEW.id, free_plan_id, 'active', NOW(), NOW(), NOW(), (NOW() + interval '100 years'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();

-- Para usuários existentes que ainda não têm perfis e assinaturas
DO $$
DECLARE
  user_rec RECORD;
  free_plan_id UUID;
BEGIN
  -- Garantir que temos um plano gratuito
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1;
  
  -- Se não existir plano gratuito, criar um
  IF free_plan_id IS NULL THEN
    INSERT INTO public.subscription_plans (name, price, interval, message_limit, agent_limit, is_active, description, features)
    VALUES ('Free', 0, 'month', 50, 1, true, 'Plano gratuito com recursos limitados', '{"basic_ai": true, "single_agent": true}')
    RETURNING id INTO free_plan_id;
  END IF;
  
  -- Para cada usuário que não tenha perfil, criar um
  FOR user_rec IN SELECT id, raw_user_meta_data->>'name' as name FROM auth.users 
  LOOP
    -- Se não existir perfil para este usuário, criar um
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_rec.id) THEN
      RAISE NOTICE 'Criando perfil para usuário: %', user_rec.id;
      INSERT INTO public.profiles (id, full_name, avatar_url, is_active, created_at, updated_at)
      VALUES (user_rec.id, user_rec.name, NULL, true, NOW(), NOW());
    END IF;
    
    -- Se não existir assinatura para este usuário, criar uma
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = user_rec.id) THEN
      RAISE NOTICE 'Criando assinatura para usuário: %', user_rec.id;
      INSERT INTO public.subscriptions (user_id, plan_id, status, created_at, updated_at, current_period_start, current_period_end)
      VALUES (user_rec.id, free_plan_id, 'active', NOW(), NOW(), NOW(), (NOW() + interval '100 years'));
    END IF;
  END LOOP;
END;
$$;

-- Conferir se a política de RLS para a tabela de perfis permite o usuário ver seu próprio perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Criar políticas para subscription_plans
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans 
  FOR SELECT USING (true);

-- Criar políticas para subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

-- Pronto! O script SQL foi executado com sucesso.
