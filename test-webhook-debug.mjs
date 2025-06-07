#!/usr/bin/env node

/**
 * Script para testar o webhook principal e identificar erro 500
 */

const WEBHOOK_URL = 'https://webhooksaas.geni.chat/webhook/principal';

// Dados de teste simulando Evolution API
const testWebhookData = {
  instance: 'test-instance',
  event: 'message.upsert',
  data: {
    key: {
      remoteJid: '5511999999999@s.whatsapp.net',
      id: 'msg_test_' + Date.now()
    },
    pushName: 'Teste Usuario',
    message: {
      conversation: 'Olá, teste do webhook'
    }
  }
};

async function testWebhook() {
  console.log('🧪 Testando webhook principal...');
  console.log('URL:', WEBHOOK_URL);
  console.log('Dados:', JSON.stringify(testWebhookData, null, 2));
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Evolution-API-Test'
      },
      body: JSON.stringify(testWebhookData)
    });
    
    console.log('\n📊 Resposta:');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Corpo da resposta:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Dados parseados:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('Resposta não é JSON válido');
    }
    
    if (response.status === 500) {
      console.error('❌ ERRO 500 - Internal Server Error');
      console.error('Isso indica um problema no código do webhook');
    } else if (response.status >= 200 && response.status < 300) {
      console.log('✅ Webhook funcionando corretamente');
    } else {
      console.warn('⚠️ Status de resposta inesperado:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao fazer requisição:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('Servidor não está respondendo ou URL incorreta');
    } else if (error.code === 'ENOTFOUND') {
      console.error('Domínio não encontrado - verifique a URL');
    }
  }
}

async function testWebhookHealth() {
  console.log('\n🏥 Testando health check do webhook...');
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Health-Check-Test'
      }
    });
    
    console.log('Status do health check:', response.status);
    const responseText = await response.text();
    console.log('Resposta do health check:', responseText);
    
  } catch (error) {
    console.error('❌ Erro no health check:', error.message);
  }
}

// Executar testes
(async () => {
  await testWebhookHealth();
  await testWebhook();
})();
