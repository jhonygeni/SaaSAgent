#!/usr/bin/env node

/**
 * Test script to debug chat functionality
 */

console.log('🔍 TESTE DE DEBUG DO CHAT - CONVERSA AI BRASIL');
console.log('==================================================');

// Test 1: Check if the dev server is responding
console.log('\n1. 📡 TESTANDO SERVIDOR DE DESENVOLVIMENTO...');
try {
  const response = await fetch('http://localhost:8084');
  if (response.ok) {
    console.log('✅ Servidor respondendo na porta 8084');
  } else {
    console.log('❌ Servidor não está respondendo adequadamente');
  }
} catch (error) {
  console.log('❌ Erro ao conectar ao servidor:', error.message);
}

// Test 2: Test webhook endpoint
console.log('\n2. 🌐 TESTANDO WEBHOOK PRINCIPAL...');
try {
  const webhookResponse = await fetch('https://webhooksaas.geni.chat/webhook/principal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      test: true,
      message: 'Test message from debug script',
      timestamp: new Date().toISOString()
    })
  });
  
  if (webhookResponse.ok) {
    const data = await webhookResponse.text();
    console.log('✅ Webhook principal respondendo:', data.substring(0, 100));
  } else {
    console.log('❌ Webhook principal não respondeu adequadamente:', webhookResponse.status);
  }
} catch (error) {
  console.log('❌ Erro ao testar webhook principal:', error.message);
}

// Test 3: Test local webhook
console.log('\n3. 🏠 TESTANDO WEBHOOK LOCAL...');
try {
  const localWebhookResponse = await fetch('http://localhost:3001/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instance: 'test-instance',
      data: {
        pushName: 'Test User',
        key: { remoteJid: '5511999999999@s.whatsapp.net' },
        message: { conversation: 'Test message' }
      }
    })
  });
  
  if (localWebhookResponse.ok) {
    const data = await localWebhookResponse.text();
    console.log('✅ Webhook local respondendo:', data.substring(0, 100));
  } else {
    console.log('❌ Webhook local não respondeu adequadamente:', localWebhookResponse.status);
  }
} catch (error) {
  console.log('❌ Erro ao testar webhook local:', error.message);
}

// Test 4: Test Supabase connection (simplified)
console.log('\n4. 🗄️ TESTANDO CONEXÃO COM SUPABASE...');
try {
  const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc'
    }
  });
  
  if (response.ok) {
    console.log('✅ Supabase API respondendo');
  } else {
    console.log('❌ Supabase API não respondeu adequadamente:', response.status);
  }
} catch (error) {
  console.log('❌ Erro ao conectar ao Supabase:', error.message);
}

console.log('\n==================================================');
console.log('🎯 DEBUG COMPLETO');
console.log('==================================================');
