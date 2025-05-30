#!/usr/bin/env node

/**
 * Script de diagnóstico completo para o problema de validação de nomes
 * Este script identifica exatamente por que a validação está falhando
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Carregar configurações de múltiplas fontes
function loadEnvVars() {
  const envVars = {};
  const envFiles = ['.env.local', '.env.save', '.env'];
  
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      console.log(`📂 Carregando ${envFile}...`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      envContent.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const equalIndex = trimmedLine.indexOf('=');
          if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim();
            const value = trimmedLine.substring(equalIndex + 1).trim();
            if (key && value) {
              envVars[key] = value;
            }
          }
        }
      });
    }
  }
  
  return envVars;
}

const envVars = loadEnvVars();

const EVOLUTION_API_URL = envVars.VITE_EVOLUTION_API_URL || 
                           envVars.EVOLUTION_API_URL || 
                           'https://cloudsaas.geni.chat';

const EVOLUTION_API_KEY = envVars.VITE_EVOLUTION_API_KEY || 
                          envVars.EVOLUTION_API_KEY || 
                          null;

console.log('🔍 DIAGNÓSTICO COMPLETO - PROBLEMA DE VALIDAÇÃO DE NOMES');
console.log('=========================================================');

function httpRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ success: true, status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ success: false, status: res.statusCode, data: data, error: e });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
    req.end();
  });
}

async function main() {
  // 1. VERIFICAR CONFIGURAÇÕES
  console.log('\n📋 PASSO 1: VERIFICANDO CONFIGURAÇÕES');
  console.log('=====================================');
  console.log(`Evolution API URL: ${EVOLUTION_API_URL}`);
  console.log(`API Key: ${EVOLUTION_API_KEY ? `${EVOLUTION_API_KEY.substring(0, 10)}...` : '❌ NÃO ENCONTRADA'}`);
  
  if (!EVOLUTION_API_KEY) {
    console.log('\n❌ PROBLEMA IDENTIFICADO: API Key não encontrada!');
    console.log('\n🔧 SOLUÇÃO:');
    console.log('   1. Verifique se você tem uma API key válida da Evolution API');
    console.log('   2. Adicione a chave no arquivo .env.save como:');
    console.log('      EVOLUTION_API_KEY=sua_chave_aqui');
    console.log('   3. Ou configure a variável de ambiente VITE_EVOLUTION_API_KEY');
    return;
  }

  // 2. TESTAR CONECTIVIDADE COM EVOLUTION API
  console.log('\n🌐 PASSO 2: TESTANDO CONECTIVIDADE COM EVOLUTION API');
  console.log('=====================================================');
  
  const url = new URL(`${EVOLUTION_API_URL}/instance/fetchInstances`);
  const options = {
    method: 'GET',
    headers: {
      'apikey': EVOLUTION_API_KEY,
      'Content-Type': 'application/json'
    }
  };
  
  const result = await httpRequest(url, options);
  
  if (result.success && result.status === 200) {
    console.log('✅ Conexão com Evolution API funcionando!');
    console.log(`📊 Instâncias encontradas: ${result.data.length || 0}`);
    
    if (result.data.length > 0) {
      console.log('\n📋 Instâncias ativas na Evolution API:');
      result.data.forEach((instance, index) => {
        const name = instance.name || instance.instanceName || instance.id;
        console.log(`   ${index + 1}. ${name}`);
      });
    }
  } else {
    console.log(`❌ Falha na conexão: Status ${result.status}`);
    console.log(`📄 Resposta: ${JSON.stringify(result.data, null, 2)}`);
    
    if (result.status === 401) {
      console.log('\n❌ PROBLEMA IDENTIFICADO: API Key inválida (401 Unauthorized)');
      console.log('\n🔧 SOLUÇÃO:');
      console.log('   1. Verifique se sua API key está correta');
      console.log('   2. Gere uma nova API key no painel da Evolution API');
      console.log('   3. Atualize o arquivo .env.save com a nova chave');
      return;
    }
  }

  // 3. SIMULAR O PROCESSO DE VALIDAÇÃO DO SISTEMA
  console.log('\n🧪 PASSO 3: SIMULANDO VALIDAÇÃO DO SISTEMA');
  console.log('===========================================');
  
  // Simular o fluxo de validação que o sistema faz
  console.log('📝 Simulando tentativa de criar instância com nome "teste"...');
  
  // Este é o que acontece no sistema:
  // 1. validateInstanceName() é chamado
  // 2. getInstanceNames() tenta buscar da Evolution API
  // 3. Se falhar, retorna fallback: ["pinushop", "luis_souza", "assistente_virtual_imobiliria"]
  // 4. nameExists() verifica se "teste" está na lista
  
  const knownInstances = [
    { name: "pinushop" },
    { name: "luis_souza" },
    { name: "assistente_virtual_imobiliria" }
  ];
  
  if (result.success && result.status === 200) {
    console.log('✅ API acessível - usando dados reais da Evolution API');
    const realInstances = result.data || [];
    
    // Verificar se alguma instância tem nome "teste"
    const testeExists = realInstances.some(instance => {
      const name = (instance.name || instance.instanceName || '').toLowerCase();
      return name === 'teste';
    });
    
    if (testeExists) {
      console.log('❌ Nome "teste" JÁ EXISTE na Evolution API');
      console.log('   Esta é a causa do erro "nome já em uso"');
    } else {
      console.log('✅ Nome "teste" NÃO EXISTE na Evolution API');
      console.log('   O problema pode estar em registros órfãos no Supabase');
    }
  } else {
    console.log('❌ API inacessível - sistema usa fallback hardcoded');
    console.log('📋 Nomes no fallback:', knownInstances.map(i => i.name).join(', '));
    
    // Se tentar usar qualquer um destes nomes, dará erro
    const testName = 'teste';
    const fallbackExists = knownInstances.some(instance => 
      instance.name.toLowerCase() === testName.toLowerCase()
    );
    
    if (fallbackExists) {
      console.log(`❌ Nome "${testName}" está no fallback - causará erro`);
    } else {
      console.log(`✅ Nome "${testName}" NÃO está no fallback`);
      console.log('   O problema é que a API não responde e o sistema só aceita nomes do fallback');
    }
  }

  // 4. VERIFICAR REGISTROS NO SUPABASE (se possível)
  console.log('\n🗄️ PASSO 4: VERIFICANDO POSSÍVEIS REGISTROS ÓRFÃOS');
  console.log('===================================================');
  console.log('⚠️  Para verificar registros órfãos no Supabase, seria necessário:');
  console.log('   1. Acesso às credenciais do Supabase');
  console.log('   2. Query na tabela whatsapp_instances');
  console.log('   3. Comparar com instâncias ativas na Evolution API');
  
  // 5. ANÁLISE E RECOMENDAÇÕES
  console.log('\n📊 ANÁLISE FINAL E RECOMENDAÇÕES');
  console.log('=================================');
  
  if (!EVOLUTION_API_KEY) {
    console.log('🎯 CAUSA RAIZ: API Key não configurada');
    console.log('🔧 AÇÃO: Configure a API Key da Evolution API');
  } else if (result.status === 401) {
    console.log('🎯 CAUSA RAIZ: API Key inválida');
    console.log('🔧 AÇÃO: Gere uma nova API Key válida');
  } else if (!result.success) {
    console.log('🎯 CAUSA RAIZ: Evolution API inacessível');
    console.log('🔧 AÇÃO: Verifique se a Evolution API está funcionando');
  } else {
    console.log('🎯 POSSÍVEL CAUSA: Registros órfãos no banco de dados');
    console.log('🔧 AÇÃO: Limpar registros órfãos no Supabase');
  }
  
  console.log('\n💡 PRÓXIMOS PASSOS:');
  console.log('   1. Configure uma API Key válida da Evolution API');
  console.log('   2. Teste a criação de uma nova instância');
  console.log('   3. Se ainda houver problemas, limpe registros órfãos no Supabase');
  console.log('   4. Considere implementar sistema de limpeza automática');
}

main().catch(console.error);
