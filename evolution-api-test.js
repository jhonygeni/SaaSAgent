/**
 * Evolution API v2 - Tester de Conexão com apikey
 * Este script verifica a conexão com a Evolution API v2 usando header apikey
 * 
 * Executar:
 *   node evolution-api-test.js
 */

// Importar módulos necessários para Node.js
const fetchModule = () => import('node-fetch').then(({ default: fetch }) => fetch);

// Constantes
const API_URL = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
const API_KEY = process.env.EVOLUTION_API_KEY || 'a01d49df66f0b9d8f368d3788a32aea8';

/**
 * Função principal para testar a conexão
 */
async function testEvolutionAPI() {
  const fetch = await fetchModule();
  console.log('🔍 Testando conexão com Evolution API v2');
  console.log(`🌐 URL: ${API_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}`);
  
  try {
    // Testando a conexão com header apikey (CORRETO)
    console.log('\n🔄 Testando cabeçalho apikey (formato correto):');
    const responseApiKey = await fetch(`${API_URL}/instance/fetchInstances`, {
      headers: {
        'apikey': API_KEY,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${responseApiKey.status} ${responseApiKey.statusText}`);
    
    if (responseApiKey.ok) {
      const data = await responseApiKey.json();
      console.log('✅ Sucesso! Conexão com apikey funcionando corretamente.');
      console.log(`📱 Instâncias encontradas: ${Array.isArray(data) ? data.length : 'Formato de resposta não é um array'}`);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('\n📋 Primeiras instâncias:');
        data.slice(0, 3).forEach((instance, index) => {
          console.log(`   ${index + 1}. ${instance?.instance?.instanceName || 'Nome não disponível'} - Status: ${instance?.instance?.status || 'desconhecido'}`);
        });
      }
    } else {
      console.log('❌ Falha na conexão com header apikey.');
      console.log(await responseApiKey.text());
    }
    
    // Teste de comparação com formato Authorization: Bearer (INCORRETO)
    console.log('\n🔄 Testando cabeçalho Authorization: Bearer (formato INCORRETO):');
    const responseBearerAuth = await fetch(`${API_URL}/instance/fetchInstances`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${responseBearerAuth.status} ${responseBearerAuth.statusText}`);
    
    if (responseBearerAuth.ok) {
      console.log('⚠️ Inesperado! Authorization: Bearer também funciona (não deveria).');
    } else {
      console.log('✅ Esperado! Authorization: Bearer falha com erro 401/403.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error.message);
  }
}

// Executar o teste
testEvolutionAPI().catch(console.error);
