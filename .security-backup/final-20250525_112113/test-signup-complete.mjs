#!/usr/bin/env node

// Teste de cadastro completo para verificar se emails são enviados
import fetch from 'node-fetch';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.PcOQzSbU5aH8X8gQbFZBpJzKwU7E-wUJ_YQa0VLgTRo';

async function testSignupComplete() {
  console.log('🚀 TESTE COMPLETO DE CADASTRO E EMAIL');
  console.log('='.repeat(50));

  // 1. Primeiro testar a função custom-email diretamente
  console.log('\n📧 1. TESTANDO FUNÇÃO CUSTOM-EMAIL DIRETAMENTE:');
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
        user: { name: 'Teste Direto' },
        token: 'test-token-123',
        redirect_to: 'https://app.conversaai.com.br/confirmar-email'
      })
    });
    
    const emailResult = await emailResponse.text();
    console.log(`✅ Função respondeu: ${emailResult}`);
  } catch (error) {
    console.log('❌ Erro na função:', error.message);
  }

  // 2. Testar cadastro real de usuário
  console.log('\n👤 2. TESTANDO CADASTRO REAL DE USUÁRIO:');
  const testEmail = `teste-signup-${Date.now()}@conversaai.com.br`;
  
  try {
    const signupResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'senha123456',
        data: {
          name: 'Teste Cadastro Completo'
        }
      })
    });

    if (signupResponse.ok) {
      const signupResult = await signupResponse.json();
      console.log(`✅ Usuário criado: ${testEmail}`);
      console.log(`📄 Resposta completa:`, JSON.stringify(signupResult, null, 2));
      
      if (signupResult.user && !signupResult.user.email_confirmed_at) {
        console.log('📧 Email de confirmação deve ter sido enviado!');
        console.log('🔍 Verifique sua caixa de entrada para o email:', testEmail);
      } else {
        console.log('⚠️ Email pode já estar confirmado ou houve um problema');
      }
      
    } else {
      const errorResult = await signupResponse.text();
      console.log('❌ Erro no cadastro:', signupResponse.status, errorResult);
    }
  } catch (error) {
    console.log('❌ Erro no teste de cadastro:', error.message);
  }

  console.log('\n🎯 RESULTADO ESPERADO:');
  console.log('- ✅ Função custom-email funcionando');
  console.log('- ✅ Usuário criado com sucesso');
  console.log('- 📧 Email de confirmação enviado automaticamente');
  console.log('- 📝 Perfil e assinatura criados automaticamente via triggers SQL');
  
  console.log('\n📋 PRÓXIMO PASSO:');
  console.log('- Verifique se o email chegou na caixa de entrada');
  console.log('- Se não chegou, precisamos configurar os Auth Hooks no console Supabase');
}

testSignupComplete().catch(console.error);
