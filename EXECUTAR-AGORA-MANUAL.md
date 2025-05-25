# 🔥 EXECUTAR AGORA - ConversaAI Brasil

## ✅ STATUS ATUAL CONFIRMADO

- ✅ **Função de email**: FUNCIONANDO
- ✅ **Planos de assinatura**: 3 planos criados
- ✅ **Estrutura do banco**: Pronta
- ❌ **Auth Hooks**: NÃO CONFIGURADO (emails não são enviados)
- ❌ **Triggers SQL**: NÃO EXECUTADOS (perfis não são criados)

---

## 🚀 AÇÕES OBRIGATÓRIAS (2 minutos)

### 1️⃣ CONFIGURAR AUTH HOOKS

**📍 Acesse:** https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/settings

**📧 Na seção "Auth Hooks":**
- **Send Email Hook URL**: `https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email`
- **HTTP Method**: `POST`
- **Events**: ✅ Marque `signup`
- Clique **"Save"**

**🔄 Na seção "Redirect URLs", adicione:**
```
https://app.conversaai.com.br/**
http://localhost:5173/**
https://app.conversaai.com.br/confirmar-email
```

### 2️⃣ EXECUTAR SQL TRIGGERS

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

---

## 🧪 TESTE APÓS CONFIGURAÇÃO

Execute no terminal:
```bash
cd /Users/jhonymonhol/Desktop/conversa-ai-brasil
npm run dev
```

**Teste o cadastro:**
1. Acesse `http://localhost:5173`
2. Cadastre um usuário real
3. Verifique se recebeu email de confirmação

**Verificar no banco:**
1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/editor
2. Verifique tabela `profiles` (deve ter novo usuário)
3. Verifique tabela `subscriptions` (deve ter assinatura Free)

---

## 🎯 RESULTADO ESPERADO

Após as configurações:
- ✅ Usuário se cadastra
- ✅ Email de confirmação é enviado (template personalizado)
- ✅ Perfil é criado automaticamente
- ✅ Assinatura gratuita é criada automaticamente
- ✅ Login funciona após confirmar email

**🔥 Execute essas 2 configurações manuais e tudo funcionará!**
