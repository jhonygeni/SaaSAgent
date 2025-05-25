-- Script de Implementação de Índices de Performance
-- ConversaAI Brasil - Banco de Dados Supabase
-- Execute após correções críticas

-- =====================================================
-- CRIAÇÃO DE ÍNDICES DE PERFORMANCE
-- =====================================================

-- Usar CONCURRENTLY para não bloquear operações durante criação
-- IMPORTANTE: CONCURRENTLY só funciona fora de transações

BEGIN;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚡ ===== CRIANDO ÍNDICES DE PERFORMANCE =====';
  RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- 1. ÍNDICES PARA TABELA MESSAGES (ALTA PRIORIDADE)
-- =====================================================

-- Índice para consultas por usuário e data (mais comum)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_messages_user_created'
  ) THEN
    RAISE NOTICE '📧 Criando índice messages por usuário e data...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_messages_user_created ON messages(user_id, created_at DESC)';
    RAISE NOTICE '✅ Índice idx_messages_user_created criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_messages_user_created já existe';
  END IF;
END $$;

-- Índice para consultas por instância e direção
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_messages_instance_direction'
  ) THEN
    RAISE NOTICE '📧 Criando índice messages por instância e direção...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_messages_instance_direction ON messages(instance_id, direction)';
    RAISE NOTICE '✅ Índice idx_messages_instance_direction criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_messages_instance_direction já existe';
  END IF;
END $$;

-- Índice para busca por telefone do remetente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_messages_sender_phone'
  ) THEN
    RAISE NOTICE '📧 Criando índice messages por telefone do remetente...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_messages_sender_phone ON messages(sender_phone) WHERE sender_phone IS NOT NULL';
    RAISE NOTICE '✅ Índice idx_messages_sender_phone criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_messages_sender_phone já existe';
  END IF;
END $$;

-- Índice para busca por whatsapp_message_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_messages_whatsapp_id'
  ) THEN
    RAISE NOTICE '📧 Criando índice messages por WhatsApp ID...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_messages_whatsapp_id ON messages(whatsapp_message_id) WHERE whatsapp_message_id IS NOT NULL';
    RAISE NOTICE '✅ Índice idx_messages_whatsapp_id criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_messages_whatsapp_id já existe';
  END IF;
END $$;

-- =====================================================
-- 2. ÍNDICES PARA TABELA CONTACTS (MÉDIA PRIORIDADE)
-- =====================================================

-- Índice único para usuário e telefone (evita duplicatas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_contacts_user_phone_unique'
  ) THEN
    RAISE NOTICE '👥 Criando índice único contacts por usuário e telefone...';
    EXECUTE 'CREATE UNIQUE INDEX CONCURRENTLY idx_contacts_user_phone_unique ON contacts(user_id, phone_number)';
    RAISE NOTICE '✅ Índice idx_contacts_user_phone_unique criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_contacts_user_phone_unique já existe';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE WARNING '⚠️ Erro ao criar índice único contacts: %. Pode haver duplicatas.', SQLERRM;
END $$;

-- Índice para busca por nome (texto completo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_contacts_name_search'
  ) THEN
    RAISE NOTICE '👥 Criando índice contacts para busca por nome...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_contacts_name_search ON contacts USING gin(to_tsvector(''portuguese'', name)) WHERE name IS NOT NULL';
    RAISE NOTICE '✅ Índice idx_contacts_name_search criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_contacts_name_search já existe';
  END IF;
END $$;

-- Índice para tags
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_contacts_tags'
  ) THEN
    RAISE NOTICE '👥 Criando índice contacts por tags...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_contacts_tags ON contacts USING gin(tags) WHERE tags IS NOT NULL';
    RAISE NOTICE '✅ Índice idx_contacts_tags criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_contacts_tags já existe';
  END IF;
END $$;

-- =====================================================
-- 3. ÍNDICES PARA TABELA USAGE_STATS (MÉDIA PRIORIDADE)
-- =====================================================

-- Índice único para usuário e data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_usage_stats_user_date_unique'
  ) THEN
    RAISE NOTICE '📊 Criando índice único usage_stats por usuário e data...';
    EXECUTE 'CREATE UNIQUE INDEX CONCURRENTLY idx_usage_stats_user_date_unique ON usage_stats(user_id, date)';
    RAISE NOTICE '✅ Índice idx_usage_stats_user_date_unique criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_usage_stats_user_date_unique já existe';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE WARNING '⚠️ Erro ao criar índice único usage_stats: %. Pode haver duplicatas.', SQLERRM;
END $$;

-- =====================================================
-- 4. ÍNDICES PARA TABELA WHATSAPP_INSTANCES (BAIXA PRIORIDADE)
-- =====================================================

