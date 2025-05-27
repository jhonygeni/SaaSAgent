/**
 * Script para testar o sistema anti-loop de webhooks
 * 
 * Este script simula várias chamadas sequenciais para testar
 * se o sistema anti-loop está funcionando corretamente.
 */

const fetch = require('node-fetch');

// Configuração do teste
const TEST_CONFIG = {
  // URL do webhook a ser testado
  webhookUrl: 'http://localhost:3001/webhook/principal',
  
  // Número de mensagens a serem enviadas
  messageCount: 5,
  
  // Delay entre mensagens (ms)
  messageDelay: 500,
  
  // Simular mesmo ID para testar loop
  simulateLoop: true
};

// Dados de teste
function createTestMessage(index, useFixedId = false) {
  const now = Date.now();
  const messageId = useFixedId ? 'test-message-id-fixed' : `test-message-id-${now}-${index}`;
  
  return {
    instance: 'test-instance',
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: messageId
      },
      message: {
        conversation: `Mensagem de teste #${index} - ${new Date().toLocaleTimeString()}`
      },
      pushName: 'Usuário de Teste'
    },
    headers: {
      'X-Message-ID': messageId,
      'X-Processing-Count': '1',
      'X-Anti-Loop-Enabled': 'true'
    }
  };
}

// Enviar uma mensagem para o webhook
async function sendWebhookMessage(message, headers = {}) {
  try {
    console.log(`\n📤 Enviando mensagem: ${message.data.key.id}`);
    console.log(`   Conteúdo: "${message.data.message.conversation}"`);
    
    const response = await fetch(TEST_CONFIG.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...message.headers,
        ...headers
      },
      body: JSON.stringify(message)
    });
    
    const data = await response.json();
    
    console.log(`📥 Resposta: ${response.status} ${response.statusText}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Mensagem: ${data.message}`);
    
    if (data.processingInfo) {
      console.log(`   🔄 Processing: #${data.processingInfo.count} | ID: ${data.processingInfo.messageId}`);
    }
    
    // Se tem informação de loop, destacar
    if (data.loopInfo) {
      console.log(`   ⚠️ Loop Info: contagem=${data.loopInfo.count} | Detecção=${data.loopInfo.isLoop}`);
    }
    
    if (!data.success) {
      console.log(`   ❌ Erro: ${data.error}`);
    }
    
    return {
      success: data.success,
      data,
      headers: response.headers,
      status: response.status
    };
  } catch (error) {
    console.error(`❌ Erro ao enviar webhook: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Teste 1: Mensagens diferentes (não deve detectar loop)
async function testDifferentMessages() {
  console.log('\n🧪 TESTE 1: Mensagens diferentes (não deve detectar loop)');
  
  for (let i = 1; i <= TEST_CONFIG.messageCount; i++) {
    const message = createTestMessage(i, false);
    await sendWebhookMessage(message);
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.messageDelay));
  }
}

// Teste 2: Mesma mensagem repetida (deve detectar loop)
async function testLoopDetection() {
  console.log('\n🧪 TESTE 2: Mesma mensagem repetida (deve detectar loop)');
  
  for (let i = 1; i <= TEST_CONFIG.messageCount; i++) {
    const message = createTestMessage(i, true);
    
    // Simular o incremento do contador de processamento
    message.headers['X-Processing-Count'] = i.toString();
    
    const result = await sendWebhookMessage(message);
    
    // Se detectou loop, mostrar
    if (!result.success && result.status === 429) {
      console.log(`✅ Anti-loop funcionou! Bloqueou após ${i} tentativas.`);
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.messageDelay));
  }
}

// Teste 3: Mensagem com contador crescente
async function testProcessingCounter() {
  console.log('\n🧪 TESTE 3: Testando contador de processamento');
  
  const message = createTestMessage(1, true);
  let lastProcessingCount = 0;
  
  for (let i = 1; i <= TEST_CONFIG.messageCount; i++) {
    message.headers['X-Processing-Count'] = i.toString();
    message.data.message.conversation = `Mensagem #1 - Processamento ${i}`;
    
    const result = await sendWebhookMessage(message);
    
    if (result.data?.processingInfo?.count > lastProcessingCount) {
      lastProcessingCount = result.data.processingInfo.count;
      console.log(`✅ Contador incrementado: ${lastProcessingCount}`);
    }
    
    // Se detectou loop, mostrar
    if (!result.success && result.status === 429) {
      console.log(`✅ Anti-loop funcionou! Bloqueou após ${i} tentativas.`);
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.messageDelay));
  }
}

// Executar todos os testes
async function runAllTests() {
  console.log('🚀 Iniciando testes do sistema anti-loop');
  console.log(`📌 URL do webhook: ${TEST_CONFIG.webhookUrl}`);
  
  try {
    // Verificar se o servidor está disponível
    const healthCheck = await fetch(TEST_CONFIG.webhookUrl, { method: 'GET' });
    
    if (healthCheck.status === 200) {
      console.log('✅ Servidor webhook está online');
    } else {
      console.error('❌ Servidor webhook não está respondendo corretamente');
      console.error(`   Status: ${healthCheck.status}`);
      return;
    }
    
    // Executar todos os testes
    await testDifferentMessages();
    await testLoopDetection();
    await testProcessingCounter();
    
    console.log('\n🎉 Testes concluídos!');
    
  } catch (error) {
    console.error(`❌ Erro durante os testes: ${error.message}`);
  }
}

// Executar os testes
runAllTests();
