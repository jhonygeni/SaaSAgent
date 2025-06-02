#!/usr/bin/env node

/**
 * Script de teste completo para validar a configuração do N8N Callback
 * 
 * Este script simula diferentes cenários de uso e valida se o sistema
 * está funcionando corretamente.
 */

const https = require('https');

// Configurações
const WEBHOOK_URL = 'https://webhooksaas.geni.chat/api/webhook/n8n-callback';
const TIMEOUT = 10000;

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function colorLog(message, color = 'white') {
  console.log(colors[color] + message + colors.reset);
}

// Cenários de teste
const testCases = [
  {
    name: 'Teste Básico - Todos os Campos',
    payload: {
      instanceId: 'test-instance-123',
      instanceName: 'bot-vendas',
      phoneNumber: '5511999999999',
      responseText: 'Olá! Como posso ajudá-lo hoje?',
      originalMessageId: 'msg-abc123',
      userId: 'user-456',
      timestamp: new Date().toISOString()
    },
    expectedStatus: 200
  },
  {
    name: 'Teste Mínimo - Apenas Campos Obrigatórios',
    payload: {
      instanceId: 'test-instance-min',
      phoneNumber: '5511888888888',
      responseText: 'Resposta mínima de teste'
    },
    expectedStatus: 200
  },
  {
    name: 'Teste Erro - Campo Obrigatório Ausente',
    payload: {
      instanceId: 'test-instance-error',
      phoneNumber: '5511777777777'
      // responseText ausente intencionalmente
    },
    expectedStatus: 400
  },
  {
    name: 'Teste com Instância Inexistente',
    payload: {
      instanceId: 'instancia-que-nao-existe-12345',
      phoneNumber: '5511666666666',
      responseText: 'Teste de instância inexistente'
    },
    expectedStatus: 404
  }
];

// Função para fazer requisição HTTP
function makeRequest(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: 'webhooksaas.geni.chat',
      port: 443,
      path: '/api/webhook/n8n-callback',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: TIMEOUT
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

// Função para testar health check
function testHealthCheck() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'webhooksaas.geni.chat',
      port: 443,
      path: '/api/webhook/n8n-callback',
      method: 'GET',
      timeout: TIMEOUT
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Função principal de teste
async function runTests() {
  colorLog('\n🧪 TESTE COMPLETO DO WEBHOOK N8N CALLBACK', 'cyan');
  colorLog('=' .repeat(60), 'blue');
  
  let passedTests = 0;
  let totalTests = testCases.length + 1; // +1 para health check

  // Teste do Health Check
  colorLog('\n📡 Testando Health Check...', 'yellow');
  try {
    const healthResult = await testHealthCheck();
    
    if (healthResult.status === 200 && healthResult.data.status === 'ok') {
      colorLog('✅ Health Check: PASSOU', 'green');
      colorLog(`   Status: ${healthResult.status}`, 'white');
      colorLog(`   Response: ${JSON.stringify(healthResult.data, null, 2)}`, 'white');
      passedTests++;
    } else {
      colorLog('❌ Health Check: FALHOU', 'red');
      colorLog(`   Status: ${healthResult.status}`, 'white');
      colorLog(`   Response: ${JSON.stringify(healthResult.data, null, 2)}`, 'white');
    }
  } catch (error) {
    colorLog('❌ Health Check: ERRO', 'red');
    colorLog(`   Erro: ${error.message}`, 'red');
  }

  // Testes dos cenários
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    colorLog(`\n📋 Teste ${i + 1}: ${testCase.name}`, 'yellow');
    colorLog(`   Payload: ${JSON.stringify(testCase.payload, null, 2)}`, 'white');
    
    try {
      const result = await makeRequest(testCase.payload);
      
      const passed = result.status === testCase.expectedStatus;
      
      if (passed) {
        colorLog(`✅ Status: ${result.status} (esperado: ${testCase.expectedStatus}) - PASSOU`, 'green');
        passedTests++;
      } else {
        colorLog(`❌ Status: ${result.status} (esperado: ${testCase.expectedStatus}) - FALHOU`, 'red');
      }
      
      colorLog(`   Resposta: ${JSON.stringify(result.data, null, 2)}`, 'white');
      
      // Pausa entre testes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      colorLog(`❌ Erro na requisição: ${error.message}`, 'red');
    }
  }

  // Resumo final
  colorLog('\n📊 RESUMO DOS TESTES', 'cyan');
  colorLog('=' .repeat(60), 'blue');
  colorLog(`Total de testes: ${totalTests}`, 'white');
  colorLog(`Testes aprovados: ${passedTests}`, 'green');
  colorLog(`Testes falharam: ${totalTests - passedTests}`, 'red');
  colorLog(`Taxa de sucesso: ${Math.round((passedTests / totalTests) * 100)}%`, 'yellow');

  if (passedTests === totalTests) {
    colorLog('\n🎉 TODOS OS TESTES PASSARAM!', 'green');
    colorLog('O webhook está funcionando corretamente.', 'green');
  } else if (passedTests >= totalTests * 0.7) {
    colorLog('\n⚠️  ALGUNS TESTES FALHARAM', 'yellow');
    colorLog('Verifique a configuração e tente novamente.', 'yellow');
  } else {
    colorLog('\n🚨 MUITOS TESTES FALHARAM', 'red');
    colorLog('Há problemas sérios na configuração.', 'red');
  }

  colorLog('\n📝 PRÓXIMOS PASSOS:', 'cyan');
  
  if (passedTests >= 2) {
    colorLog('✅ Webhook básico está funcionando', 'green');
    colorLog('🔧 Configure o N8N seguindo o GUIA-CONFIGURACAO-N8N-COMPLETO.md', 'yellow');
    colorLog('🧪 Teste com mensagens reais no WhatsApp', 'yellow');
  } else {
    colorLog('❌ Webhook não está funcionando corretamente', 'red');
    colorLog('🔧 Verifique se o servidor está rodando', 'red');
    colorLog('🔧 Verifique a URL e configurações de rede', 'red');
  }

  colorLog('\n🔗 URLs para teste manual:', 'cyan');
  colorLog(`Health Check: GET ${WEBHOOK_URL}`, 'white');
  colorLog(`Callback: POST ${WEBHOOK_URL}`, 'white');
}

// Execução
if (require.main === module) {
  runTests().catch(error => {
    colorLog(`\n💥 ERRO FATAL: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTests, testHealthCheck, makeRequest };
