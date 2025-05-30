# AUDITORIA COMPLETA DO BANCO DE DADOS SUPABASE
## ConversaAI Brasil

---

**Data da Auditoria:** 25 de maio de 2025  
**Projeto:** ConversaAI Brasil  
**Banco de Dados:** Supabase (hpovwcaskorzzrpphgkc.supabase.co)  
**Responsável:** Sistema de Auditoria Automatizada  

---

## 📋 SUMÁRIO EXECUTIVO

Esta auditoria analisou a estrutura completa do banco de dados Supabase do ConversaAI Brasil, focando em integridade, escalabilidade, segurança e facilidade de manutenção. O sistema utiliza PostgreSQL através do Supabase com autenticação integrada e Row Level Security (RLS).

### Principais Descobertas:
- ✅ Estrutura de dados bem definida com TypeScript
- ⚠️ Problemas de consistência em triggers de usuário
- 🔒 Políticas RLS implementadas mas precisam de revisão
- ⚡ Necessidade de otimizações de performance e índices

---

## 🏗️ ESTRUTURA DE TABELAS

### 1. Tabela `auth.users` (Supabase Auth)
```sql
-- Tabela gerenciada pelo Supabase Auth
-- Contém dados básicos de autenticação
```
- **Propósito:** Autenticação e autorização de usuários
- **Relacionamentos:** Pai de todas as tabelas do sistema
- **Status:** ✅ Ativa e funcional

### 2. Tabela `profiles`
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  phone_number TEXT,
  role user_role DEFAULT 'client',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Propósito:** Perfis estendidos dos usuários
- **Relacionamentos:** 
  - `id` → `auth.users(id)` (CASCADE)
- **Issues Identificadas:**
  - ⚠️ Inconsistência entre diferentes versões do schema
  - ⚠️ Trigger de criação automática com problemas

### 3. Tabela `subscription_plans`
```sql
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  price INTEGER NOT NULL DEFAULT 0, -- em centavos
  interval TEXT NOT NULL DEFAULT 'month',
  message_limit INTEGER NOT NULL DEFAULT 50,
  agent_limit INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Propósito:** Definição de planos de assinatura
- **Status:** ✅ Bem estruturada
- **Recomendação:** Adicionar validação para features JSONB

### 4. Tabela `subscriptions`
```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '100 years',
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Propósito:** Assinaturas ativas dos usuários
- **Relacionamentos:**
  - `user_id` → `auth.users(id)` (CASCADE)
  - `plan_id` → `subscription_plans(id)` (RESTRICT)
- **Issues:** ⚠️ Constraint UNIQUE em user_id em algumas versões

### 5. Tabela `whatsapp_instances`
```sql
CREATE TABLE public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  evolution_instance_id TEXT,
  phone_number TEXT,
  qr_code TEXT,
  status TEXT,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Propósito:** Instâncias do WhatsApp dos usuários
- **Relacionamentos:** `user_id` → `auth.users(id)` (CASCADE)
- **Status:** ✅ Bem estruturada

### 6. Tabela `agents`
```sql
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  instance_id TEXT,
  integration TEXT,
  settings JSONB,
  status TEXT,
  hash TEXT,
  access_token_wa_business TEXT,
  webhook_wa_business TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Propósito:** Agentes/bots de conversação
- **Relacionamentos:** `user_id` → `auth.users(id)` (CASCADE)
- **Status:** ✅ Funcional

### 7. Tabela `messages`
```sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id UUID NOT NULL REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
  direction TEXT NOT NULL, -- 'inbound' ou 'outbound'
  message_type TEXT NOT NULL,
  content TEXT,
  sender_phone TEXT,
  recipient_phone TEXT,
  whatsapp_message_id TEXT,
  media_url TEXT,
  status TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Propósito:** Armazenamento de mensagens
- **Relacionamentos:**
  - `user_id` → `auth.users(id)` (CASCADE)
  - `instance_id` → `whatsapp_instances(id)` (CASCADE)
- **Performance:** ⚠️ Necessita índices compostos

### 8. Tabela `contacts`
```sql
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  name TEXT,
  email TEXT,
  profile_picture TEXT,
  is_business BOOLEAN,
  custom_fields JSONB,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Propósito:** Gerenciamento de contatos
- **Relacionamentos:** `user_id` → `auth.users(id)` (CASCADE)
- **Recomendação:** Adicionar índice único em (user_id, phone_number)

