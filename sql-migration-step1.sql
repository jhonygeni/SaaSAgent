-- =====================================================
-- PASSO 1: RECRIAR TABELA whatsapp_instances
-- =====================================================

-- Desabilitar RLS temporariamente para operações de limpeza
ALTER TABLE IF EXISTS public.whatsapp_instances DISABLE ROW LEVEL SECURITY;

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
