-- =====================================================
-- CORREÇÃO FINAL: Estrutura de Tabelas Supabase
-- Data: 30/05/2025
-- Objetivo: Separar responsabilidades e eliminar duplicações
-- =====================================================

-- ✅ PASSO 1: DEFINIR ESTRUTURA CLARA
-- whatsapp_instances = APENAS dados de conexão WhatsApp
-- agents = APENAS configurações de agentes IA + referência à instância

-- =====================================================
-- 1. LIMPAR E RECRIAR TABELA whatsapp_instances
-- =====================================================

-- Desabilitar RLS temporariamente para operações de limpeza
ALTER TABLE IF EXISTS public.whatsapp_instances DISABLE ROW LEVEL SECURITY;

-- Limpar dados existentes (se houver inconsistências)
-- TRUNCATE TABLE IF EXISTS public.whatsapp_instances CASCADE;

-- Garantir que a tabela tenha a estrutura correta
DROP TABLE IF EXISTS public.whatsapp_instances CASCADE;

CREATE TABLE public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados básicos da instância
  name TEXT NOT NULL UNIQUE, -- Nome único da instância
  phone_number TEXT, -- Número do WhatsApp conectado
  status TEXT DEFAULT 'pending', -- pending, connected, disconnected, error
  
  -- Dados da Evolution API
  evolution_instance_id TEXT, -- ID retornado pela Evolution API
  qr_code TEXT, -- QR Code base64 para conexão
  session_data JSONB, -- Dados da sessão completos
  
  -- Configurações de webhook
  webhook_url TEXT,
  webhook_events TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_connected_at TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX idx_whatsapp_instances_user_id ON public.whatsapp_instances(user_id);
CREATE INDEX idx_whatsapp_instances_name ON public.whatsapp_instances(name);
CREATE INDEX idx_whatsapp_instances_status ON public.whatsapp_instances(status);
CREATE UNIQUE INDEX idx_whatsapp_instances_name_unique ON public.whatsapp_instances(name);

-- =====================================================
-- 2. LIMPAR E RECRIAR TABELA agents
-- =====================================================

-- Backup dos dados existentes antes de limpar
CREATE TABLE IF NOT EXISTS agents_backup AS SELECT * FROM public.agents;

-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS public.agents DISABLE ROW LEVEL SECURITY;

-- Recriar tabela agents APENAS para agentes IA
DROP TABLE IF EXISTS public.agents CASCADE;

CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Referência à instância WhatsApp
  whatsapp_instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  
  -- Dados do agente IA
  name TEXT NOT NULL, -- Nome amigável do agente
  description TEXT, -- Descrição do agente
  prompt TEXT, -- Prompt do agente IA
  
  -- Configurações do agente
  settings JSONB DEFAULT '{}', -- Configurações específicas do agente
  is_active BOOLEAN DEFAULT true,
  
  -- Limites e controles
  daily_message_limit INTEGER DEFAULT 50,
  messages_sent_today INTEGER DEFAULT 0,
  last_message_reset DATE DEFAULT CURRENT_DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_agents_user_id ON public.agents(user_id);
CREATE INDEX idx_agents_whatsapp_instance_id ON public.agents(whatsapp_instance_id);
CREATE INDEX idx_agents_is_active ON public.agents(is_active);

-- =====================================================
-- 3. MIGRAR DADOS EXISTENTES DO BACKUP
-- =====================================================

-- Migrar instâncias WhatsApp dos agents antigos para whatsapp_instances
INSERT INTO public.whatsapp_instances (
  user_id,
  name,
  evolution_instance_id,
  status,
  created_at,
  updated_at
)
SELECT DISTINCT
  user_id,
  COALESCE(instance_name, 'migrated_' || id::text) as name,
  instance_id as evolution_instance_id,
  COALESCE(status, 'pending') as status,
  created_at,
  updated_at
FROM agents_backup 
WHERE instance_name IS NOT NULL
ON CONFLICT (name) DO NOTHING; -- Evitar duplicatas

-- Migrar agentes IA para a nova estrutura
INSERT INTO public.agents (
  user_id,
  whatsapp_instance_id,
  name,
  description,
  prompt,
  settings,
  is_active,
  created_at,
  updated_at
)
SELECT 
  ab.user_id,
  wi.id as whatsapp_instance_id, -- Relacionar com a instância migrada
  COALESCE(ab.instance_name, 'Agente Migrado') as name,
  'Agente migrado automaticamente' as description,
  '' as prompt, -- Será configurado pelo usuário
  ab.settings,
  true as is_active,
  ab.created_at,
  ab.updated_at
FROM agents_backup ab
LEFT JOIN public.whatsapp_instances wi ON wi.name = ab.instance_name AND wi.user_id = ab.user_id
WHERE ab.instance_name IS NOT NULL;

-- =====================================================
-- 4. HABILITAR RLS E POLÍTICAS DE SEGURANÇA
-- =====================================================

-- RLS para whatsapp_instances
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own instances" ON public.whatsapp_instances;
CREATE POLICY "Users can manage their own instances" ON public.whatsapp_instances
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS para agents
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own agents" ON public.agents;
CREATE POLICY "Users can manage their own agents" ON public.agents
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 5. TRIGGERS DE ATUALIZAÇÃO
-- =====================================================

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_whatsapp_instances_updated_at ON public.whatsapp_instances;
CREATE TRIGGER update_whatsapp_instances_updated_at
    BEFORE UPDATE ON public.whatsapp_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. LIMPEZA FINAL
-- =====================================================

-- Remover tabela de backup após confirmação de sucesso
-- DROP TABLE IF EXISTS agents_backup; -- Descomente após verificar que tudo funcionou

-- =====================================================
-- 7. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar estrutura das tabelas
SELECT 
  'whatsapp_instances' as tabela,
  COUNT(*) as registros
FROM public.whatsapp_instances
UNION ALL
SELECT 
  'agents' as tabela,
  COUNT(*) as registros  
FROM public.agents;

-- =====================================================
-- SUCESSO! ESTRUTURA LIMPA E ORGANIZADA
-- =====================================================

-- ✅ whatsapp_instances: APENAS dados de conexão WhatsApp
-- ✅ agents: APENAS configurações de agentes IA + referência à instância
-- ✅ Relacionamento: agents.whatsapp_instance_id → whatsapp_instances.id
-- ✅ RLS habilitado em ambas as tabelas
-- ✅ Dados migrados automaticamente
-- ✅ Triggers de atualização configurados
