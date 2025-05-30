-- Create or replace function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Ensure we have a free plan
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1;
  
  -- If no free plan exists, create one
  IF free_plan_id IS NULL THEN
    INSERT INTO public.subscription_plans (name, price, interval, message_limit, agent_limit, is_active, description, features)
    VALUES ('Free', 0, 'month', 50, 1, true, 'Free plan with limited features', '{"basic_ai": true, "single_agent": true}')
    RETURNING id INTO free_plan_id;
  END IF;

  -- Create a profile for the new user
  INSERT INTO public.profiles (id, full_name, avatar_url, is_active, created_at, updated_at)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', NULL, true, NOW(), NOW());
  
  -- Create a free subscription for the new user
  INSERT INTO public.subscriptions (user_id, plan_id, status, created_at, updated_at, current_period_start, current_period_end)
  VALUES (NEW.id, free_plan_id, 'active', NOW(), NOW(), NOW(), (NOW() + interval '100 years'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();

-- For existing users that don't have profiles and subscriptions yet
DO $$
DECLARE
  user_rec RECORD;
  free_plan_id UUID;
BEGIN
  -- Make sure we have a free plan
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1;
  
  -- If no free plan exists, create one
  IF free_plan_id IS NULL THEN
    INSERT INTO public.subscription_plans (name, price, interval, message_limit, agent_limit, is_active, description, features)
    VALUES ('Free', 0, 'month', 50, 1, true, 'Free plan with limited features', '{"basic_ai": true, "single_agent": true}')
    RETURNING id INTO free_plan_id;
  END IF;

  -- Process existing users
  FOR user_rec IN SELECT id, email, raw_user_meta_data FROM auth.users
  LOOP
    -- Check if user already has a profile
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_rec.id) THEN
      -- Create profile
      INSERT INTO public.profiles (id, full_name, avatar_url, is_active, created_at, updated_at)
      VALUES (user_rec.id, user_rec.raw_user_meta_data->>'name', NULL, true, NOW(), NOW());
    END IF;
    
    -- Check if user already has a subscription
    IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = user_rec.id) THEN
      -- Create subscription
      INSERT INTO public.subscriptions (user_id, plan_id, status, created_at, updated_at, current_period_start, current_period_end)
      VALUES (user_rec.id, free_plan_id, 'active', NOW(), NOW(), NOW(), (NOW() + interval '100 years'));
    END IF;
  END LOOP;
END $$;
