#!/usr/bin/env node

/**
 * Script para testar configuração e validação de nome de instância
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para carregar .env.local
function loadEnvLocal() {
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ Arquivo .env.local não encontrado');
    return {};
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      envVars[key.trim()] = value.trim();
      process.env[key.trim()] = value.trim();
    }
  });

  return envVars;
}

// Carregar variáveis
const envVars = loadEnvLocal();

console.log('🔍 TESTE DE CONFIGURAÇÃO E API');
console.log('═══════════════════════════════');

// Mostrar configurações importantes
console.log('\n📋 VARIÁVEIS DE AMBIENTE:');
console.log(`VITE_EVOLUTION_API_URL: ${envVars.VITE_EVOLUTION_API_URL || 'NÃO DEFINIDA'}`);
console.log(`VITE_EVOLUTION_API_KEY: ${envVars.VITE_EVOLUTION_API_KEY ? 'SIM (' + envVars.VITE_EVOLUTION_API_KEY.substring(0, 10) + '...)' : 'NÃO DEFINIDA'}`);
console.log(`EVOLUTION_API_URL: ${envVars.EVOLUTION_API_URL || 'NÃO DEFINIDA'}`);
console.log(`EVOLUTION_API_KEY: ${envVars.EVOLUTION_API_KEY ? 'SIM (' + envVars.EVOLUTION_API_KEY.substring(0, 10) + '...)' : 'NÃO DEFINIDA'}`);

// Teste da API
async function testAPI() {
  const apiUrl = envVars.EVOLUTION_API_URL || envVars.VITE_EVOLUTION_API_URL;
  const apiKey = envVars.EVOLUTION_API_KEY || envVars.VITE_EVOLUTION_API_KEY;

  if (!apiUrl || !apiKey) {
    console.log('\n❌ URL ou API Key não configuradas');
    return false;
  }

  console.log('\n🧪 TESTANDO API EVOLUTION:');
  
  try {
    // Teste 1: Endpoint básico
    console.log('\n1️⃣ Testando endpoint básico...');
    const response1 = await fetch(apiUrl);
    console.log(`Status: ${response1.status}`);
    
    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ API respondendo:', data1.message);
    }

    // Teste 2: Endpoint de instâncias com API Key
    console.log('\n2️⃣ Testando fetchInstances...');
    const response2 = await fetch(`${apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': apiKey
      }
    });

    console.log(`Status: ${response2.status}`);
    
    if (response2.ok) {
      const data2 = await response2.json();
      console.log('✅ Instâncias encontradas:', data2.length || 0);
      if (data2.length > 0) {
        console.log('📋 Nomes existentes:', data2.map(i => i.instance?.instanceName || i.instanceName).filter(Boolean));
      }
      return data2;
    } else {
      const errorData = await response2.text();
      console.log('❌ Erro:', response2.status, errorData);
      return false;
    }

  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return false;
  }
}

// Função de validação de nome (simular frontend)
function validateInstanceName(name, existingInstances = []) {
  console.log(`\n🧪 VALIDANDO NOME: "${name}"`);
  
  // Verificar formato
  const formatRegex = /^[a-zA-Z0-9_-]+$/;
  if (!formatRegex.test(name)) {
    console.log('❌ Formato inválido (apenas letras, números, _ e -)');
    return false;
  }

  // Verificar comprimento
  if (name.length < 3 || name.length > 30) {
    console.log('❌ Comprimento inválido (deve ter entre 3-30 caracteres)');
    return false;
  }

  // Verificar se já existe
  const existingNames = existingInstances.map(i => 
    i.instance?.instanceName || i.instanceName
  ).filter(Boolean);
  
  if (existingNames.includes(name)) {
    console.log('❌ Nome já existe:', existingNames);
    return false;
  }

  console.log('✅ Nome válido!');
  return true;
}

// Executar testes
async function runTests() {
  console.log('\n🚀 INICIANDO TESTES...');
  
  // Teste API
  const instances = await testAPI();
  
  if (instances) {
    // Testes de validação
    console.log('\n🧪 TESTES DE VALIDAÇÃO:');
    validateInstanceName('teste123', instances);
    validateInstanceName('meu-agente', instances);
    validateInstanceName('pinushop', instances); // Nome que sabemos que existe
    validateInstanceName('ab', instances); // Muito curto
    validateInstanceName('nome@inválido', instances); // Caracteres inválidos
  }
}

runTests().catch(console.error);
