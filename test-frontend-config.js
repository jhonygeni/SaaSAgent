import { EVOLUTION_CONFIG, FEATURE_FLAGS } from './src/config/environment.js';

console.log('🔍 TESTE DE CONFIGURAÇÃO DO FRONTEND');
console.log('═══════════════════════════════════════');

console.log('\n📋 EVOLUTION CONFIG:');
console.log('URL:', EVOLUTION_CONFIG.url);
console.log('KEY:', EVOLUTION_CONFIG.key ? `${EVOLUTION_CONFIG.key.substring(0, 10)}...` : 'NÃO DEFINIDA');

console.log('\n📋 FEATURE FLAGS:');
console.log('useMockData:', FEATURE_FLAGS.useMockData);
console.log('useBearerAuth:', FEATURE_FLAGS.useBearerAuth);

console.log('\n📋 ENVIRONMENT VARIABLES (import.meta.env):');
console.log('VITE_EVOLUTION_API_URL:', import.meta.env.VITE_EVOLUTION_API_URL);
console.log('VITE_EVOLUTION_API_KEY:', import.meta.env.VITE_EVOLUTION_API_KEY ? `${import.meta.env.VITE_EVOLUTION_API_KEY.substring(0, 10)}...` : 'NÃO DEFINIDA');

// Teste básico da API
async function testEvolutionAPI() {
  console.log('\n🧪 TESTANDO API EVOLUTION:');
  
  const url = EVOLUTION_CONFIG.url;
  const key = EVOLUTION_CONFIG.key;
  
  if (!url || !key) {
    console.log('❌ URL ou API Key não configuradas');
    return;
  }
  
  try {
    console.log('🚀 Testando fetchInstances...');
    const response = await fetch(`${url}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API funcionando!');
      console.log('Instâncias encontradas:', data.length);
      
      if (data.length > 0) {
        console.log('Nomes das instâncias:');
        data.forEach((instance, index) => {
          console.log(`  ${index + 1}. ${instance.name}`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na API:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Erro de rede:', error.message);
  }
}

testEvolutionAPI();