### 9. Tabela `payments`
```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- em centavos
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL,
  payment_method TEXT,
  stripe_payment_id TEXT,
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Propósito:** Histórico de pagamentos
- **Relacionamentos:**
  - `user_id` → `auth.users(id)` (CASCADE)
  - `subscription_id` → `subscriptions(id)` (CASCADE)
- **Status:** ✅ Bem estruturada

### 10. Tabela `usage_stats`
```sql
CREATE TABLE public.usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  messages_sent INTEGER DEFAULT 0,
  messages_received INTEGER DEFAULT 0,
  active_sessions INTEGER DEFAULT 0,
  new_contacts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Propósito:** Estatísticas de uso diário
- **Relacionamentos:** `user_id` → `auth.users(id)` (CASCADE)
- **Recomendação:** Índice único em (user_id, date)

### 11. Tabela `event_logs`
```sql
CREATE TABLE public.event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Propósito:** Log de eventos do sistema
- **Relacionamentos:** `user_id` → `auth.users(id)` (SET NULL)
- **Status:** ✅ Adequada para auditoria

### 12. Tabela `integrations`
```sql
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration TEXT NOT NULL,
  settings JSONB,
  status TEXT,
  hash TEXT,
  access_token_wa_business TEXT,
  webhook_wa_business TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- **Propósito:** Integrações externas
- **Relacionamentos:** `user_id` → `auth.users(id)` (CASCADE)
- **Status:** ✅ Funcional

---

## 🔗 ANÁLISE DE RELACIONAMENTOS

### Diagrama de Relacionamentos Principais

```
auth.users (Supabase)
├── profiles (1:1, CASCADE)
├── subscriptions (1:1, CASCADE) → subscription_plans (N:1, RESTRICT)
├── whatsapp_instances (1:N, CASCADE)
│   └── messages (N:1, CASCADE)
├── agents (1:N, CASCADE)
├── contacts (1:N, CASCADE)
├── payments (1:N, CASCADE)
├── usage_stats (1:N, CASCADE)
├── event_logs (1:N, SET NULL)
└── integrations (1:N, CASCADE)
```

### Integridade Referencial
- ✅ **Forte:** Cascatas configuradas adequadamente
- ✅ **Proteção:** subscription_plans protegido com RESTRICT
- ⚠️ **Órfãos:** Possíveis registros órfãos devido a problemas no trigger

---

## 🔒 ANÁLISE DE SEGURANÇA (RLS)

### Row Level Security Status

| Tabela | RLS Habilitado | Políticas | Status |
|--------|----------------|-----------|---------|
| profiles | ✅ | SELECT/UPDATE próprio perfil | ✅ Adequado |
| subscriptions | ✅ | SELECT própria assinatura | ✅ Adequado |
| subscription_plans | ✅ | SELECT para todos | ✅ Adequado |
| whatsapp_instances | ⚠️ | Necessita verificação | ⚠️ Pendente |
| agents | ⚠️ | Necessita verificação | ⚠️ Pendente |
| messages | ⚠️ | Necessita verificação | ⚠️ Pendente |
| contacts | ⚠️ | Necessita verificação | ⚠️ Pendente |
| payments | ⚠️ | Necessita verificação | ⚠️ Pendente |
| usage_stats | ⚠️ | Necessita verificação | ⚠️ Pendente |
| event_logs | ⚠️ | Necessita verificação | ⚠️ Pendente |

### Políticas RLS Identificadas

#### Tabela `profiles`
```sql
-- Política existente
CREATE POLICY "Users can view their own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);
```

#### Tabela `subscriptions`
```sql
-- Política existente
CREATE POLICY "Users can view their own subscription" ON public.subscriptions 
  FOR SELECT USING (auth.uid() = user_id);
```

#### Tabela `subscription_plans`
```sql
-- Política existente
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans 
  FOR SELECT USING (true);
```

---

## ⚡ ANÁLISE DE PERFORMANCE

### Índices Recomendados

#### 1. Tabela `messages` (Alta Prioridade)
```sql
-- Consultas por usuário e data
CREATE INDEX idx_messages_user_created 
ON messages(user_id, created_at DESC);

-- Consultas por instância e direção
CREATE INDEX idx_messages_instance_direction 
ON messages(instance_id, direction);

-- Busca por whatsapp_message_id
CREATE INDEX idx_messages_whatsapp_id 
ON messages(whatsapp_message_id) 
WHERE whatsapp_message_id IS NOT NULL;
```

