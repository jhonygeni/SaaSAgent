#!/usr/bin/env node

// Teste para executar APÓS aplicar as SQL triggers
const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const anonKey = 'process.env.SUPABASE_ANON_KEY || ""';
const serviceKey = 'process.env.SUPABASE_ANON_KEY || ""';

async function testAfterTriggers() {
  console.log('🧪 TESTE APÓS APLICAR SQL TRIGGERS');
  console.log('='.repeat(50));

  // 1. Verificar se plano Free existe
  console.log('\n💰 1. Verificando plano Free...');
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/subscription_plans?name=eq.Free`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    const plans = await response.json();
    
    if (plans.length > 0) {
      console.log('✅ Plano Free encontrado:', plans[0].name);
    } else {
      console.log('❌ Plano Free não encontrado');
      return;
    }
  } catch (error) {
    console.log('❌ Erro ao verificar plano:', error.message);
    return;
  }

  // 2. Testar cadastro de usuário
  console.log('\n👤 2. Testando cadastro de usuário...');
  const testEmail = `teste-triggers-${Date.now()}@conversaai.com.br`;
  
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
        data: {
          name: 'Teste Triggers SQL'
        }
      })
    });

    if (signupResponse.ok) {
      const result = await signupResponse.json();
      console.log('✅ Usuário criado com sucesso!');
      console.log('📧 Email:', testEmail);
      console.log('🆔 User ID:', result.user?.id);

      // 3. Verificar se perfil foi criado automaticamente
      console.log('\n👥 3. Verificando se perfil foi criado...');
      setTimeout(async () => {
        try {
          const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${result.user.id}`, {
            headers: {
              'Authorization': `Bearer ${serviceKey}`,
              'apikey': serviceKey
            }
          });
          const profiles = await profileResponse.json();
          
          if (profiles.length > 0) {
            console.log('✅ Perfil criado automaticamente via trigger!');
            console.log('📝 Nome:', profiles[0].full_name);
          } else {
            console.log('❌ Perfil NÃO foi criado automaticamente');
          }
        } catch (error) {
          console.log('❌ Erro ao verificar perfil:', error.message);
        }

        // 4. Verificar se assinatura foi criada
        console.log('\n💳 4. Verificando se assinatura foi criada...');
        try {
          const subResponse = await fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${result.user.id}&select=*,subscription_plans(name)`, {
            headers: {
              'Authorization': `Bearer ${serviceKey}`,
              'apikey': serviceKey
            }
          });
          const subscriptions = await subResponse.json();
          
          if (subscriptions.length > 0) {
            console.log('✅ Assinatura criada automaticamente via trigger!');
            console.log('📦 Plano:', subscriptions[0].subscription_plans?.name);
            console.log('📅 Status:', subscriptions[0].status);
          } else {
            console.log('❌ Assinatura NÃO foi criada automaticamente');
          }
        } catch (error) {
          console.log('❌ Erro ao verificar assinatura:', error.message);
        }

        console.log('\n🎯 RESULTADO:');
        if (profiles.length > 0 && subscriptions.length > 0) {
          console.log('✅ TRIGGERS FUNCIONANDO PERFEITAMENTE!');
          console.log('📧 Próximo passo: Configurar Auth Hooks para emails');
        } else {
          console.log('❌ Triggers não estão funcionando corretamente');
          console.log('🔧 Verifique se executou o SQL triggers no console');
        }
      }, 2000);

    } else {
      const errorResult = await signupResponse.json();
      console.log('❌ Erro no cadastro:', errorResult);
    }
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
  }
}

// Verificar se fetch está disponível
if (typeof fetch === 'undefined') {
  console.log('❌ fetch não está disponível. Instale node-fetch ou use Node.js 18+');
  process.exit(1);
}

testAfterTriggers().catch(console.error);
