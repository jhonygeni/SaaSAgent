#!/usr/bin/env node

/**
 * Script de teste para o webhook de callback do N8N
 * Testa todas as funcionalidades e cenários do endpoint
 */

import fetch from 'node-fetch';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhook/n8n-callback';
const PRODUCTION_URL = 'https://webhooksaas.geni.chat/api/webhook/n8n-callback';

console.log('🧪 Testando N8N Callback Webhook');
console.log('='.repeat(50));

// Dados de teste
const testData = {
  valid: {
    instanceId: 'test-instance-123',
    instanceName: 'bot-teste',
    phoneNumber: '5511999999999',
    responseText: 'Esta é uma resposta automática de teste do N8N',
    originalMessageId: 'msg-original-123',
    userId: 'user-test-123',
    timestamp: new Date().toISOString()
  },
  minimal: {
    instanceId: 'test-instance-minimal',
    phoneNumber: '5511888888888',
    responseText: 'Resposta mínima'
  },
  invalid: {
    phoneNumber: '5511777777777'
    // Faltando instanceId e responseText
  }
};

/**
 * Função auxiliar para fazer requisições
 */
async function makeRequest(url, method = 'POST', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    const responseData = await response.text();
    
    let jsonData;
    try {
      jsonData = JSON.parse(responseData);
    } catch {
      jsonData = responseData;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: jsonData,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      error: error.message,
      status: 0
    };
  }
}

/**
 * Teste 1: Health Check
 */
async function testHealthCheck() {
  console.log('\n1. 🏥 TESTE DE SAÚDE');
  console.log('-'.repeat(30));
  
  const result = await makeRequest(WEBHOOK_URL, 'GET');
  
  if (result.ok) {
    console.log('✅ Health check passou');
    console.log('📊 Resposta:', result.data);
    return true;
  } else {
    console.log('❌ Health check falhou');
    console.log('❌ Status:', result.status);
    console.log('❌ Resposta:', result.data);
    return false;
  }
}

/**
 * Teste 2: Payload Válido Completo
 */
async function testValidPayload() {
  console.log('\n2. ✅ TESTE COM PAYLOAD VÁLIDO COMPLETO');
  console.log('-'.repeat(30));
  
  const result = await makeRequest(WEBHOOK_URL, 'POST', testData.valid);
  
  console.log('📤 Payload enviado:', testData.valid);
  console.log('📥 Status:', result.status);
  console.log('📥 Resposta:', result.data);
  
  if (result.ok) {
    console.log('✅ Teste com payload válido passou');
    return true;
  } else {
    console.log('❌ Teste com payload válido falhou');
    return false;
  }
}

/**
 * Teste 3: Payload Mínimo
 */
async function testMinimalPayload() {
  console.log('\n3. 📦 TESTE COM PAYLOAD MÍNIMO');
  console.log('-'.repeat(30));
  
  const result = await makeRequest(WEBHOOK_URL, 'POST', testData.minimal);
  
  console.log('📤 Payload enviado:', testData.minimal);
  console.log('📥 Status:', result.status);
  console.log('📥 Resposta:', result.data);
  
  if (result.ok) {
    console.log('✅ Teste com payload mínimo passou');
    return true;
  } else {
    console.log('❌ Teste com payload mínimo falhou');
    return false;
  }
}

/**
 * Teste 4: Payload Inválido
 */
async function testInvalidPayload() {
  console.log('\n4. ❌ TESTE COM PAYLOAD INVÁLIDO');
  console.log('-'.repeat(30));
  
  const result = await makeRequest(WEBHOOK_URL, 'POST', testData.invalid);
  
  console.log('📤 Payload enviado:', testData.invalid);
  console.log('📥 Status:', result.status);
  console.log('📥 Resposta:', result.data);
  
  if (result.status === 400) {
    console.log('✅ Teste com payload inválido passou (retornou erro esperado)');
    return true;
  } else {
    console.log('❌ Teste com payload inválido falhou (deveria retornar 400)');
    return false;
  }
}

/**
 * Teste 5: Teste de Performance
 */
async function testPerformance() {
  console.log('\n5. ⚡ TESTE DE PERFORMANCE');
  console.log('-'.repeat(30));
  
  const iterations = 5;
  const times = [];
  
  for (let i = 1; i <= iterations; i++) {
    const start = Date.now();
    
    const testPayload = {
      ...testData.valid,
      messageId: `performance-test-${i}-${Date.now()}`,
      responseText: `Teste de performance #${i}`
    };
    
    const result = await makeRequest(WEBHOOK_URL, 'POST', testPayload);
    
    const duration = Date.now() - start;
    times.push(duration);
    
    console.log(`📊 Teste ${i}/${iterations}: ${duration}ms - ${result.ok ? '✅' : '❌'}`);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  
  console.log(`📈 Tempo médio: ${avgTime.toFixed(2)}ms`);
  console.log(`📈 Tempo máximo: ${maxTime}ms`);
  console.log(`📈 Tempo mínimo: ${minTime}ms`);
  
  if (avgTime < 1000) {
    console.log('✅ Performance adequada (< 1s)');
    return true;
  } else {
    console.log('⚠️ Performance lenta (> 1s)');
    return false;
  }
}

/**
 * Teste 6: Teste de Produção (se disponível)
 */
async function testProduction() {
  console.log('\n6. 🌐 TESTE DE PRODUÇÃO');
  console.log('-'.repeat(30));
  
  // Teste apenas health check em produção
  const result = await makeRequest(PRODUCTION_URL, 'GET');
  
  if (result.ok) {
    console.log('✅ Webhook de produção acessível');
    console.log('📊 Resposta:', result.data);
    return true;
  } else {
    console.log('❌ Webhook de produção não acessível');
    console.log('❌ Status:', result.status);
    console.log('❌ Erro:', result.error || result.data);
    return false;
  }
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log(`🎯 Testando webhook: ${WEBHOOK_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Payload Válido', fn: testValidPayload },
    { name: 'Payload Mínimo', fn: testMinimalPayload },
    { name: 'Payload Inválido', fn: testInvalidPayload },
    { name: 'Performance', fn: testPerformance },
    { name: 'Produção', fn: testProduction }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
    } catch (error) {
      console.log(`💥 Erro no teste ${test.name}:`, error.message);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }
  
  // Relatório final
  console.log('\n' + '='.repeat(50));
  console.log('📋 RELATÓRIO FINAL');
  console.log('='.repeat(50));
  
  let passedCount = 0;
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   💥 Erro: ${result.error}`);
    }
    if (result.passed) passedCount++;
  });
  
  console.log('\n📊 RESUMO:');
  console.log(`✅ Testes aprovados: ${passedCount}/${results.length}`);
  console.log(`❌ Testes falharam: ${results.length - passedCount}/${results.length}`);
  console.log(`📈 Taxa de sucesso: ${((passedCount / results.length) * 100).toFixed(1)}%`);
  
  if (passedCount === results.length) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Webhook funcionando perfeitamente.');
  } else {
    console.log('\n⚠️ ALGUNS TESTES FALHARAM. Verifique os erros acima.');
  }
  
  return passedCount === results.length;
}

// Executar testes se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('💥 Erro fatal nos testes:', error);
    process.exit(1);
  });
}

export { runAllTests, testHealthCheck, testValidPayload };