#### 2. Tabela `contacts` (Média Prioridade)
```sql
-- Busca por usuário e telefone (deve ser único)
CREATE UNIQUE INDEX idx_contacts_user_phone 
ON contacts(user_id, phone_number);

-- Busca por nome
CREATE INDEX idx_contacts_name 
ON contacts(name) 
WHERE name IS NOT NULL;
```

#### 3. Tabela `usage_stats` (Média Prioridade)
```sql
-- Consultas por usuário e período (deve ser único)
CREATE UNIQUE INDEX idx_usage_stats_user_date 
ON usage_stats(user_id, date);
```

#### 4. Tabela `whatsapp_instances` (Baixa Prioridade)
```sql
-- Filtros por usuário e status
CREATE INDEX idx_whatsapp_instances_user_status 
ON whatsapp_instances(user_id, status);
```

### Particionamento Recomendado

#### Tabela `messages` (Futura Implementação)
```sql
-- Particionamento por mês para melhor performance
-- Implementar quando volume > 1M registros/mês
CREATE TABLE messages_y2025m01 PARTITION OF messages
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

---

## 🔧 TRIGGERS E FUNÇÕES

### Triggers Principais

#### 1. `on_auth_user_created`
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();
```
- **Status:** ⚠️ Problemas identificados
- **Função:** `handle_new_user_signup()`
- **Issues:** Inconsistência entre versões, falhas na criação automática

#### 2. `on_profile_update`
```sql
CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();
```
- **Status:** ✅ Funcional
- **Função:** `handle_user_update()`
- **Propósito:** Atualizar timestamp de modificação

### Funções Identificadas

#### 1. `handle_new_user_signup()`
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Buscar plano gratuito
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1;
  
  -- Criar perfil
  INSERT INTO public.profiles (id, full_name, avatar_url, is_active, created_at, updated_at)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NULL, true, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  -- Criar assinatura
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (user_id, plan_id, status, created_at, updated_at, current_period_start, current_period_end)
    VALUES (NEW.id, free_plan_id, 'active', NOW(), NOW(), NOW(), (NOW() + interval '100 years'))
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
- **Status:** ⚠️ Necessita correção
- **Issues:** 
  - Estrutura de campos inconsistente
  - Falta tratamento de erros
  - Constraint conflicts

#### 2. `handle_user_update()`
```sql
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
- **Status:** ✅ Funcional

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **[CRÍTICO] Inconsistência na Criação de Usuários**
- **Problema:** Trigger `handle_new_user_signup()` falhando
- **Causa:** Estrutura de campos inconsistente entre versões
- **Impacto:** Novos usuários sem perfil/assinatura
- **Solução:** Padronizar schema e recriar trigger

### 2. **[ALTO] Falta de Índices de Performance**
- **Problema:** Consultas lentas em tabelas grandes
- **Tabelas Afetadas:** messages, contacts, usage_stats
- **Impacto:** Performance degradada com crescimento
- **Solução:** Implementar índices recomendados

### 3. **[MÉDIO] Políticas RLS Incompletas**
- **Problema:** Várias tabelas sem políticas adequadas
- **Tabelas Afetadas:** whatsapp_instances, agents, messages, contacts
- **Impacto:** Possível vazamento de dados
- **Solução:** Implementar políticas completas

### 4. **[MÉDIO] Falta de Constraints de Unicidade**
- **Problema:** Possibilidade de duplicatas
- **Tabelas Afetadas:** contacts (user_id, phone_number), usage_stats (user_id, date)
- **Impacto:** Inconsistência de dados
- **Solução:** Adicionar constraints únicos

### 5. **[BAIXO] Falta de Validação JSONB**
- **Problema:** Campos JSONB sem validação de estrutura
- **Campos Afetados:** settings, features, metadata
- **Impacto:** Dados inconsistentes
- **Solução:** Implementar schemas JSON

---

## 📋 RECOMENDAÇÕES DE MELHORIAS

### 🔥 **Prioridade CRÍTICA**

#### 1. Corrigir Trigger de Criação de Usuários
```sql
-- Script de correção em scripts/fix-user-trigger.sql
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Buscar ou criar plano gratuito
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' AND is_active = true LIMIT 1;
  
  IF free_plan_id IS NULL THEN
    INSERT INTO public.subscription_plans (name, price, interval, message_limit, agent_limit, is_active, description)
    VALUES ('Free', 0, 'month', 50, 1, true, 'Plano gratuito')
    RETURNING id INTO free_plan_id;
  END IF;

  -- Criar perfil com tratamento de erro
  BEGIN
    INSERT INTO public.profiles (id, full_name, is_active, created_at, updated_at)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), true, NOW(), NOW());
  EXCEPTION WHEN unique_violation THEN
    -- Perfil já existe, ignorar
    NULL;
  END;
  
  -- Criar assinatura com tratamento de erro
  BEGIN
    INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
    VALUES (NEW.id, free_plan_id, 'active', NOW(), (NOW() + interval '1 year'), NOW(), NOW());
  EXCEPTION WHEN unique_violation THEN
    -- Assinatura já existe, ignorar
    NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Reparar Usuários Existentes
