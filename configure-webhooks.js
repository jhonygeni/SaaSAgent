/**
 * Script para configurar webhook nas instâncias da Evolution API
 * Execute após criar/conectar uma instância do WhatsApp
 */

const EVOLUTION_API_URL = 'https://cloudsaas.geni.chat';
const EVOLUTION_API_KEY = 'a01d49df66f0b9d8f368d3788a32aea8';
const WEBHOOK_URL = 'https://webhooksaas.geni.chat/webhook/principal';

/**
 * Configura webhook para uma instância específica
 */
async function configurarWebhook(instanceName) {
  console.log(`🔧 Configurando webhook para instância: ${instanceName}`);
  
  const webhookConfig = {
    url: WEBHOOK_URL,
    webhook_by_events: false,
    webhook_base64: false,
    events: [
      "MESSAGE_UPSERT",
      "MESSAGES_SET",
      "MESSAGE_UPDATE"
    ]
  };

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify(webhookConfig)
    });

    const result = await response.text();
    
    if (response.ok) {
      console.log(`✅ Webhook configurado com sucesso para ${instanceName}`);
      console.log('Resposta:', result);
    } else {
      console.error(`❌ Erro ao configurar webhook para ${instanceName}`);
      console.error('Status:', response.status);
      console.error('Resposta:', result);
    }
    
    return response.ok;
  } catch (error) {
    console.error(`❌ Erro na requisição para ${instanceName}:`, error.message);
    return false;
  }
}

/**
 * Lista todas as instâncias disponíveis
 */
async function listarInstancias() {
  console.log('📋 Listando instâncias disponíveis...');
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (response.ok) {
      const instances = await response.json();
      console.log('Instâncias encontradas:', instances);
      return instances;
    } else {
      console.error('Erro ao listar instâncias:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Erro na requisição:', error.message);
    return [];
  }
}

/**
 * Verifica webhook atual de uma instância
 */
async function verificarWebhook(instanceName) {
  console.log(`🔍 Verificando webhook atual para: ${instanceName}`);
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/find/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });

    if (response.ok) {
      const webhookInfo = await response.json();
      console.log(`Webhook atual para ${instanceName}:`, webhookInfo);
      return webhookInfo;
    } else {
      console.error(`Erro ao verificar webhook para ${instanceName}:`, response.status);
      return null;
    }
  } catch (error) {
    console.error('Erro na requisição:', error.message);
    return null;
  }
}

// Exemplo de uso
async function main() {
  console.log('🚀 Configurador de Webhook Evolution API');
  console.log('==========================================');
  
  // 1. Listar instâncias
  const instances = await listarInstancias();
  
  if (instances.length === 0) {
    console.log('❌ Nenhuma instância encontrada');
    return;
  }
  
  // 2. Configurar webhook para cada instância
  for (const instance of instances) {
    const instanceName = instance.instance?.instanceName || instance.instanceName;
    
    if (instanceName) {
      await verificarWebhook(instanceName);
      await configurarWebhook(instanceName);
      console.log('---');
    }
  }
  
  console.log('✅ Configuração de webhooks concluída!');
}

// Executar se chamado diretamente
if (typeof window === 'undefined') {
  main().catch(console.error);
}

// Exportar funções para uso externo
if (typeof module !== 'undefined') {
  module.exports = {
    configurarWebhook,
    listarInstancias,
    verificarWebhook
  };
}
