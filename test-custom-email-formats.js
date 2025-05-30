#!/usr/bin/env node
/**
 * Test de formato do payload para a função custom-email
 * 
 * Este script testa diferentes formatos de payload para garantir que
 * a função custom-email seja capaz de processá-los corretamente.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do cliente Supabase
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';

if (!SUPABASE_KEY) {
  console.error('⚠️ SUPABASE_ANON_KEY não encontrada. Configure esta variável de ambiente.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Testa a função custom-email com diferentes formatos de payload
 */
async function testMultipleFormats() {
  console.log('🧪 Testando função custom-email com múltiplos formatos');
  console.log('=====================================================\n');
  
  // Variáveis de teste
  const testEmail = 'teste@conversaai.com.br';
  const testToken = 'test-token-' + Math.random().toString(36).substring(2, 10);
  
  // 1. Formato de webhook Auth Hook
  const authHookFormat = {
    type: 'auth',
    event: 'signup',
    user: {
      id: 'usr_' + Math.random().toString(36).substring(2, 10),
      email: testEmail,
      user_metadata: {
        name: 'Usuário Teste Webhook'
      }
    },
    data: {
      token: testToken
    }
  };
  
  // 2. Formato API direta 
  const directApiFormat = {
    email: testEmail,
    type: 'signup',
    token: testToken,
    redirect_to: 'https://app.conversaai.com.br/confirmar-email',
    metadata: {
      name: 'Usuário Teste API Direta'
    }
  };
  
  // 3. Formato de templates personalizado
  const templateFormat = {
    email: testEmail,
    template: 'confirmacao',
    data: {
      token: testToken,
      nome: 'Usuário Teste Template'
    }
  };
  
  // 4. Formato alternativo (format do test-complete-system.mjs)
  const alternativeFormat = {
    type: 'signup',
    user: {
      email: testEmail,
      email_confirm: `https://app.conversaai.com.br/confirmar-email?token=${testToken}`
    }
  };
  
  try {
    // Testar formato Auth Hook
    console.log('📨 Testando formato Auth Hook...');
    const webhookResult = await sendTest(authHookFormat);
    displayResult(webhookResult, 'Auth Hook');
    
    // Testar formato API Direta
    console.log('📨 Testando formato API Direta...');
    const directResult = await sendTest(directApiFormat);
    displayResult(directResult, 'API Direta');
    
    // Testar formato Template
    console.log('📨 Testando formato Template...');
    const templateResult = await sendTest(templateFormat);
    displayResult(templateResult, 'Template');
    
    // Testar formato Alternativo
    console.log('📨 Testando formato Alternativo...');
    const alternativeResult = await sendTest(alternativeFormat);
    displayResult(alternativeResult, 'Alternativo');
    
    console.log('\n✅ Todos os testes concluídos!');
    
  } catch (error) {
    console.error('\n❌ Erro ao executar testes:', error);
  }
}

/**
 * Envia uma requisição de teste para a função
 */
async function sendTest(payload) {
  try {
    const { data, error } = await supabase.functions.invoke('custom-email', {
      body: payload
    });
    
    return { data, error, payload };
  } catch (err) {
    return { error: err, payload };
  }
}

/**
 * Exibe o resultado do teste
 */
function displayResult(result, formatName) {
  console.log(`\n🔍 Resultado para formato ${formatName}:`);
  
  if (result.error) {
    console.log('❌ ERRO:', result.error);
  } else {
    console.log('✅ SUCESSO:', result.data);
  }
  
  console.log('📦 Payload enviado:', JSON.stringify(result.payload, null, 2));
  console.log('-'.repeat(50));
}

// Executar testes
testMultipleFormats();