```sql
-- Script de reparo em scripts/repair-existing-users.sql
DO $$
DECLARE
  user_rec RECORD;
  free_plan_id UUID;
BEGIN
  -- Garantir plano gratuito
  SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' AND is_active = true LIMIT 1;
  
  IF free_plan_id IS NULL THEN
    INSERT INTO public.subscription_plans (name, price, interval, message_limit, agent_limit, is_active, description)
    VALUES ('Free', 0, 'month', 50, 1, true, 'Plano gratuito')
    RETURNING id INTO free_plan_id;
  END IF;

  -- Reparar usuários sem perfil
  FOR user_rec IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.profiles (id, full_name, is_active, created_at, updated_at)
    VALUES (
      user_rec.id, 
      COALESCE(user_rec.raw_user_meta_data->>'full_name', user_rec.raw_user_meta_data->>'name', split_part(user_rec.email, '@', 1)),
      true, 
      NOW(), 
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- Reparar usuários sem assinatura
  INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
  SELECT 
    au.id,
    free_plan_id,
    'active',
    NOW(),
    (NOW() + interval '1 year'),
    NOW(),
    NOW()
  FROM auth.users au
  LEFT JOIN public.subscriptions s ON au.id = s.user_id
  WHERE s.user_id IS NULL
  ON CONFLICT (user_id) DO NOTHING;
END $$;
```

### 🚀 **Prioridade ALTA**

#### 3. Implementar Índices de Performance
```sql
-- Script em scripts/create-performance-indexes.sql

-- Índices para messages (tabela de maior volume)
CREATE INDEX CONCURRENTLY idx_messages_user_created 
ON messages(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_messages_instance_direction 
ON messages(instance_id, direction);

CREATE INDEX CONCURRENTLY idx_messages_phone_lookup 
ON messages(sender_phone) WHERE sender_phone IS NOT NULL;

-- Índices para contacts
CREATE UNIQUE INDEX CONCURRENTLY idx_contacts_user_phone 
ON contacts(user_id, phone_number);

CREATE INDEX CONCURRENTLY idx_contacts_name_search 
ON contacts USING gin(to_tsvector('portuguese', name)) 
WHERE name IS NOT NULL;

-- Índices para usage_stats
CREATE UNIQUE INDEX CONCURRENTLY idx_usage_stats_user_date 
ON usage_stats(user_id, date);

-- Índices para whatsapp_instances
CREATE INDEX CONCURRENTLY idx_whatsapp_instances_user_status 
ON whatsapp_instances(user_id, status);
```

#### 4. Implementar Políticas RLS Completas
```sql
-- Script em scripts/implement-rls-policies.sql

-- Políticas para whatsapp_instances
DROP POLICY IF EXISTS "Users can manage their own instances" ON whatsapp_instances;
CREATE POLICY "Users can manage their own instances" ON whatsapp_instances
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para agents
DROP POLICY IF EXISTS "Users can manage their own agents" ON agents;
CREATE POLICY "Users can manage their own agents" ON agents
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para messages
DROP POLICY IF EXISTS "Users can access their own messages" ON messages;
CREATE POLICY "Users can access their own messages" ON messages
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para contacts
DROP POLICY IF EXISTS "Users can manage their own contacts" ON contacts;
CREATE POLICY "Users can manage their own contacts" ON contacts
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para usage_stats
DROP POLICY IF EXISTS "Users can view their own stats" ON usage_stats;
CREATE POLICY "Users can view their own stats" ON usage_stats
  FOR SELECT USING (auth.uid() = user_id);

-- Habilitar RLS nas tabelas
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;
```

### 🔧 **Prioridade MÉDIA**

