// Test script para verificar webhook da instância real
const EVOLUTION_API_URL = 'https://evo.geni.chat';
const API_KEY = 'B6D711FCDE4D4FD5936544120E713976';

async function testWebhook(instanceName) {
  try {
    console.log(`🔍 Verificando webhook para: ${instanceName}`);
    
    // 1. Verificar webhook atual
    const webhookResponse = await fetch(
      `${EVOLUTION_API_URL}/webhook/find/${instanceName}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        }
      }
    );
    
    if (!webhookResponse.ok) {
      console.error(`❌ Erro ao buscar webhook: ${webhookResponse.status}`);
      const errorText = await webhookResponse.text();
      console.error('Resposta:', errorText);
      return;
    }
    
    const webhookData = await webhookResponse.json();
    console.log('📋 Webhook atual:', JSON.stringify(webhookData, null, 2));
    
    // 2. Testar desabilitar webhook
    console.log('\n🚫 Testando desabilitar webhook...');
    
    const disableResponse = await fetch(
      `${EVOLUTION_API_URL}/webhook/set/${instanceName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        },
        body: JSON.stringify({
          url: "",
          webhook_by_events: false,
          webhook_base64: false,
          events: []
        })
      }
    );
    
    if (!disableResponse.ok) {
      console.error(`❌ Erro ao desabilitar webhook: ${disableResponse.status}`);
      const errorText = await disableResponse.text();
      console.error('Resposta de erro:', errorText);
      return;
    }
    
    const disableData = await disableResponse.json();
    console.log('✅ Webhook desabilitado:', JSON.stringify(disableData, null, 2));
    
    // 3. Verificar se foi desabilitado
    console.log('\n🔍 Verificando se webhook foi desabilitado...');
    
    const verifyResponse = await fetch(
      `${EVOLUTION_API_URL}/webhook/find/${instanceName}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': API_KEY
        }
      }
    );
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('📋 Webhook após desabilitar:', JSON.stringify(verifyData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Testar com a instância real
testWebhook('inst_mcdgmk29_alu6eo');
