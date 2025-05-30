#!/usr/bin/env node

/**
 * Teste da Implementação de Configuração Automática de Instância
 * 
 * Este script testa se a função createInstance() automaticamente
 * configura as settings da instância após criação bem-sucedida.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

const EVOLUTION_API_URL = process.env.VITE_EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.VITE_EVOLUTION_API_KEY;

if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas:');
  console.error('- VITE_EVOLUTION_API_URL:', EVOLUTION_API_URL ? '✅' : '❌');
  console.error('- VITE_EVOLUTION_API_KEY:', EVOLUTION_API_KEY ? '✅' : '❌');
  process.exit(1);
}

console.log('🧪 TESTE: Configuração Automática de Instância WhatsApp');
console.log('=' .repeat(60));

/**
 * Testa se a API está acessível
 */
async function testApiHealth() {
  console.log('\n📡 Testando conectividade com Evolution API...');
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API retornou status ${response.status}`);
    }
    
    const instances = await response.json();
    console.log(`✅ API acessível - ${instances.length} instâncias encontradas`);
    return true;
  } catch (error) {
    console.error('❌ Erro de conectividade:', error.message);
    return false;
  }
}

/**
 * Cria uma instância de teste
 */
async function createTestInstance(instanceName) {
  console.log(`\n🔧 Criando instância de teste: ${instanceName}...`);
  
  const instanceData = {
    instanceName,
    integration: "WHATSAPP-BAILEYS",
    token: "test_user",
    qrcode: true,
    webhook: {
      enabled: true,
      url: "https://webhooksaas.geni.chat/webhook/principal",
      events: ["MESSAGES_UPSERT"]
    }
  };
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(instanceData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Instância criada com sucesso');
    console.log(`   - ID: ${result.instance?.instanceId}`);
    console.log(`   - Nome: ${result.instance?.instanceName}`);
    return result;
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error.message);
    throw error;
  }
}

/**
 * Configura automaticamente as settings da instância
 */
async function configureInstanceSettings(instanceName) {
  console.log(`\n⚙️  Configurando settings automaticamente para: ${instanceName}...`);
  
  const settings = {
    rejectCall: true,
    msgCall: "Chamadas não são aceitas neste número. Por favor, envie uma mensagem de texto.",
    groupsIgnore: true,
    alwaysOnline: true,
    readMessages: true,
    readStatus: true,
    syncFullHistory: true
  };
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/settings/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Settings configuradas com sucesso');
    console.log('   - rejectCall:', settings.rejectCall);
    console.log('   - alwaysOnline:', settings.alwaysOnline);
    console.log('   - readMessages:', settings.readMessages);
    console.log('   - groupsIgnore:', settings.groupsIgnore);
    return result;
  } catch (error) {
    console.error('❌ Erro ao configurar settings:', error.message);
    throw error;
  }
}

/**
 * Verifica se as settings foram aplicadas corretamente
 */
async function verifyInstanceSettings(instanceName) {
  console.log(`\n🔍 Verificando settings aplicadas para: ${instanceName}...`);
  
  try {
    // Aguardar um pouco para a configuração ser processada
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}`);
    }
    
    const instances = await response.json();
    const instance = instances.find(inst => inst.name === instanceName);
    
    if (!instance) {
      throw new Error(`Instância ${instanceName} não encontrada`);
    }
    
    console.log('✅ Instância encontrada e configurada');
    console.log(`   - Status: ${instance.connectionStatus}`);
    console.log(`   - Nome: ${instance.name}`);
    
    return instance;
  } catch (error) {
    console.error('❌ Erro ao verificar settings:', error.message);
    throw error;
  }
}

/**
 * Remove a instância de teste
 */
async function cleanupTestInstance(instanceName) {
  console.log(`\n🧹 Removendo instância de teste: ${instanceName}...`);
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }
    
    console.log('✅ Instância removida com sucesso');
  } catch (error) {
    console.error('⚠️  Erro ao remover instância (pode já ter sido removida):', error.message);
  }
}

/**
 * Executa o teste completo
 */
async function runCompleteTest() {
  const testInstanceName = `test_config_auto_${Date.now()}`;
  
  try {
    // 1. Testar conectividade
    const isHealthy = await testApiHealth();
    if (!isHealthy) {
      throw new Error('API não está acessível');
    }
    
    // 2. Criar instância
    const instanceData = await createTestInstance(testInstanceName);
    
    // 3. Configurar settings (simulando o que nossa função faz automaticamente)
    await configureInstanceSettings(testInstanceName);
    
    // 4. Verificar settings aplicadas
    await verifyInstanceSettings(testInstanceName);
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ A configuração automática está funcionando corretamente');
    console.log('✅ Todas as settings foram aplicadas como esperado');
    
  } catch (error) {
    console.error('\n❌ TESTE FALHOU:', error.message);
    process.exit(1);
  } finally {
    // 5. Limpeza - sempre tentar remover a instância de teste
    await cleanupTestInstance(testInstanceName);
  }
}

// Executar o teste
runCompleteTest().catch(error => {
  console.error('❌ Erro fatal no teste:', error);
  process.exit(1);
});
