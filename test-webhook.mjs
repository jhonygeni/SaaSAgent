#!/usr/bin/env node

// Script para testar o webhook do WhatsApp
import fetch from 'node-fetch';

const WEBHOOK_URL = 'http://localhost:3000/api/webhook/whatsapp';
const VERIFY_TOKEN = 'dev-webhook-verify-token';

async function testWebhookVerification() {
  console.log('🔍 Testando verificação do webhook...');
  
  try {
    const verifyUrl = `${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test-challenge`;
    
    const response = await fetch(verifyUrl);
    const text = await response.text();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text}`);
    
    if (response.status === 200 && text === 'test-challenge') {
      console.log('✅ Verificação do webhook passou!');
      return true;
    } else {
      console.log('❌ Verificação do webhook falhou!');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return false;
  }
}

async function testWebhookMessage() {
  console.log('📱 Testando recebimento de mensagem...');
  
  // Mock de payload do WhatsApp Business API
  const mockWhatsAppPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry_id',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15551234567',
                phone_number_id: 'phone123'
              },
              contacts: [
                {
                  profile: {
                    name: 'Teste Usuario'
                  },
                  wa_id: '5511999999999'
                }
              ],
              messages: [
                {
                  from: '5511999999999',
                  id: 'msg_' + Date.now(),
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  type: 'text',
                  text: {
                    body: 'Olá! Esta é uma mensagem de teste do webhook.'
                  }
                }
              ]
            }
          }
        ]
      }
    ]
  };
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp/1.0'
      },
      body: JSON.stringify(mockWhatsAppPayload)
    });
    
    const text = await response.text();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text}`);
    
    if (response.status === 200) {
      console.log('✅ Teste de mensagem passou!');
      return true;
    } else {
      console.log('❌ Teste de mensagem falhou!');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste de mensagem:', error);
    return false;
  }
}

async function testWebhookWithInvalidData() {
  console.log('❗ Testando webhook com dados inválidos...');
  
  const invalidPayload = {
    object: 'invalid_object',
    entry: []
  };
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidPayload)
    });
    
    const text = await response.text();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text}`);
    
    if (response.status === 400) {
      console.log('✅ Validação de dados inválidos funcionando!');
      return true;
    } else {
      console.log('❌ Validação de dados inválidos não está funcionando!');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro no teste de dados inválidos:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testes do webhook do WhatsApp...\n');
  
  const results = {
    verification: await testWebhookVerification(),
    message: await testWebhookMessage(),
    invalidData: await testWebhookWithInvalidData()
  };
  
  console.log('\n📊 Resultados dos testes:');
  console.log(`Verificação: ${results.verification ? '✅' : '❌'}`);
  console.log(`Mensagem: ${results.message ? '✅' : '❌'}`);
  console.log(`Dados inválidos: ${results.invalidData ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 Todos os testes passaram! O webhook está funcionando corretamente.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique a implementação do webhook.');
  }
  
  return allPassed;
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, testWebhookVerification, testWebhookMessage, testWebhookWithInvalidData };
