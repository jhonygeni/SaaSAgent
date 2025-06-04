-- Clean up any existing objects with dependencies
DROP TRIGGER IF EXISTS create_subscription_on_profile_creation ON public.profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_subscription_trigger_dynamic() CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;

-- Create tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    interval TEXT NOT NULL DEFAULT 'monthly',
    message_limit INTEGER NOT NULL DEFAULT 100,
    agent_limit INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '100 years',
    cancel_at_period_end BOOLEAN DEFAULT false,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscriptions TO authenticated;

-- Create policies
CREATE POLICY "Users can view own profile" ON public.profiles 
    FOR SELECT TO authenticated 
    USING (auth.uid() = id);

CREATE POLICY "Anyone can view plans" ON public.subscription_plans 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "Users can view own subscription" ON public.subscriptions 
    FOR SELECT TO authenticated 
    USING (auth.uid() = user_id);

-- Insert plans
INSERT INTO public.subscription_plans (name, description, price, interval, message_limit, agent_limit, features)
VALUES 
    ('free', 'Plano gratuito com recursos básicos', 0, 'monthly', 100, 1, '{"basic_ai": true, "single_agent": true, "whatsapp_integration": true}'::jsonb),
    ('starter', 'Plano inicial para pequenos negócios', 199, 'monthly', 2500, 1, '{"basic_ai": true, "single_agent": true, "whatsapp_integration": true, "analytics": true}'::jsonb),
    ('growth', 'Plano avançado para empresas em crescimento', 249, 'monthly', 5000, 3, '{"basic_ai": true, "multi_agent": true, "whatsapp_integration": true, "analytics": true, "api_access": true}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    interval = EXCLUDED.interval,
    message_limit = EXCLUDED.message_limit,
    agent_limit = EXCLUDED.agent_limit,
    features = EXCLUDED.features;

-- Create simple trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get free plan ID
    SELECT id INTO free_plan_id FROM subscription_plans WHERE name = 'free' LIMIT 1;
    
    -- Create profile
    INSERT INTO profiles (id, full_name, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        true
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Create subscription
    IF free_plan_id IS NOT NULL THEN
        INSERT INTO subscriptions (user_id, plan_id, status)
        VALUES (NEW.id, free_plan_id, 'active')
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- Fix existing users
DO $$
DECLARE
    free_plan_id UUID;
BEGIN
    -- Get free plan ID
    SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'free' LIMIT 1;
    
    -- Fix profiles
    INSERT INTO public.profiles (id, full_name, is_active)
    SELECT 
        u.id,
        COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
        true
    FROM auth.users u
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = u.id
    );
    
    -- Fix subscriptions
    IF free_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (user_id, plan_id, status)
        SELECT 
            u.id,
            free_plan_id,
            'active'
        FROM auth.users u
        WHERE NOT EXISTS (
            SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id
        );
    END IF;
END $$; 