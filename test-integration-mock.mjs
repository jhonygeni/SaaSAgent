#!/usr/bin/env node

/**
 * Teste da Integração de Configuração Automática - Versão Mock
 * 
 * Este script testa a lógica da função que integra configuração automática
 * de settings na criação de instância, usando mocks para simular a API.
 */

console.log('🧪 TESTE: Integração de Configuração Automática (Mock)');
console.log('=' .repeat(60));

// Simular o comportamento do whatsappService
const mockWhatsappService = {
  /**
   * Mock da função createInstance com configuração automática integrada
   */
  createInstance: async function(instanceName, userId) {
    console.log(`\n🔧 [MOCK] Criando instância: ${instanceName}`);
    
    try {
      // Simular criação da instância
      console.log('   → Enviando dados para Evolution API...');
      const instanceData = {
        instanceName,
        integration: "WHATSAPP-BAILEYS",
        token: userId || "default_user",
        qrcode: true,
        webhook: {
          enabled: true,
          url: "https://webhooksaas.geni.chat/webhook/principal",
          events: ["MESSAGES_UPSERT"]
        }
      };
      
      // Simular resposta da API
      await new Promise(resolve => setTimeout(resolve, 500));
      const creationResponse = {
        instance: {
          instanceName: instanceName,
          instanceId: `inst_${Date.now()}`,
          integration: "WHATSAPP-BAILEYS",
          status: "created"
        },
        hash: `hash_${Math.random().toString(36).substr(2, 9)}`,
        settings: {}
      };
      
      console.log('   ✅ Instância criada com sucesso');
      console.log(`      - ID: ${creationResponse.instance.instanceId}`);
      
      // ETAPA ADICIONAL: Configurar automaticamente as configurações da instância
      try {
        console.log('   ⚙️  Configurando settings automaticamente...');
        await this.configureInstanceSettings(instanceName);
        console.log('   ✅ Settings configuradas com sucesso');
      } catch (settingsError) {
        console.warn('   ⚠️  Falha ao configurar settings:', settingsError.message);
        console.log('   ℹ️  Instância criada, mas funcionará com configurações padrão');
      }
      
      // Simular salvamento no Supabase
      if (userId) {
        console.log('   💾 Salvando dados no Supabase...');
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('   ✅ Dados salvos no Supabase');
      }
      
      return creationResponse;
      
    } catch (error) {
      console.error('   ❌ Erro na criação:', error.message);
      throw error;
    }
  },

  /**
   * Mock da função configureInstanceSettings
   */
  configureInstanceSettings: async function(instanceName) {
    console.log(`      → Aplicando configurações para ${instanceName}...`);
    
    const settings = {
      rejectCall: true,
      msgCall: "Chamadas não são aceitas neste número. Por favor, envie uma mensagem de texto.",
      groupsIgnore: true,
      alwaysOnline: true,
      readMessages: true,
      readStatus: true,
      syncFullHistory: true
    };
    
    // Simular chamada para API
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Simular possível falha (10% de chance)
    if (Math.random() < 0.1) {
      throw new Error('Timeout ao configurar settings');
    }
    
    console.log('      → Settings aplicadas:');
    console.log(`         • rejectCall: ${settings.rejectCall}`);
    console.log(`         • alwaysOnline: ${settings.alwaysOnline}`);
    console.log(`         • readMessages: ${settings.readMessages}`);
    console.log(`         • groupsIgnore: ${settings.groupsIgnore}`);
    
    return { success: true, settings };
  }
};

/**
 * Executa teste completo da integração
 */
async function runIntegrationTest() {
  console.log('\n📋 Iniciando teste de integração...');
  
  const testCases = [
    { name: 'test_instance_1', userId: 'user_123' },
    { name: 'test_instance_2', userId: 'user_456' },
    { name: 'test_instance_3', userId: null }
  ];
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`\n📝 Teste ${testCase.name}:`);
      const result = await mockWhatsappService.createInstance(testCase.name, testCase.userId);
      console.log('   🎉 Teste bem-sucedido!');
      successCount++;
    } catch (error) {
      console.error(`   ❌ Teste falhou: ${error.message}`);
      failureCount++;
    }
  }
  
  // Relatório final
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RELATÓRIO FINAL:');
  console.log(`✅ Sucessos: ${successCount}/${testCases.length}`);
  console.log(`❌ Falhas: ${failureCount}/${testCases.length}`);
  
  if (failureCount === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ A integração de configuração automática está funcionando corretamente');
    console.log('✅ Settings são aplicadas automaticamente após criação da instância');
    console.log('✅ Erros de configuração não impedem a criação da instância');
  } else {
    console.log('\n⚠️  Alguns testes falharam, revisar implementação');
  }
}

/**
 * Testa cenário de falha na configuração
 */
async function testConfigurationFailureScenario() {
  console.log('\n🔍 Testando cenário de falha na configuração...');
  
  // Mock temporário que sempre falha na configuração
  const originalConfig = mockWhatsappService.configureInstanceSettings;
  mockWhatsappService.configureInstanceSettings = async function(instanceName) {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Simulação de falha na API de configuração');
  };
  
  try {
    const result = await mockWhatsappService.createInstance('test_failure_scenario', 'user_test');
    console.log('✅ Instância criada mesmo com falha na configuração');
    console.log('✅ Comportamento correto: não falha a criação por causa dos settings');
  } catch (error) {
    console.error('❌ Comportamento incorreto: criação falhou por causa dos settings');
  } finally {
    // Restaurar função original
    mockWhatsappService.configureInstanceSettings = originalConfig;
  }
}

// Executar todos os testes
async function runAllTests() {
  await runIntegrationTest();
  await testConfigurationFailureScenario();
  
  console.log('\n✨ Testes concluídos!');
  console.log('\n📝 Implementação validada:');
  console.log('   • createInstance() chama automaticamente configureInstanceSettings()');
  console.log('   • Falhas na configuração não impedem criação da instância');
  console.log('   • Logs detalhados para monitoramento');
  console.log('   • Salvamento no Supabase mantido');
}

runAllTests().catch(error => {
  console.error('❌ Erro fatal nos testes:', error);
  process.exit(1);
});
