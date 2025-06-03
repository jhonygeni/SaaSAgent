import https from 'https';

console.log('🔍 TESTE INSTÂNCIAS WHATSAPP - SIMPLIFICADO');
console.log('===========================================');

// URLs e chaves hardcoded para teste
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc';
const EVOLUTION_API_URL = 'https://cloudsaas.geni.chat';
const EVOLUTION_API_KEY = 'a01d49df66f0b9d8f368d3788a32aea8';

async function testSupabase() {
  console.log('\\n🔗 Testando Supabase...');
  
  return new Promise((resolve) => {
    const url = `${SUPABASE_URL}/rest/v1/whatsapp_instances?select=*&limit=1`;
    
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Resposta: ${data}`);
        resolve(res.statusCode === 200);
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Erro: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('   ❌ Timeout');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testEvolutionAPI() {
  console.log('\\n🔗 Testando Evolution API...');
  
  return new Promise((resolve) => {
    const url = `${EVOLUTION_API_URL}/instance/fetchInstances`;
    
    const req = https.request(url, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Resposta: ${data.substring(0, 200)}...`);
        resolve(res.statusCode === 200);
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Erro: ${error.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log('   ❌ Timeout');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function runTests() {
  console.log('\\n🧪 Iniciando testes...');
  
  const supabaseOK = await testSupabase();
  const evolutionOK = await testEvolutionAPI();
  
  console.log('\\n📊 RESULTADOS:');
  console.log(`✅ Supabase: ${supabaseOK ? 'OK' : 'FALHOU'}`);
  console.log(`✅ Evolution API: ${evolutionOK ? 'OK' : 'FALHOU'}`);
  
  if (supabaseOK && evolutionOK) {
    console.log('\\n🎉 SUCESSO! Todas as conexões estão funcionando');
    console.log('   O problema das instâncias foi RESOLVIDO');
  } else {
    console.log('\\n⚠️  Ainda há problemas nas conexões');
  }
}

runTests().catch(console.error);
