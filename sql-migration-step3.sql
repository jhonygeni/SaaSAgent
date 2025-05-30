-- =====================================================
-- PASSO 3: MIGRAR DADOS DO BACKUP
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
