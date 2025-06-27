// Script para ajudar a encontrar a API key correta
console.log('🔍 Como encontrar sua API key da Evolution API:');
console.log('');
console.log('1. 📋 Acesse seu painel da Evolution API');
console.log('2. 🔑 Vá para "Configurações" ou "Settings"');
console.log('3. 🎯 Procure por "API Key" ou "Global Key"');
console.log('4. 📝 Copie a chave que está configurada');
console.log('');
console.log('🎯 Testando com a instância real: inst_mcdgmk29_alu6eo');
console.log('');

// Função para testar a API key
async function testApiKey(apiKey) {
  if (!apiKey) {
    console.log('❌ API key não fornecida');
    return;
  }

  try {
    console.log(`🧪 Testando API key: ${apiKey.substring(0, 8)}...`);
    
    const response = await fetch('https://evo.geni.chat/instance/fetchInstances', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      }
    });

    console.log(`📊 Status da resposta: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key válida!');
      console.log('📋 Instâncias encontradas:', data.length || 0);
      
      // Verificar se a instância específica existe
      const targetInstance = data.find(inst => inst.instance?.instanceName === 'inst_mcdgmk29_alu6eo');
      if (targetInstance) {
        console.log('🎯 Instância inst_mcdgmk29_alu6eo encontrada!');
        console.log('📄 Estado:', targetInstance.instance?.state || 'unknown');
      } else {
        console.log('⚠️ Instância inst_mcdgmk29_alu6eo não encontrada na lista');
        console.log('📋 Instâncias disponíveis:');
        data.forEach(inst => {
          console.log(`   - ${inst.instance?.instanceName || 'unnamed'} (${inst.instance?.state || 'unknown'})`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API key inválida ou erro na API');
      console.log('📄 Resposta:', errorText);
    }
  } catch (error) {
    console.log('💥 Erro na requisição:', error.message);
  }
}

// Função para testar webhook específico
async function testWebhookFind(apiKey, instanceName) {
  if (!apiKey) {
    console.log('❌ API key não fornecida');
    return;
  }

  try {
    console.log(`\n🔍 Verificando webhook da instância: ${instanceName}`);
    
    const response = await fetch(`https://evo.geni.chat/webhook/find/${instanceName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      }
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Webhook encontrado:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao buscar webhook:', errorText);
    }
  } catch (error) {
    console.log('💥 Erro:', error.message);
  }
}

// Função para testar desabilitar webhook
async function testWebhookDisable(apiKey, instanceName) {
  if (!apiKey) {
    console.log('❌ API key não fornecida');
    return;
  }

  try {
    console.log(`\n🚫 Tentando desabilitar webhook da instância: ${instanceName}`);
    
    const response = await fetch(`https://evo.geni.chat/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify({
        url: "",
        webhook_by_events: false,
        webhook_base64: false,
        events: []
      })
    });

    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Webhook desabilitado com sucesso:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao desabilitar webhook:', errorText);
      
      if (response.status === 401) {
        console.log('🔑 Erro de autenticação - API key pode estar incorreta');
      } else if (response.status === 404) {
        console.log('🔍 Instância não encontrada');
      } else if (response.status >= 500) {
        console.log('🚨 Erro do servidor Evolution API');
      }
    }
  } catch (error) {
    console.log('💥 Erro:', error.message);
  }
}

// Exportar funções para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testApiKey,
    testWebhookFind,
    testWebhookDisable
  };
}

// Se for executado diretamente no navegador/Node
if (typeof window !== 'undefined') {
  window.testApiKey = testApiKey;
  window.testWebhookFind = testWebhookFind;
  window.testWebhookDisable = testWebhookDisable;
}

console.log('');
console.log('💡 Para testar, use:');
console.log('   testApiKey("SUA_API_KEY_AQUI")');
console.log('   testWebhookFind("SUA_API_KEY_AQUI", "inst_mcdgmk29_alu6eo")');
console.log('   testWebhookDisable("SUA_API_KEY_AQUI", "inst_mcdgmk29_alu6eo")');
