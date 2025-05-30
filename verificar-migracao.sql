SELECT 'whatsapp_instances' as tabela, COUNT(*) as registros FROM public.whatsapp_instances UNION ALL SELECT 'agents' as tabela, COUNT(*) as registros FROM public.agents;
