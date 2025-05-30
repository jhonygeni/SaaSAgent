#!/usr/bin/env node

/**
 * Script para testar a conectividade com a Evolution API
 * Testa especificamente o endpoint fetchInstances que está falhando na validação
 */

const EVOLUTION_API_URL = 'https://cloudsaas.geni.chat';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';

console.log('🔍 Testando conectividade com Evolution API...');
console.log(`📡 URL da API: ${EVOLUTION_API_URL}`);
console.log(`🔑 API Key configurada: ${EVOLUTION_API_KEY ? 'SIM (primeiros 10 chars: ' + EVOLUTION_API_KEY.substring(0, 10) + '...)' : 'NÃO'}`);

async function testEvolutionAPI() {
  const endpoints = [
    '/instance/fetchInstances',
    '/instance',
    '/'
  ];

  for (const endpoint of endpoints) {
    const url = `${EVOLUTION_API_URL}${endpoint}`;
    console.log(`\n🚀 Testando endpoint: ${url}`);
    
    try {
      // Teste com headers diferentes
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      // Adicionar autenticação se disponível
      if (EVOLUTION_API_KEY) {
        // Tentar ambos os formatos
        headers['apikey'] = EVOLUTION_API_KEY;
        headers['Authorization'] = `Bearer ${EVOLUTION_API_KEY}`;
      }

      console.log('📋 Headers enviados:', Object.keys(headers));

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log(`📄 Response body (primeiros 500 chars):`, responseText.substring(0, 500));

      if (response.ok) {
        try {
          const jsonData = JSON.parse(responseText);
          console.log('✅ Resposta JSON válida:', jsonData);
        } catch (e) {
          console.log('⚠️ Resposta não é JSON válido');
        }
      } else {
        console.log(`❌ Erro ${response.status}:`, responseText);
      }

    } catch (error) {
      console.log(`💥 Erro de rede:`, error.message);
    }
  }
}

// Teste também verificação de saúde básica
async function testBasicConnectivity() {
  console.log('\n🏥 Testando conectividade básica...');
  
  try {
    const response = await fetch(EVOLUTION_API_URL, {
      method: 'HEAD',
      timeout: 5000
    });
    console.log(`✅ Servidor responde: ${response.status}`);
  } catch (error) {
    console.log(`❌ Servidor não responde:`, error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('════════════════════════════════════════');
  console.log('🧪 TESTE DE CONECTIVIDADE EVOLUTION API');
  console.log('════════════════════════════════════════');

  await testBasicConnectivity();
  await testEvolutionAPI();

  console.log('\n════════════════════════════════════════');
  console.log('✅ Testes concluídos!');
  console.log('════════════════════════════════════════');
}

runTests().catch(console.error);
