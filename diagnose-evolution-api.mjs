#!/usr/bin/env node

/**
 * Ferramenta de diagnóstico para a Evolution API
 * 
 * Este script testa a conectividade com a API Evolution e
 * valida se a criação de instâncias e geração de QR code está funcionando.
 * 
 * Uso:
 *   node diagnose-evolution-api.mjs [API_URL] [API_KEY]
 * 
 * Se API_URL e API_KEY não forem fornecidos, o script tentará lê-los
 * do arquivo .env.local
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Configuração inicial
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lê argumentos da linha de comando
let API_URL = process.argv[2];
let API_KEY = process.argv[3];

// Se não houver argumentos, tenta ler do arquivo .env.local
if (!API_URL || !API_KEY) {
  const envPath = join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = envContent
      .split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .reduce((acc, line) => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length) {
          acc[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
        return acc;
      }, {});
    
    API_URL = API_URL || envVars.VITE_EVOLUTION_API_URL;
    API_KEY = API_KEY || envVars.VITE_EVOLUTION_API_KEY;
  }
}

if (!API_URL || !API_KEY) {
  console.error('❌ URL da API ou Chave da API não fornecidos.');
  console.error('Use: node diagnose-evolution-api.mjs [API_URL] [API_KEY]');
  console.error('Ou defina VITE_EVOLUTION_API_URL e VITE_EVOLUTION_API_KEY no arquivo .env.local');
  process.exit(1);
}

// Função principal
async function diagnoseEvolutionApi() {
  console.log('🔍 Diagnóstico da Evolution API');
  console.log('==============================');
  console.log('URL da API:', API_URL);
  console.log('Chave da API:', API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'INVÁLIDA');
  console.log('\n');
  
  try {
    // Passo 1: Testar conectividade com os diferentes métodos de autenticação
    console.log('1. Testando métodos de autenticação...');
    
    const authMethods = [
      { name: 'apikey (minúsculo)', headers: { 'apikey': API_KEY } },
      { name: 'apiKey (capitalizado)', headers: { 'apiKey': API_KEY } },
      { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${API_KEY}` } }
    ];
    
    let workingMethod = null;
    let instances = [];
    
    for (const method of authMethods) {
      try {
        console.log(`\nTentando ${method.name}...`);
        console.log(`GET ${API_URL}/instance/fetchInstances`);
        
        const response = await fetch(`${API_URL}/instance/fetchInstances`, {
          method: 'GET',
          headers: {
            ...method.headers,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          instances = await response.json();
          console.log(`✅ SUCESSO com "${method.name}" - ${instances.length} instâncias encontradas`);
          workingMethod = method;
          break;
        } else {
          const text = await response.text();
          console.log(`❌ FALHA com "${method.name}": ${response.status} ${response.statusText}`);
          console.log(`   Resposta: ${text}`);
        }
      } catch (error) {
        console.log(`❌ ERRO com "${method.name}": ${error.message}`);
      }
    }
    
    if (!workingMethod) {
      throw new Error('Todos os métodos de autenticação falharam. A API pode estar inativa ou as credenciais podem estar incorretas.');
    }
    
    console.log(`\n✅ Método de autenticação funcional encontrado: ${workingMethod.name}`);
    
    // Criar uma instância de teste
    const testInstanceName = `test_${Date.now().toString(36)}`;
    
    console.log(`\n2. Criando instância de teste: ${testInstanceName}...`);
    
    try {
      // Criação da instância
      const createResponse = await fetch(`${API_URL}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...workingMethod.headers
        },
        body: JSON.stringify({
          instanceName: testInstanceName,
          integration: "WHATSAPP-BAILEYS",
          token: "test_user",
          qrcode: true,
          webhook: {
            enabled: true,
            url: "https://webhooksaas.geni.chat/webhook/principal",
            events: ["MESSAGES_UPSERT"]
          }
        })
      });
      
      if (!createResponse.ok) {
        const text = await createResponse.text();
        console.log(`❌ Falha na criação da instância: ${createResponse.status} ${createResponse.statusText}`);
        console.log(`   Resposta: ${text}`);
        throw new Error('Falha na criação da instância');
      }
      
      console.log('✅ Instância criada com sucesso');
      
      // Geração do QR code
      console.log(`\n3. Gerando QR code para ${testInstanceName}...`);
      
      const qrResponse = await fetch(`${API_URL}/instance/connect/${testInstanceName}`, {
        method: 'GET',
        headers: {
          ...workingMethod.headers
        }
      });
      
      if (!qrResponse.ok) {
        const text = await qrResponse.text();
        console.log(`❌ Falha na geração do QR code: ${qrResponse.status} ${qrResponse.statusText}`);
        console.log(`   Resposta: ${text}`);
        throw new Error('Falha na geração do QR code');
      }
      
      const qrData = await qrResponse.json();
      const qrCode = qrData.qrcode || qrData.base64 || qrData.code;
      
      if (qrCode) {
        console.log('✅ QR code gerado com sucesso!');
        console.log(`QR code (amostra): ${qrCode.substring(0, 100)}...`);
      } else {
        console.log('❌ QR code não encontrado na resposta');
        console.log('Resposta:', qrData);
      }
      
      // Limpeza - deletar a instância de teste
      console.log(`\n4. Limpando: Deletando instância de teste ${testInstanceName}...`);
      
      const deleteResponse = await fetch(`${API_URL}/instance/delete/${testInstanceName}`, {
        method: 'DELETE',
        headers: {
          ...workingMethod.headers
        }
      });
      
      if (deleteResponse.ok) {
        console.log(`✅ Instância de teste ${testInstanceName} deletada com sucesso`);
      } else {
        const text = await deleteResponse.text();
        console.log(`⚠️ Falha ao deletar instância de teste: ${deleteResponse.status} ${deleteResponse.statusText}`);
        console.log(`   Resposta: ${text}`);
      }
      
    } catch (error) {
      console.error(`❌ Erro durante os testes: ${error.message}`);
    }
    
    console.log('\n📋 Resumo do diagnóstico:');
    console.log('- API URL: ' + (API_URL ? '✅ Válida' : '❌ Inválida'));
    console.log('- API Key: ' + (API_KEY ? '✅ Fornecida' : '❌ Ausente'));
    console.log('- Autenticação: ' + (workingMethod ? `✅ Funcional (${workingMethod.name})` : '❌ Falhou'));
    console.log('- Criação/QR Code: ' + (qrResponse?.ok ? '✅ Funcional' : '❌ Com problemas'));
    
    if (workingMethod) {
      console.log('\n🔧 Recomendação para o frontend:');
      console.log('Use este cabeçalho de autenticação:');
      console.log(JSON.stringify(workingMethod.headers, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Diagnóstico falhou:', error.message);
    process.exit(1);
  }
}

// Executar diagnóstico
diagnoseEvolutionApi();
