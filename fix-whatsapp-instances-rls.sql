-- Habilitar RLS na tabela whatsapp_instances, se ainda não estiver habilitado
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos (opcional, mas bom para um estado limpo)
DROP POLICY IF EXISTS "Users can view their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can insert their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can update their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can manage their own instances" ON public.whatsapp_instances;

-- Criar política para SELECT: Usuários podem visualizar suas próprias instâncias
CREATE POLICY "Users can view their own instances"
ON public.whatsapp_instances
FOR SELECT
USING (auth.uid() = user_id);

-- Criar política para INSERT: Usuários podem inserir suas próprias instâncias
CREATE POLICY "Users can insert their own instances"
ON public.whatsapp_instances
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Criar política para UPDATE: Usuários podem atualizar suas próprias instâncias
CREATE POLICY "Users can update their own instances"
ON public.whatsapp_instances
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar política para DELETE: Usuários podem deletar suas próprias instâncias
CREATE POLICY "Users can delete their own instances"
ON public.whatsapp_instances
FOR DELETE
USING (auth.uid() = user_id);

RAISE NOTICE 'RLS policies for whatsapp_instances applied successfully.';
