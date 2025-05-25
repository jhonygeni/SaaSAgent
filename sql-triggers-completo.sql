-- SQL COMPLETO PARA EXECUTAR NO CONSOLE SUPABASE
-- Copie e cole este código no SQL Editor

-- 1. Criar função para lidar com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Buscar plano gratuito
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1;
  
  -- Se não existir, usar o primeiro plano disponível
  IF free_plan_id IS NULL THEN
    SELECT id INTO free_plan_id FROM public.subscription_plans LIMIT 1;
  END IF;

  -- Criar perfil
  INSERT INTO public.profiles (id, full_name, avatar_url, is_active, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NULL, true, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Criar assinatura se houver plano disponível
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status, created_at, updated_at, current_period_start, current_period_end)
    VALUES (NEW.id, free_plan_id, 'active', NOW(), NOW(), NOW(), (NOW() + interval '100 years'))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();

-- 4. REPARAR USUÁRIOS EXISTENTES SEM PERFIL/ASSINATURA
-- Criar perfis para usuários sem perfil
INSERT INTO public.profiles (id, full_name, avatar_url, is_active, created_at, updated_at)
SELECT 
  auth.users.id,
  COALESCE(auth.users.raw_user_meta_data->>'name', auth.users.email),
  NULL,
  true,
  NOW(),
  NOW()
FROM auth.users
LEFT JOIN public.profiles ON auth.users.id = public.profiles.id
WHERE public.profiles.id IS NULL;

-- 5. Criar assinaturas para usuários sem assinatura
INSERT INTO public.subscriptions (user_id, plan_id, status, created_at, updated_at, current_period_start, current_period_end)
SELECT 
  auth.users.id,
  (SELECT id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1),
  'active',
  NOW(),
  NOW(),
  NOW(),
  (NOW() + interval '100 years')
FROM auth.users
LEFT JOIN public.subscriptions ON auth.users.id = public.subscriptions.user_id
WHERE public.subscriptions.user_id IS NULL;

-- 6. Configurar políticas RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions 
  FOR SELECT USING (auth.uid() = user_id);
