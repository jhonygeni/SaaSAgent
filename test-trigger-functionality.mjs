#!/usr/bin/env node

/**
 * TESTE DE FUNCIONALIDADE DO TRIGGER
 * Verifica se o sistema está funcionando corretamente
 */

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🧪 TESTANDO FUNCIONALIDADE DO TRIGGER\n');

async function testTriggerFunctionality() {
  try {
    // 1. Verificar se o trigger existe
    console.log('1. 🔍 Verificando se o trigger existe...');
    const { data: triggers, error: triggerError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created');

    if (triggerError) {
      console.log('❌ Erro ao verificar triggers:', triggerError.message);
    } else if (triggers && triggers.length > 0) {
      console.log('✅ Trigger encontrado:', triggers[0].trigger_name);
    } else {
      console.log('❌ Trigger NÃO encontrado');
    }

    // 2. Verificar se existe plano gratuito
    console.log('\n2. 🔍 Verificando plano gratuito...');
    const { data: freePlan, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('name', 'Free')
      .eq('is_active', true)
      .single();

    if (planError) {
      console.log('❌ Erro ao verificar planos ou plano não encontrado:', planError.message);
      
      // Criar plano gratuito se não existir
      console.log('\n3. 🔧 Criando plano gratuito...');
      const { data: newPlan, error: createError } = await supabaseAdmin
        .from('subscription_plans')
        .insert({
          name: 'Free',
          price: 0,
          interval: 'month',
          message_limit: 50,
          agent_limit: 1,
          is_active: true,
          description: 'Plano gratuito com recursos limitados',
          features: {
            basic_ai: true,
            single_agent: true,
            whatsapp_integration: true
          }
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Erro ao criar plano gratuito:', createError.message);
      } else {
        console.log('✅ Plano gratuito criado:', newPlan.id);
      }
    } else {
      console.log('✅ Plano gratuito encontrado:', freePlan.id);
    }

    // 3. Verificar usuários órfãos (sem perfil ou assinatura)
    console.log('\n4. 🔍 Verificando usuários órfãos...');
    
    // Usar RPC para consulta mais complexa
    const { data: orphanUsers, error: orphanError } = await supabaseAdmin
      .rpc('check_orphan_users');

    if (orphanError) {
      console.log('❌ Erro ao verificar usuários órfãos (função não existe):', orphanError.message);
      
      // Verificação manual usando query simples
      const { data: allProfiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id');

      const { data: allSubscriptions, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id');

      if (!profileError && !subError) {
        console.log(`📊 Perfis existentes: ${allProfiles?.length || 0}`);
        console.log(`📊 Assinaturas existentes: ${allSubscriptions?.length || 0}`);
      }
    } else {
      console.log('📊 Usuários órfãos encontrados:', orphanUsers?.length || 0);
    }

    // 4. Verificar estrutura das tabelas
    console.log('\n5. 🔍 Verificando estrutura das tabelas...');
    
    const tables = ['profiles', 'subscriptions', 'subscription_plans'];
    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ Tabela ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${table}: ${data?.length || 0} registros`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📋 DIAGNÓSTICO CONCLUÍDO');
    console.log('='.repeat(50));
    
    console.log('\n🔧 PRÓXIMOS PASSOS:');
    console.log('1. Se o trigger não existir, execute o SQL manualmente no console');
    console.log('2. Se não há plano gratuito, foi criado automaticamente');
    console.log('3. Teste criar um novo usuário para verificar funcionamento');
    
    console.log('\n🔗 Links úteis:');
    console.log('- Console SQL: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql');
    console.log('- Auth Users: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/users');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar teste
testTriggerFunctionality().catch(console.error);
