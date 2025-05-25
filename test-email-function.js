#!/usr/bin/env node

// Script para testar a função custom-email
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseKey = 'process.env.SUPABASE_ANON_KEY || ""';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailFunction() {
  console.log('🧪 Testando a função custom-email...');
  
  try {
    const testPayload = {
      email: 'teste@exemplo.com',
      type: 'signup',
      token: 'test-token-123',
      redirect_to: 'https://app.conversaai.com.br/confirmar-email',
      metadata: {
        name: 'Usuário Teste'
      }
    };
    
    console.log('📤 Enviando payload de teste:', testPayload);
    
    const { data, error } = await supabase.functions.invoke('custom-email', {
      body: testPayload
    });
    
    if (error) {
      console.error('❌ Erro na função:', error);
      return;
    }
    
    console.log('✅ Resposta da função:', data);
    
  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

async function checkAuthWebhook() {
  console.log('\n🔍 Verificando configuração de Auth...');
  
  // Tentar fazer um signup de teste para ver se o webhook é chamado
  try {
    const { data, error } = await supabase.auth.signUp({
      email: 'teste-webhook@exemplo.com',
      password: 'senha123',
      options: {
        data: {
          name: 'Teste Webhook'
        }
      }
    });
    
    if (error) {
      console.error('❌ Erro no signup:', error);
      return;
    }
    
    console.log('✅ Signup executado:', data);
    console.log('📧 Verifique se o email foi enviado para teste-webhook@exemplo.com');
    
  } catch (err) {
    console.error('💥 Erro no teste de signup:', err);
  }
}

async function main() {
  await testEmailFunction();
  await checkAuthWebhook();
}

main();
