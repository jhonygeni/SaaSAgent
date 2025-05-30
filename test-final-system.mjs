#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🎯 TESTE FINAL DO SISTEMA');
console.log('='.repeat(40));

async function testSystem() {
  try {
    // 1. Verificar estrutura das tabelas
    console.log('\n📊 1. VERIFICANDO ESTRUTURA DAS TABELAS...');
    
    const { data: plans, error: planError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*');
    
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*');
    
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*');

    if (!planError) {
      console.log(`✅ Planos de assinatura: ${plans?.length || 0} encontrados`);
      if (plans?.length > 0) {
        console.log(`   - ${plans.map(p => `${p.name} (${p.price})`).join(', ')}`);
      }
    } else {
      console.log('❌ Erro ao verificar planos:', planError.message);
    }

    if (!profileError) {
      console.log(`✅ Perfis de usuário: ${profiles?.length || 0} encontrados`);
    } else {
      console.log('❌ Erro ao verificar perfis:', profileError.message);
    }

    if (!subError) {
      console.log(`✅ Assinaturas: ${subscriptions?.length || 0} encontradas`);
    } else {
      console.log('❌ Erro ao verificar assinaturas:', subError.message);
    }

    // 2. Verificar se existe plano gratuito
    console.log('\n🆓 2. VERIFICANDO PLANO GRATUITO...');
    const freePlan = plans?.find(p => p.name === 'Free' && p.is_active);
    
    if (freePlan) {
      console.log('✅ Plano gratuito encontrado:', freePlan.id);
    } else {
      console.log('❌ Plano gratuito não encontrado - será criado automaticamente no primeiro cadastro');
    }

    // 3. Testar função de email
    console.log('\n📧 3. TESTANDO FUNÇÃO DE EMAIL...');
    try {
      const response = await fetch('https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          type: 'invite',
          email: 'teste@exemplo.com',
          data: { confirmation_url: 'https://app.conversaai.com.br/confirm' }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Função de email funcionando:', result.message || 'OK');
      } else {
        console.log('⚠️ Função de email com problema:', response.status);
      }
    } catch (emailError) {
      console.log('❌ Erro na função de email:', emailError.message);
    }

    // 4. Verificar configuração atual
    console.log('\n⚙️ 4. STATUS DO SISTEMA...');
    console.log('='.repeat(40));
    
    if (plans?.length > 0 && profiles?.length >= 0 && subscriptions?.length >= 0) {
      console.log('✅ SISTEMA OPERACIONAL!');
      console.log('\n🔧 PRÓXIMOS PASSOS:');
      console.log('1. 📝 Execute o SQL do arquivo EXECUTE-FIXES-SIMPLE-v2.sql no console');
      console.log('2. 🔗 Configure Auth Hooks no dashboard do Supabase');
      console.log('3. 🧪 Teste criar um novo usuário');
      
      console.log('\n🔗 LINKS ÚTEIS:');
      console.log('- Console SQL: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql');
      console.log('- Auth Settings: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/settings');
      console.log('- Users: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/users');
    } else {
      console.log('❌ SISTEMA COM PROBLEMAS - Verifique configurações');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testSystem().catch(console.error);
