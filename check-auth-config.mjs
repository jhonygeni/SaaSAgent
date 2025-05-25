#!/usr/bin/env node

// Verificar configuração de Auth Hooks e diagnóstico completo
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_ANON_KEY || "";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthConfig() {
  console.log('🔍 DIAGNÓSTICO COMPLETO - Auth Hooks e Triggers');
  console.log('='.repeat(50));

  // 1. Verificar se a função de email está funcionando
  console.log('\n📧 1. TESTANDO FUNÇÃO CUSTOM-EMAIL...');
  try {
    const testResponse = await fetch(`${supabaseUrl}/functions/v1/custom-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'signup',
        email: 'teste@exemplo.com'
      })
    });
    
    const result = await testResponse.text();
    console.log('✅ Função custom-email resposta:', result);
  } catch (error) {
    console.error('❌ Erro na função custom-email:', error.message);
  }

  // 2. Verificar planos de assinatura
  console.log('\n📋 2. VERIFICANDO PLANOS DE ASSINATURA...');
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('subscription_plans')
      .select('*');
    
    if (error) {
      console.error('❌ Erro ao buscar planos:', error);
    } else {
      console.log(`✅ ${plans.length} planos encontrados:`);
      plans.forEach(plan => {
        console.log(`   - ${plan.name}: R$ ${plan.price} (${plan.message_limit} msgs)`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar planos:', error.message);
  }

  // 3. Verificar usuários existentes
  console.log('\n👥 3. VERIFICANDO USUÁRIOS CADASTRADOS...');
  try {
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Erro ao listar usuários:', error);
    } else {
      console.log(`✅ ${users.users.length} usuários encontrados:`);
      users.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} - Status: ${user.email_confirmed_at ? 'Confirmado' : 'Pendente'} - Criado: ${new Date(user.created_at).toLocaleString()}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
  }

  // 4. Verificar perfis criados
  console.log('\n👤 4. VERIFICANDO PERFIS CRIADOS...');
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error('❌ Erro ao buscar perfis:', error);
    } else {
      console.log(`✅ ${profiles.length} perfis encontrados:`);
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.full_name || profile.id} - Ativo: ${profile.is_active}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar perfis:', error.message);
  }

  // 5. Verificar assinaturas criadas
  console.log('\n💳 5. VERIFICANDO ASSINATURAS CRIADAS...');
  try {
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*, subscription_plans(name, price)');
    
    if (error) {
      console.error('❌ Erro ao buscar assinaturas:', error);
    } else {
      console.log(`✅ ${subscriptions.length} assinaturas encontradas:`);
      subscriptions.forEach((sub, index) => {
        console.log(`   ${index + 1}. Usuário: ${sub.user_id} - Plano: ${sub.subscription_plans?.name} - Status: ${sub.status}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar assinaturas:', error.message);
  }

  // 6. Verificar se triggers existem
  console.log('\n🔧 6. VERIFICANDO TRIGGERS SQL...');
  try {
    const { data: triggers, error } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('*')
      .eq('trigger_name', 'on_auth_user_created');
    
    if (error) {
      console.error('❌ Erro ao verificar triggers:', error);
    } else if (triggers.length === 0) {
      console.log('❌ Trigger on_auth_user_created NÃO EXISTE');
    } else {
      console.log('✅ Trigger on_auth_user_created EXISTE');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar triggers:', error.message);
  }

  console.log('\n🎯 DIAGNÓSTICO CONCLUÍDO');
  console.log('='.repeat(50));
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. ❌ CONFIGURAR AUTH HOOKS no console (emails não estão sendo enviados)');
  console.log('2. ❌ EXECUTAR SQL TRIGGERS no console (perfis não estão sendo criados)');
  console.log('3. 🧪 TESTAR cadastro após configurações');
  
  console.log('\n🔗 Links importantes:');
  console.log('   Auth Settings: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/settings');
  console.log('   SQL Editor: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql');
}

checkAuthConfig().catch(console.error);
