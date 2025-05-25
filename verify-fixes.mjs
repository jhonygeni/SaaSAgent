#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Configurações
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDM5MzMyNCwiZXhwIjoyMDQ5OTY5MzI0fQ.qVB7wnpnW-7Bte1q9cXFOD5uOLgGCjIQM_lKY0cqPTI';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function verifyDatabase() {
  console.log('🔍 VERIFICANDO ESTADO ATUAL DO BANCO DE DADOS');
  console.log('='.repeat(60));

  try {
    // 1. Verificar planos de assinatura
    console.log('\n📋 1. PLANOS DE ASSINATURA:');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*');
    
    if (plansError) {
      console.error('❌ Erro ao buscar planos:', plansError.message);
    } else {
      console.log(`✅ ${plans.length} planos encontrados:`);
      plans.forEach(plan => {
        console.log(`   - ${plan.name}: R$ ${(plan.price/100).toFixed(2)} (${plan.message_limit} msgs/mês)`);
      });
    }

    // 2. Verificar usuários existentes
    console.log('\n👥 2. USUÁRIOS CADASTRADOS:');
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao listar usuários:', usersError.message);
    } else {
      console.log(`✅ ${users.length} usuários encontrados`);
      for (const user of users) {
        console.log(`   - ${user.email} (${user.id})`);
      }
    }

    // 3. Verificar perfis
    console.log('\n👤 3. PERFIS CRIADOS:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError.message);
    } else {
      console.log(`✅ ${profiles.length} perfis encontrados:`);
      profiles.forEach(profile => {
        console.log(`   - ${profile.full_name || 'Sem nome'} (${profile.id})`);
      });
    }

    // 4. Verificar assinaturas
    console.log('\n💳 4. ASSINATURAS CRIADAS:');
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(name)');
    
    if (subscriptionsError) {
      console.error('❌ Erro ao buscar assinaturas:', subscriptionsError.message);
    } else {
      console.log(`✅ ${subscriptions.length} assinaturas encontradas:`);
      subscriptions.forEach(sub => {
        console.log(`   - User ${sub.user_id}: ${sub.subscription_plans?.name || 'Plano desconhecido'} (${sub.status})`);
      });
    }

    // 5. Verificar triggers
    console.log('\n⚡ 5. TRIGGERS SQL:');
    const { data: triggers, error: triggersError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT trigger_name, event_manipulation, action_statement 
              FROM information_schema.triggers 
              WHERE trigger_schema = 'public' 
              AND trigger_name LIKE '%user%'` 
      });
    
    if (triggersError) {
      console.error('❌ Erro ao verificar triggers:', triggersError.message);
    } else {
      console.log(`✅ ${triggers?.length || 0} triggers encontrados relacionados a usuários`);
      if (triggers && triggers.length > 0) {
        triggers.forEach(trigger => {
          console.log(`   - ${trigger.trigger_name}: ${trigger.event_manipulation}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 PRÓXIMOS PASSOS:');
  console.log('1. 🧪 Teste criar um novo usuário');
  console.log('2. ✅ Verifique se perfil e assinatura são criados automaticamente');
  console.log('3. 🔧 Configure Auth Hooks no console se necessário');
  console.log('\n🔗 Console: https://app.supabase.com/project/hpovwcaskorzzrpphgkc');
}

verifyDatabase().catch(console.error);
