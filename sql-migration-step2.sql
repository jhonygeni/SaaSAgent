-- =====================================================
-- PASSO 2: BACKUP E RECRIAR TABELA agents
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
