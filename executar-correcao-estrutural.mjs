#!/usr/bin/env node
/**
 * SCRIPT DE EXECUÇÃO DA CORREÇÃO ESTRUTURAL SUPABASE
 * ConversaAI Brasil - Correção Crítica de Instâncias WhatsApp
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Configurações do Supabase
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

console.log('🎯 INICIANDO CORREÇÃO ESTRUTURAL DO SUPABASE');
console.log('='.repeat(50));

async function executarEtapa(titulo, sql) {
  console.log(`\n📋 ${titulo}`);
  console.log('-'.repeat(30));
  
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql });
    
    if (error) {
      console.error(`❌ ERRO: ${error.message}`);
      return false;
    }
    
    console.log('✅ Executado com sucesso');
    return true;
  } catch (error) {
    console.error(`❌ ERRO: ${error.message}`);
    return false;
  }
}

async function verificarEstrutura() {
  console.log('\n🔍 VERIFICANDO ESTRUTURA ATUAL...');
  
  // Verificar tabelas existentes
  const { data: tables } = await supabaseAdmin
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['agents', 'whatsapp_instances', 'profiles']);
  
  console.log('📊 Tabelas encontradas:', tables?.map(t => t.table_name) || []);
  
  // Contar registros nas tabelas
  try {
    const { count: agentsCount } = await supabaseAdmin
      .from('agents')
      .select('*', { count: 'exact', head: true });
    console.log(`📈 Registros em agents: ${agentsCount || 0}`);
  } catch (e) {
    console.log('⚠️  Tabela agents não encontrada ou inacessível');
  }
  
  try {
    const { count: instancesCount } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*', { count: 'exact', head: true });
    console.log(`📈 Registros em whatsapp_instances: ${instancesCount || 0}`);
  } catch (e) {
    console.log('⚠️  Tabela whatsapp_instances não encontrada ou inacessível');
  }
}

async function executarCorrecao() {
  console.log('\n🚀 INICIANDO CORREÇÃO ESTRUTURAL...');
  
  // ETAPA 1: Recriar whatsapp_instances
  const sql1 = `
    -- Desabilitar RLS temporariamente
    ALTER TABLE IF EXISTS public.whatsapp_instances DISABLE ROW LEVEL SECURITY;
    
    -- Recriar tabela whatsapp_instances
    DROP TABLE IF EXISTS public.whatsapp_instances CASCADE;
    
    CREATE TABLE public.whatsapp_instances (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      
      -- Dados básicos da instância
      name TEXT NOT NULL UNIQUE,
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
  `;
  
  const sucesso1 = await executarEtapa('ETAPA 1: Recriar tabela whatsapp_instances', sql1);
  if (!sucesso1) return false;
  
  // ETAPA 2: Backup e recriar agents
  const sql2 = `
    -- Backup dos dados existentes
    CREATE TABLE IF NOT EXISTS agents_backup AS SELECT * FROM public.agents;
    
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
  `;
  
  const sucesso2 = await executarEtapa('ETAPA 2: Backup e recriar tabela agents', sql2);
  if (!sucesso2) return false;
  
  // ETAPA 3: RLS e Políticas
  const sql3 = `
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
  `;
  
  const sucesso3 = await executarEtapa('ETAPA 3: RLS e Triggers', sql3);
  if (!sucesso3) return false;
  
  return true;
}

async function verificarResultado() {
  console.log('\n✅ VERIFICANDO RESULTADO FINAL...');
  
  // Verificar estrutura das tabelas
  const { data: whatsappInstancesCount } = await supabaseAdmin
    .from('whatsapp_instances')
    .select('*', { count: 'exact', head: true });
    
  const { data: agentsCount } = await supabaseAdmin
    .from('agents')
    .select('*', { count: 'exact', head: true });
    
  const { data: backupCount } = await supabaseAdmin
    .from('agents_backup')
    .select('*', { count: 'exact', head: true });
  
  console.log('📊 RESULTADO FINAL:');
  console.log(`   📦 whatsapp_instances: ${whatsappInstancesCount?.length || 0} registros`);
  console.log(`   🤖 agents: ${agentsCount?.length || 0} registros`);
  console.log(`   💾 agents_backup: ${backupCount?.length || 0} registros (backup preservado)`);
}

// Executar correção
async function main() {
  try {
    await verificarEstrutura();
    
    const sucesso = await executarCorrecao();
    
    if (sucesso) {
      await verificarResultado();
      console.log('\n🎉 CORREÇÃO ESTRUTURAL CONCLUÍDA COM SUCESSO!');
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('   1. Atualizar código para usar nova estrutura');
      console.log('   2. Testar conexão de nova instância WhatsApp');
      console.log('   3. Validar que dados são salvos corretamente');
    } else {
      console.log('\n❌ Correção falhou. Verifique os erros acima.');
    }
    
  } catch (error) {
    console.error('\n💥 ERRO CRÍTICO:', error.message);
  }
}

main();
