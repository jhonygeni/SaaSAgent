# 🔧 CONFIGURAÇÃO MANUAL OBRIGATÓRIA - ConversaAI Brasil

## ❗ PROBLEMA IDENTIFICADO

O sistema está funcionando parcialmente:
- ✅ Função `custom-email` está ativa e funcionando
- ✅ Variáveis SMTP estão configuradas
- ✅ Planos de assinatura existem
- ❌ **Supabase Auth não está usando emails personalizados**
- ❌ **Triggers de usuário não estão configurados**

## 🚀 SOLUÇÕES OBRIGATÓRIAS (Manual)

### 1. CONFIGURAR AUTH HOOKS NO CONSOLE SUPABASE

**📍 Passo a passo:**

1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/settings
2. Role até a seção **"Auth Hooks"**
3. Configure o **"Send Email Hook"**:
   - **URL**: `https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email`
   - **HTTP Method**: `POST`
   - **Events**: Marque `signup`
4. Clique **"Save"**

### 2. CONFIGURAR REDIRECT URLs

**Na mesma página de Auth Settings:**

1. Na seção **"Redirect URLs"**, adicione:
   ```
   https://app.conversaai.com.br/**
   http://localhost:5173/**
   https://app.conversaai.com.br/confirmar-email
   ```

### 3. EXECUTAR TRIGGERS SQL NO BANCO

**📍 Passo a passo:**

1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql
2. Clique **"New Query"**
3. Cole o código SQL abaixo:

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

-- Configurar políticas RLS
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
```

4. Clique **"RUN"** e verifique se não há erros

### 4. CONFIGURAR TEMPLATE DE EMAIL (Opcional)

**Para personalizar ainda mais o email:**

1. Na página Auth Settings
2. Seção **"Email Templates"**
3. Customize o template de **"Confirm signup"** se necessário

## 🧪 TESTE APÓS CONFIGURAÇÃO

Execute este script para testar:

```bash
node test-complete-signup.js
```

## ⚠️ VERIFICAÇÕES IMPORTANTES

1. **Email sendo enviado?** Verifique os logs da função em:
   https://app.supabase.com/project/hpovwcaskorzzrpphgkc/functions/custom-email

2. **Perfis sendo criados?** Verifique na tabela:
   https://app.supabase.com/project/hpovwcaskorzzrpphgkc/editor/profiles

3. **Assinaturas sendo criadas?** Verifique na tabela:
   https://app.supabase.com/project/hpovwcaskorzzrpphgkc/editor/subscriptions

## 🎯 RESULTADO ESPERADO

Após estas configurações:
- ✅ Usuário se cadastra
- ✅ Email de confirmação é enviado via nossa função custom
- ✅ Perfil é criado automaticamente via trigger
- ✅ Assinatura gratuita é criada automaticamente
- ✅ Usuário pode fazer login após confirmar email
