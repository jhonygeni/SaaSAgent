#!/usr/bin/env node

/**
 * 🧪 TESTE DIRETO - Edge Function Evolution API
 * Testa especificamente a Edge Function para identificar problemas
 */

const https = require('https');

console.log('🧪 TESTANDO EDGE FUNCTION EVOLUTION API');
console.log('========================================\n');

async function testEdgeFunction() {
  console.log('📡 Fazendo chamada para Edge Function...');
  
  const data = JSON.stringify({
    endpoint: '/instance/fetchInstances',
    method: 'GET',
    data: {}
  });

  const options = {
    hostname: 'hpovwcaskorzzrpphgkc.supabase.co',
    port: 443,
    path: '/functions/v1/evolution-api',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';
      
      console.log(`📊 Status HTTP: ${res.statusCode}`);
      console.log(`📋 Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 Resposta completa:\n${responseBody}\n`);
        
        try {
          const jsonResponse = JSON.parse(responseBody);
          
          if (res.statusCode === 200) {
            console.log('✅ Edge Function está funcionando!');
            console.log('📊 Dados recebidos:', Object.keys(jsonResponse));
            resolve(true);
          } else {
            console.log('❌ Edge Function retornou erro');
            console.log('🔍 Erro:', jsonResponse);
            resolve(false);
          }
        } catch (error) {
          console.log('❌ Resposta não é JSON válido');
          console.log('🔍 Texto bruto:', responseBody);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('💥 Erro na requisição:', error.message);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// Executar teste
testEdgeFunction().then(success => {
  console.log('\n🎯 RESULTADO:');
  console.log('=============');
  
  if (success) {
    console.log('✅ EDGE FUNCTION FUNCIONANDO');
    console.log('🚀 Pronto para deploy na Vercel!');
  } else {
    console.log('❌ EDGE FUNCTION COM PROBLEMAS');
    console.log('🔧 Necessário corrigir antes do deploy');
  }
  
  console.log('\n' + '='.repeat(40));
}).catch(console.error);
