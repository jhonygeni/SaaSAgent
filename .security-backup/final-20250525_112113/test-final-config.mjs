#!/usr/bin/env node

// Teste completo do sistema após configurações
const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.PcOQzSbU5aH8X8gQbFZBpJzKwU7E-wUJ_YQa0VLgTRo';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

async function testCompleteSystem() {
  console.log('🚀 TESTE COMPLETO APÓS CONFIGURAÇÕES');
  console.log('='.repeat(50));

  // 1. Verificar status atual
  console.log('\n📊 1. STATUS ATUAL:');
  
  try {
    // Contar perfis
    const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Range': '0-0'
      }
    });
    const profilesCount = profilesResponse.headers.get('content-range')?.split('/')[1] || '0';
    console.log(`✅ Perfis criados: ${profilesCount}`);

    // Contar assinaturas
    const subsResponse = await fetch(`${supabaseUrl}/rest/v1/subscriptions?select=count`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Range': '0-0'
      }
    });
    const subsCount = subsResponse.headers.get('content-range')?.split('/')[1] || '0';
    console.log(`✅ Assinaturas criadas: ${subsCount}`);

  } catch (error) {
    console.log('❌ Erro ao verificar status:', error.message);
  }

  // 2. Testar função de email diretamente
  console.log('\n📧 2. TESTANDO FUNÇÃO CUSTOM-EMAIL:');
  try {
    const emailResponse = await fetch(`${supabaseUrl}/functions/v1/custom-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'signup',
        email: 'teste-direto@exemplo.com',
        user: { name: 'Teste Direto' }
      })
    });
    const emailResult = await emailResponse.text();
    console.log(`✅ Função respondeu: ${emailResult}`);
  } catch (error) {
    console.log('❌ Erro na função:', error.message);
  }

  // 3. Testar cadastro de usuário real
  console.log('\n👤 3. TESTANDO CADASTRO DE USUÁRIO:');
  const testEmail = `teste-config-${Date.now()}@conversaai.com.br`;
  
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
          name: 'Teste Configuração'
        }
      })
    });

    const signupResult = await signupResponse.json();
    
    if (signupResponse.ok) {
      console.log(`✅ Usuário criado: ${testEmail}`);
      console.log(`📧 Deve receber email de confirmação!`);
      
      // Aguardar um pouco e verificar se perfil foi criado
      setTimeout(async () => {
        try {
          const profileCheck = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${signupResult.user.id}&select=*`, {
            headers: {
              'Authorization': `Bearer ${serviceKey}`,
              'apikey': serviceKey
            }
          });
          const profiles = await profileCheck.json();
          
          if (profiles.length > 0) {
            console.log(`✅ Perfil criado automaticamente via trigger!`);
          } else {
            console.log(`❌ Perfil NÃO foi criado automaticamente`);
          }
        } catch (error) {
          console.log('❌ Erro ao verificar perfil:', error.message);
        }
      }, 2000);
      
    } else {
      console.log('❌ Erro no cadastro:', signupResult);
    }
  } catch (error) {
    console.log('❌ Erro no teste de cadastro:', error.message);
  }

  console.log('\n🎯 RESULTADO ESPERADO:');
  console.log('- ✅ SQL Triggers funcionando (perfis e assinaturas criados)');
  console.log('- 📧 Email de confirmação enviado para usuário teste');
  console.log('- 🔍 Verifique sua caixa de email para confirmar!');
}

testCompleteSystem();
