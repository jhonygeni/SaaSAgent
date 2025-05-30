-- =====================================================
-- CORREÇÃO ESTRUTURAL CRÍTICA: INSTÂNCIAS WHATSAPP
-- Data: 30/05/2025
-- Objetivo: Separar responsabilidades entre tabelas
-- =====================================================

-- ETAPA 1: BACKUP DOS DADOS EXISTENTES
-- =====================================================
CREATE TABLE IF NOT EXISTS agents_backup AS SELECT * FROM public.agents;

-- ETAPA 2: RECRIAR whatsapp_instances
-- =====================================================
-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS public.whatsapp_instances DISABLE ROW LEVEL SECURITY;

-- Limpar e recriar tabela
DROP TABLE IF EXISTS public.whatsapp_instances CASCADE;

CREATE TABLE public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados básicos da instância
  name TEXT NOT NULL,
  phone_number TEXT,
  status TEXT DEFAULT 'pending',
  
  -- Dados da Evolution API
  evolution_instance_id TEXT,
  qr_code TEXT,
  session_data JSONB,
  
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

-- ETAPA 3: RECRIAR agents
-- =====================================================
-- Desabilitar RLS temporariamente
ALTER TABLE IF EXISTS public.agents DISABLE ROW LEVEL SECURITY;

-- Recriar tabela agents
DROP TABLE IF EXISTS public.agents CASCADE;

CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Referência à instância WhatsApp
  whatsapp_instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  
  -- Dados do agente IA
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT,
  
  -- Configurações do agente
  settings JSONB DEFAULT '{}',
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

-- ETAPA 4: MIGRAR DADOS EXISTENTES (se houver)
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
  AND NOT EXISTS (
    SELECT 1 FROM public.whatsapp_instances 
    WHERE name = COALESCE(agents_backup.instance_name, 'migrated_' || agents_backup.id::text)
  );

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
  wi.id as whatsapp_instance_id,
  COALESCE(ab.instance_name, 'Agente Migrado') as name,
  'Agente migrado automaticamente' as description,
  COALESCE(ab.settings->>'prompt', '') as prompt,  -- Extrair prompt do JSONB settings
  COALESCE(ab.settings, '{}') as settings,
  CASE WHEN ab.status = 'ativo' THEN true ELSE false END as is_active,
  ab.created_at,
  ab.updated_at
FROM agents_backup ab
LEFT JOIN public.whatsapp_instances wi ON wi.name = COALESCE(ab.instance_name, 'migrated_' || ab.id::text) AND wi.user_id = ab.user_id
WHERE ab.instance_name IS NOT NULL;

-- ETAPA 5: HABILITAR RLS E POLÍTICAS
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

-- ETAPA 6: TRIGGERS DE ATUALIZAÇÃO
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

-- ETAPA 7: VERIFICAÇÃO FINAL
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
FROM public.agents
UNION ALL
SELECT 
  'agents_backup' as tabela,
  COUNT(*) as registros  
FROM agents_backup;

-- =====================================================
-- ✅ ESTRUTURA CORRIGIDA COM SUCESSO!
-- =====================================================
-- 
-- whatsapp_instances: APENAS dados de conexão WhatsApp
-- agents: APENAS configurações de agentes IA + referência à instância
-- Relacionamento: agents.whatsapp_instance_id → whatsapp_instances.id
-- RLS habilitado em ambas as tabelas
-- Dados migrados automaticamente (se existiam)
-- Triggers de atualização configurados
-- Backup preservado na tabela agents_backup
--
-- PRÓXIMOS PASSOS:
-- 1. Atualizar código para usar nova estrutura
-- 2. Testar conexão de nova instância WhatsApp  
-- 3. Validar que dados são salvos corretamente
-- =====================================================
