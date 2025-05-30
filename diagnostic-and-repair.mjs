#!/usr/bin/env node

// Diagnóstico completo e reparação do sistema
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseUrl = process.env.SUPABASE_URL || 'https://hpovwcaskorzzrpphgkc.supabase.co';

// Verificar se as credenciais estão configuradas
if (!serviceKey) {
  console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não configurada');
  console.error('Configure no arquivo .env: SUPABASE_SERVICE_ROLE_KEY=sua_chave');
  process.exit(1);
}

if (!anonKey) {
  console.error('❌ ERRO: SUPABASE_ANON_KEY não configurada');
  console.error('Configure no arquivo .env: SUPABASE_ANON_KEY=sua_chave');
  process.exit(1);
}

async function diagnosticAndRepair() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SISTEMA');
  console.log('='.repeat(50));

  // 1. Verificar planos de assinatura
  console.log('\n💰 1. Verificando planos de assinatura...');
  try {
    const plansResponse = await fetch(`${supabaseUrl}/rest/v1/subscription_plans?select=*`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    const plans = await plansResponse.json();
    console.log(`✅ ${plans.length} planos encontrados:`, plans.map(p => p.name).join(', '));
    
    // Se não há planos, criar o plano Free
    if (plans.length === 0) {
      console.log('🔧 Criando plano Free básico...');
      const createPlan = await fetch(`${supabaseUrl}/rest/v1/subscription_plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: 'Free',
          price: 0,
          interval: 'month',
          message_limit: 50,
          agent_limit: 1,
          is_active: true,
          description: 'Plano gratuito',
          features: { basic_ai: true, single_agent: true }
        })
      });
      
      if (createPlan.ok) {
        const newPlan = await createPlan.json();
        console.log('✅ Plano Free criado:', newPlan);
      } else {
        console.log('❌ Erro ao criar plano Free:', await createPlan.text());
      }
    }
  } catch (error) {
    console.log('❌ Erro ao verificar planos:', error.message);
  }

  // 2. Verificar função trigger
  console.log('\n🔧 2. Verificando função de trigger...');
  try {
    const triggerCheck = await fetch(`${supabaseUrl}/rest/v1/rpc/handle_new_user_signup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (triggerCheck.status === 404) {
      console.log('❌ Função handle_new_user_signup não existe - precisa recriar triggers');
    } else {
      console.log('✅ Função trigger existe');
    }
  } catch (error) {
    console.log('❌ Erro ao verificar trigger:', error.message);
  }

  // 3. Testar novamente o cadastro
  console.log('\n👤 3. Testando cadastro após diagnóstico...');
  const testEmail = `teste-repair-${Date.now()}@conversaai.com.br`;
  
  try {
    const signupResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'senha123456',
        data: { name: 'Teste Reparação' }
      })
    });

    const signupResult = await signupResponse.json();
    
    if (signupResponse.ok && signupResult.user) {
      console.log('✅ Cadastro funcionou! Usuário criado:', testEmail);
      console.log('📧 Email deve ter sido enviado para confirmação');
    } else {
      console.log('❌ Erro no cadastro:', signupResult);
    }
  } catch (error) {
    console.log('❌ Erro no teste de cadastro:', error.message);
  }

  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Se triggers não existem, execute: sql-triggers-completo.sql no console Supabase');
  console.log('2. Configure Auth Hooks no console: Auth > Settings > Auth Hooks');
  console.log('3. URL do webhook: https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email');
  console.log('4. Eventos: signup');
}

diagnosticAndRepair().catch(console.error);
