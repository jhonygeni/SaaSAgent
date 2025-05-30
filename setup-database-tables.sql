-- Arquivo: setup-database-tables.sql
-- Este script criará as tabelas necessárias e um plano de assinatura gratuito padrão

-- Tabela para planos de assinatura (se não existir)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    period_days INTEGER NOT NULL DEFAULT 30,
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para perfis de usuário (se não existir)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para assinaturas (se não existir)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Inserir plano gratuito padrão (caso não exista)
INSERT INTO public.subscription_plans (name, description, price, period_days, features)
VALUES ('Free', 'Plano Gratuito', 0, 30, '{"limite_whatsapp": 1, "mensagens_diarias": 100}')
ON CONFLICT (name) DO NOTHING;

-- Verificar se o trigger já existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        -- Criar função para lidar com novos usuários (se não existir)
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

        -- Criar o trigger
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();
    END IF;
END$$;
