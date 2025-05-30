#!/usr/bin/env node

/**
 * Monitor Webhook Principal - Debug em Tempo Real
 * Monitora e exibe logs do webhook principal
 */

console.log('🔍 MONITOR WEBHOOK PRINCIPAL\n');

async function verificarStatus() {
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    console.log('✅ Webhook Status:', data.status);
    console.log('⏰ Uptime:', Math.floor(data.uptime), 'segundos');
    return true;
  } catch (error) {
    console.log('❌ Webhook offline:', error.message);
    return false;
  }
}

async function testarEndpoint() {
  try {
    const response = await fetch('http://localhost:3001/webhook/principal');
    const data = await response.json();
    console.log('✅ Endpoint:', data.webhook);
    return true;
  } catch (error) {
    console.log('❌ Endpoint erro:', error.message);
    return false;
  }
}

async function enviarTesteMensagem() {
  const testData = {
    instance: 'monitor-test',
    event: 'messages.upsert',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'monitor_' + Date.now()
      },
      message: {
        conversation: 'Teste do monitor - ' + new Date().toLocaleTimeString()
      },
      pushName: 'Monitor Sistema'
    }
  };

  try {
    const response = await fetch('http://localhost:3001/webhook/principal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('📱 Teste mensagem:', result.success ? '✅' : '❌');
    if (result.data) {
      console.log('   From:', result.data.name);
      console.log('   Message:', result.data.message.substring(0, 50));
    }
    return result.success;
  } catch (error) {
    console.log('❌ Teste falhou:', error.message);
    return false;
  }
}

async function monitorar() {
  console.log('============================================================');
  console.log('🔍 VERIFICAÇÃO COMPLETA - ' + new Date().toLocaleString());
  console.log('============================================================\n');

  const statusOk = await verificarStatus();
  const endpointOk = await testarEndpoint();
  const testeOk = await enviarTesteMensagem();

  console.log('\n============================================================');
  console.log('📊 RESUMO:');
  console.log(`🏥 Health: ${statusOk ? '✅' : '❌'}`);
  console.log(`🎯 Endpoint: ${endpointOk ? '✅' : '❌'}`);
  console.log(`📱 Processamento: ${testeOk ? '✅' : '❌'}`);
  
  const tudo = statusOk && endpointOk && testeOk;
  console.log(`🚀 Sistema: ${tudo ? '✅ OPERACIONAL' : '❌ COM PROBLEMAS'}`);
  
  if (!tudo) {
    console.log('\n⚠️ AÇÕES:');
    if (!statusOk) console.log('1. Iniciar webhook: npm run webhook:server');
    if (!endpointOk) console.log('2. Verificar logs do servidor');
    if (!testeOk) console.log('3. Verificar configuração do webhook');
  }
  
  console.log('============================================================\n');
}

// Executar monitoramento
async function iniciar() {
  await monitorar();
  
  console.log('🔄 Monitoramento contínuo iniciado (Ctrl+C para parar)');
  console.log('📋 Verificação a cada 30 segundos...\n');
  
  setInterval(async () => {
    await monitorar();
  }, 30000);
}

iniciar().catch(console.error);