-- Índice para usuário e status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_whatsapp_instances_user_status'
  ) THEN
    RAISE NOTICE '📱 Criando índice whatsapp_instances por usuário e status...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_whatsapp_instances_user_status ON whatsapp_instances(user_id, status)';
    RAISE NOTICE '✅ Índice idx_whatsapp_instances_user_status criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_whatsapp_instances_user_status já existe';
  END IF;
END $$;

-- Índice para evolution_instance_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_whatsapp_instances_evolution_id'
  ) THEN
    RAISE NOTICE '📱 Criando índice whatsapp_instances por Evolution ID...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_whatsapp_instances_evolution_id ON whatsapp_instances(evolution_instance_id) WHERE evolution_instance_id IS NOT NULL';
    RAISE NOTICE '✅ Índice idx_whatsapp_instances_evolution_id criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_whatsapp_instances_evolution_id já existe';
  END IF;
END $$;

-- =====================================================
-- 5. ÍNDICES PARA TABELA AGENTS (BAIXA PRIORIDADE)
-- =====================================================

-- Índice para usuário e status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_agents_user_status'
  ) THEN
    RAISE NOTICE '🤖 Criando índice agents por usuário e status...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_agents_user_status ON agents(user_id, status)';
    RAISE NOTICE '✅ Índice idx_agents_user_status criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_agents_user_status já existe';
  END IF;
END $$;

-- Índice para instance_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_agents_instance_id'
  ) THEN
    RAISE NOTICE '🤖 Criando índice agents por instance_id...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_agents_instance_id ON agents(instance_id) WHERE instance_id IS NOT NULL';
    RAISE NOTICE '✅ Índice idx_agents_instance_id criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_agents_instance_id já existe';
  END IF;
END $$;

-- =====================================================
-- 6. ÍNDICES PARA TABELA PAYMENTS (BAIXA PRIORIDADE)
-- =====================================================

-- Índice para usuário e status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_payments_user_status'
  ) THEN
    RAISE NOTICE '💳 Criando índice payments por usuário e status...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_payments_user_status ON payments(user_id, status)';
    RAISE NOTICE '✅ Índice idx_payments_user_status criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_payments_user_status já existe';
  END IF;
END $$;

-- Índice para stripe_payment_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_payments_stripe_id'
  ) THEN
    RAISE NOTICE '💳 Criando índice payments por Stripe ID...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_payments_stripe_id ON payments(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL';
    RAISE NOTICE '✅ Índice idx_payments_stripe_id criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_payments_stripe_id já existe';
  END IF;
END $$;

-- =====================================================
-- 7. ÍNDICES PARA TABELA EVENT_LOGS (BAIXA PRIORIDADE)
-- =====================================================

-- Índice para tipo de evento e data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_event_logs_type_created'
  ) THEN
    RAISE NOTICE '📝 Criando índice event_logs por tipo e data...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_event_logs_type_created ON event_logs(event_type, created_at DESC)';
    RAISE NOTICE '✅ Índice idx_event_logs_type_created criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_event_logs_type_created já existe';
  END IF;
END $$;

-- Índice para usuário e data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_event_logs_user_created'
  ) THEN
    RAISE NOTICE '📝 Criando índice event_logs por usuário e data...';
    EXECUTE 'CREATE INDEX CONCURRENTLY idx_event_logs_user_created ON event_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL';
    RAISE NOTICE '✅ Índice idx_event_logs_user_created criado';
  ELSE
    RAISE NOTICE '⏭️ Índice idx_event_logs_user_created já existe';
  END IF;
END $$;

-- =====================================================
-- 8. RELATÓRIO DE ÍNDICES CRIADOS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 ===== RELATÓRIO DE ÍNDICES CRIADOS =====';
  RAISE NOTICE '';
END $$;

-- Listar todos os índices criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Estatísticas de tamanho dos índices
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND indexrelname LIKE 'idx_%'
ORDER BY pg_relation_size(indexrelid) DESC;

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ CRIAÇÃO DE ÍNDICES CONCLUÍDA!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RECOMENDAÇÕES:';
  RAISE NOTICE '1. Monitore a performance das consultas após a criação';
  RAISE NOTICE '2. Execute ANALYZE nas tabelas para atualizar estatísticas';
  RAISE NOTICE '3. Considere reindexar periodicamente em caso de alta carga';
  RAISE NOTICE '';
END $$;

-- Atualizar estatísticas das tabelas
ANALYZE messages;
ANALYZE contacts;
ANALYZE usage_stats;
ANALYZE whatsapp_instances;
ANALYZE agents;
ANALYZE payments;
ANALYZE event_logs;
