# 🚨 PROBLEMA CONFIRMADO - AÇÃO IMEDIATA NECESSÁRIA

## 📊 DIAGNÓSTICO ATUAL:
- ✅ 4 usuários cadastrados
- ❌ 1 usuário sem confirmação de email (`moscalucasmosca@gmail.com`)
- ❌ Apenas 2 perfis criados de 4 usuários
- ❌ ZERO assinaturas criadas (tabela vazia)

## 🔥 CONFIGURAÇÕES OBRIGATÓRIAS (2 MINUTOS):

### 1️⃣ CONFIGURAR AUTH HOOKS (Emails)

**📍 Acesse:** https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/settings

**📧 Na seção "Auth Hooks":**
- **Send Email Hook URL**: `https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email`
- **HTTP Method**: `POST`
- **Events**: ✅ Marque `signup` e `email_change`
- Clique **"Save"**

### 2️⃣ EXECUTAR SQL TRIGGERS (Perfis e Assinaturas)

**📍 Acesse:** https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql

**📝 Cole e execute este SQL:**

```sql
-- Criar função para lidar com novos usuários
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

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar novo trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();

-- REPARAR USUÁRIOS EXISTENTES SEM PERFIL/ASSINATURA
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

-- Criar assinaturas para usuários sem assinatura
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
```

### 3️⃣ REENVIAR EMAIL CONFIRMAÇÃO

Após configurar Auth Hooks, reenvie email para usuário pendente:

```bash
curl -X POST "https://hpovwcaskorzzrpphgkc.supabase.co/auth/v1/resend" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.PcOQzSbU5aH8X8gQbFZBpJzKwU7E-wUJ_YQa0VLgTRo" \
  -d '{"email": "moscalucasmosca@gmail.com", "type": "signup"}'
```

## 🎯 RESULTADO ESPERADO:
- ✅ Emails de confirmação funcionando
- ✅ Todos os usuários com perfis
- ✅ Todos os usuários com assinaturas Free
- ✅ Sistema 100% funcional

**⚡ Execute essas configurações AGORA e tudo funcionará!**
