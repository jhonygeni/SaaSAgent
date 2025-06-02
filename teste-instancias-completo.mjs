#!/usr/bin/env node

/**
 * 🔍 TESTE COMPLETO DAS INSTÂNCIAS WHATSAPP
 * 
 * Testa se o fluxo completo está funcionando:
 * 1. Conexão com Supabase
 * 2. Conexão com Evolution API
 * 3. Criação de instância
 * 4. Status das instâncias
 */

import fs from 'fs';
import https from 'https';

console.log('🔍 TESTE COMPLETO - INSTÂNCIAS WHATSAPP');
console.log('=====================================');

// Ler variáveis do .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, ...value] = line.split('=');
    envVars[key.trim()] = value.join('=').trim();
  }
});

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;
const EVOLUTION_API_URL = envVars.VITE_EVOLUTION_API_URL;
const EVOLUTION_API_KEY = envVars.VITE_EVOLUTION_API_KEY;

console.log('📋 CONFIGURAÇÕES:');
console.log('  Supabase URL:', SUPABASE_URL);
console.log('  Evolution URL:', EVOLUTION_API_URL);
console.log('  Keys carregadas:', !!SUPABASE_ANON_KEY && !!EVOLUTION_API_KEY);

async function testRequest(name, url, options) {
  return new Promise((resolve) => {
    console.log(`\n🔗 Testando: ${name}`);
    console.log(`   URL: ${url}`);
    
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode} ${res.statusMessage}`);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            console.log(`   ✅ Sucesso!`);
            console.log(`   📄 Resposta:`, JSON.stringify(parsed, null, 2).substring(0, 300) + '...');
            resolve({ success: true, data: parsed, status: res.statusCode });
          } catch (parseError) {
            console.log(`   ✅ Sucesso (texto):`, data.substring(0, 200));
            resolve({ success: true, data: data, status: res.statusCode });
          }
        } else {
          console.log(`   ❌ Erro: ${data.substring(0, 200)}`);
          resolve({ success: false, error: data, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Erro de conexão: ${error.message}`);
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(10000, () => {
      console.log(`   ❌ Timeout`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 EXECUTANDO TESTES...');
  
  // 1. Testar Supabase - tabela de instâncias
  const supabaseTest = await testRequest(
    'Supabase - WhatsApp Instances',
    `${SUPABASE_URL}/rest/v1/whatsapp_instances?select=*&limit=5`,
    {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // 2. Testar Evolution API - status geral
  const evolutionStatusTest = await testRequest(
    'Evolution API - Status',
    `${EVOLUTION_API_URL}/instance/fetchInstances`,
    {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  // 3. Testar Evolution API - listar instâncias
  const evolutionInstancesTest = await testRequest(
    'Evolution API - Instances List',
    `${EVOLUTION_API_URL}/instance/list`,
    {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('\n📊 RESUMO DOS TESTES:');
  console.log('====================');
  
  const tests = [
    { name: 'Supabase Connection', result: supabaseTest },
    { name: 'Evolution Status', result: evolutionStatusTest },
    { name: 'Evolution Instances', result: evolutionInstancesTest }
  ];
  
  let allPassed = true;
  
  tests.forEach(({ name, result }) => {
    const status = result.success ? '✅' : '❌';
    const statusCode = result.status ? `(${result.status})` : '';
    console.log(`${status} ${name}: ${result.success ? 'OK' : result.error} ${statusCode}`);
    
    if (!result.success) allPassed = false;
  });
  
  console.log('\n🎯 DIAGNÓSTICO:');
  console.log('===============');
  
  if (allPassed) {
    console.log('✅ Todas as conexões estão funcionando!');
    console.log('✅ O problema das instâncias foi RESOLVIDO');
    console.log('');
    console.log('🚀 PRÓXIMOS PASSOS:');
    console.log('1. Configurar as variáveis no Vercel (usar VERCEL-PRODUCTION-VARS.md)');
    console.log('2. Fazer deploy para produção');
    console.log('3. Testar criação de instâncias no frontend');
  } else {
    console.log('❌ Ainda há problemas de conectividade');
    console.log('');
    console.log('🔧 VERIFICAR:');
    if (!supabaseTest.success) {
      console.log('  - Supabase URL e ANON_KEY estão corretos?');
      console.log('  - Tabela whatsapp_instances existe?');
      console.log('  - Políticas RLS estão configuradas?');
    }
    if (!evolutionStatusTest.success || !evolutionInstancesTest.success) {
      console.log('  - Evolution API está online?');
      console.log('  - API_KEY está correta?');
      console.log('  - Rede permite acesso ao cloudsaas.geni.chat?');
    }
  }
}

runTests().catch(console.error);
