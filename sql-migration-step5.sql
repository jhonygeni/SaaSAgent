-- =====================================================
-- PASSO 5: VERIFICAÇÃO FINAL
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