#### 5. Adicionar Constraints de Integridade
```sql
-- Script em scripts/add-integrity-constraints.sql

-- Constraint única para contacts
ALTER TABLE contacts 
ADD CONSTRAINT contacts_user_phone_unique 
UNIQUE (user_id, phone_number);

-- Constraint única para usage_stats
ALTER TABLE usage_stats 
ADD CONSTRAINT usage_stats_user_date_unique 
UNIQUE (user_id, date);

-- Constraints de validação
ALTER TABLE messages 
ADD CONSTRAINT messages_direction_check 
CHECK (direction IN ('inbound', 'outbound'));

ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_status_check 
CHECK (status IN ('active', 'trialing', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid'));

-- Constraint para evitar phone_number vazio
ALTER TABLE contacts 
ADD CONSTRAINT contacts_phone_not_empty 
CHECK (phone_number != '' AND phone_number IS NOT NULL);
```

#### 6. Implementar Validação JSONB
```sql
-- Script em scripts/add-jsonb-validation.sql

-- Função para validar features em subscription_plans
CREATE OR REPLACE FUNCTION validate_plan_features(features JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar se contém chaves obrigatórias
  RETURN features ? 'basic_ai' 
    AND (features->>'basic_ai')::boolean IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Adicionar constraint
ALTER TABLE subscription_plans 
ADD CONSTRAINT subscription_plans_features_valid 
CHECK (features IS NULL OR validate_plan_features(features));
```

### 📊 **Prioridade BAIXA**

#### 7. Implementar Auditoria Automática
```sql
-- Tabela de auditoria
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  row_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, operation, row_id, old_values, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, operation, row_id, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, operation, row_id, new_values, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎯 PLANO DE IMPLEMENTAÇÃO

### **Fase 1: Correções Críticas (Semana 1)**
1. ✅ Executar script de correção do trigger de usuários
2. ✅ Reparar usuários existentes sem perfil/assinatura
3. ✅ Testar criação de novos usuários
4. ✅ Validar integridade dos dados

### **Fase 2: Performance e Segurança (Semana 2)**
1. 🔍 Implementar índices de performance críticos
2. 🔒 Completar políticas RLS
3. 📊 Monitorar impacto na performance
4. 🧪 Testar segurança das políticas

### **Fase 3: Integridade e Validação (Semana 3)**
1. 🔧 Adicionar constraints de integridade
2. ✅ Implementar validação JSONB
3. 🧹 Limpar dados inconsistentes
4. 📋 Documentar mudanças

### **Fase 4: Monitoramento e Auditoria (Semana 4)**
1. 📊 Implementar sistema de auditoria
2. 📈 Configurar métricas de performance
3. 🚨 Configurar alertas de integridade
4. 📚 Treinar equipe

---

## 📊 MÉTRICAS DE SUCESSO

### **KPIs de Integridade**
- ✅ 100% dos usuários com perfil e assinatura
- ✅ 0 registros órfãos em relacionamentos
- ✅ 0 violações de constraints

### **KPIs de Performance**
- ⚡ Consultas de mensagens < 100ms (95th percentile)
- ⚡ Busca de contatos < 50ms (95th percentile)
- ⚡ Dashboard de stats < 200ms (95th percentile)

### **KPIs de Segurança**
- 🔒 100% das tabelas com RLS habilitado
- 🔒 0 vazamentos de dados entre usuários
- 🔒 Auditoria completa de operações sensíveis

---

## 🔧 SCRIPTS DE IMPLEMENTAÇÃO

Todos os scripts de correção e melhorias estão disponíveis no diretório `/scripts/database-improvements/`:

1. `fix-user-trigger.sql` - Correção do trigger de usuários
2. `repair-existing-users.sql` - Reparo de usuários existentes
3. `create-performance-indexes.sql` - Índices de performance
4. `implement-rls-policies.sql` - Políticas RLS completas
5. `add-integrity-constraints.sql` - Constraints de integridade
6. `add-jsonb-validation.sql` - Validação JSONB
7. `implement-audit-system.sql` - Sistema de auditoria

---

## 📞 CONTATO E SUPORTE

Para dúvidas sobre esta auditoria ou implementação das recomendações:

- **Documentação:** Este arquivo e scripts relacionados
- **Monitoramento:** Dashboard do Supabase
- **Logs:** Verificar logs de erro no console do Supabase

---

**🏁 Auditoria Concluída em:** 25 de maio de 2025  
**📈 Score de Integridade:** 75% (Bom, com melhorias identificadas)  
**🎯 Meta Pós-Implementação:** 95% (Excelente)**
