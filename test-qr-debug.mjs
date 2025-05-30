#!/usr/bin/env node

/**
 * Script para testar diretamente a API do Evolution e debug do QR code
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ler variáveis de ambiente do .env
let EVOLUTION_API_URL = '';
let EVOLUTION_API_KEY = '';

try {
  const envPath = join(__dirname, '.env.save');
  const envContent = readFileSync(envPath, 'utf8');
  
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('EVOLUTION_API_URL=')) {
      EVOLUTION_API_URL = line.split('=')[1].trim().replace(/['"]/g, '');
    }
    if (line.startsWith('EVOLUTION_API_KEY=')) {
      EVOLUTION_API_KEY = line.split('=')[1].trim().replace(/['"]/g, '');
    }
  }
} catch (error) {
  console.error('Erro ao ler .env.save:', error.message);
  process.exit(1);
}

if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
  console.error('EVOLUTION_API_URL ou EVOLUTION_API_KEY não encontrados no .env');
  process.exit(1);
}

console.log('🔍 Testando API Evolution para debug do QR code...');
console.log('📍 URL:', EVOLUTION_API_URL);
console.log('🔑 API Key:', EVOLUTION_API_KEY.substring(0, 10) + '...');

// Função para testar endpoints
async function testEndpoint(endpoint, description) {
  console.log(`\n🧪 Testando: ${description}`);
  console.log(`📡 Endpoint: ${endpoint}`);
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resposta:', JSON.stringify(data, null, 2));
      return data;
    } else {
      const errorText = await response.text();
      console.log('❌ Erro:', errorText);
      return null;
    }
  } catch (error) {
    console.log('💥 Erro de conexão:', error.message);
    return null;
  }
}

// Função para criar instância de teste
async function createTestInstance() {
  const instanceName = `test_${Date.now()}`;
  console.log(`\n🏗️ Criando instância de teste: ${instanceName}`);
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true
      })
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Instância criada:', JSON.stringify(data, null, 2));
      return instanceName;
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao criar instância:', errorText);
      return null;
    }
  } catch (error) {
    console.log('💥 Erro de conexão:', error.message);
    return null;
  }
}

// Função para obter QR code
async function getQrCode(instanceName) {
  console.log(`\n🔳 Obtendo QR code para: ${instanceName}`);
  
  const endpoints = [
    `/instance/connect/${instanceName}`,
    `/instance/qrcode/${instanceName}`,
    `/instance/${instanceName}/qrcode`
  ];
  
  for (const endpoint of endpoints) {
    const data = await testEndpoint(endpoint, `QR Code - ${endpoint}`);
    if (data && (data.qrcode || data.base64 || data.code || data.qr)) {
      console.log('🎯 QR code encontrado!');
      return data;
    }
  }
  
  console.log('❌ Nenhum QR code encontrado em todos os endpoints testados');
  return null;
}

// Função principal
async function main() {
  try {
    // 1. Testar saúde da API
    await testEndpoint('', 'Saúde da API (root)');
    
    // 2. Listar instâncias existentes
    const instances = await testEndpoint('/instance/fetchInstances', 'Listar instâncias');
    
    // 3. Se há instâncias, testar QR code em uma existente
    if (instances && instances.length > 0) {
      const existingInstance = instances[0].instance?.instanceName || instances[0].instanceName;
      if (existingInstance) {
        console.log(`\n🔍 Testando QR code em instância existente: ${existingInstance}`);
        await getQrCode(existingInstance);
      }
    }
    
    // 4. Criar nova instância de teste
    const testInstance = await createTestInstance();
    if (testInstance) {
      // Esperar um pouco para a instância se inicializar
      console.log('\n⏳ Aguardando 3 segundos para inicialização...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Obter QR code da nova instância
      await getQrCode(testInstance);
      
      // Cleanup - deletar instância de teste
      console.log(`\n🗑️ Limpando instância de teste: ${testInstance}`);
      await testEndpoint(`/instance/delete/${testInstance}`, 'Deletar instância de teste');
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

main();
