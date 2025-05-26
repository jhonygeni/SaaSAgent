#!/usr/bin/env node

/**
 * Script de Teste - Webhook Principal Local
 * Testa o servidor webhook local na porta 3001
 */

// URLs de teste
const LOCAL_WEBHOOK_URL = 'http://localhost:3001/webhook/principal';

// Mock de dados da Evolution API
const mockEvolutionData = {
  instance: 'test-instance-123',
  event: 'messages.upsert',
  data: {
    key: {
      remoteJid: '5511999999999@s.whatsapp.net',
      fromMe: false,
      id: 'msg_test_123'
    },
    message: {
      conversation: 'Olá, preciso de ajuda com meu pedido!'
    },
    messageTimestamp: Date.now(),
    pushName: 'Cliente Teste'
  },
  timestamp: new Date().toISOString()
};

console.log('🚀 TESTE DO WEBHOOK PRINCIPAL LOCAL\n');

// Teste 1: Health check
async function testarSaude() {
  try {
    console.log('1. 🏥 TESTE DE SAÚDE');
    const response = await fetch(LOCAL_WEBHOOK_URL, { method: 'GET' });
    const data = await response.json();
    console.log('✅ Webhook saudável:', data);
    return true;
  } catch (error) {
    console.log('❌ Erro no teste de saúde:', error.message);
    return false;
  }
}

// Teste 2: Envio de mensagem
async function testarMensagem() {
  try {
    console.log('\n2. 📱 TESTE COM DADOS DA EVOLUTION API');
    const response = await fetch(LOCAL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockEvolutionData)
    });
    
    const data = await response.json();
    console.log('✅ Resposta do webhook:', data);
    return true;
  } catch (error) {
    console.log('❌ Erro no teste de mensagem:', error.message);
    return false;
  }
}

// Teste 3: Dados inválidos
async function testarDadosInvalidos() {
  try {
    console.log('\n3. 🚫 TESTE COM DADOS INVÁLIDOS');
    const response = await fetch(LOCAL_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'data' })
    });
    
    const data = await response.json();
    console.log('✅ Resposta para dados inválidos:', data);
    return true;
  } catch (error) {
    console.log('❌ Erro no teste de dados inválidos:', error.message);
    return false;
  }
}

// Executar todos os testes
async function executarTestes() {
  console.log('============================================================\n');
  
  const resultados = {
    saude: await testarSaude(),
    mensagem: await testarMensagem(),
    invalidos: await testarDadosInvalidos()
  };
  
  console.log('\n============================================================');
  console.log('📋 RESUMO DOS TESTES');
  console.log('============================================================');
  console.log(`🏥 Saúde: ${resultados.saude ? '✅' : '❌'}`);
  console.log(`📱 Mensagem: ${resultados.mensagem ? '✅' : '❌'}`);
  console.log(`🚫 Dados inválidos: ${resultados.invalidos ? '✅' : '❌'}`);
  
  const totalTestes = Object.keys(resultados).length;
  const testesPassaram = Object.values(resultados).filter(Boolean).length;
  
  console.log(`\n📊 Resultado: ${testesPassaram}/${totalTestes} testes passaram`);
  
  if (testesPassaram === totalTestes) {
    console.log('\n🎉 Todos os testes passaram! Webhook funcionando corretamente.');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima.');
  }
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Configure N8N para receber dados do webhook');
  console.log('2. Configure Evolution API para enviar para este webhook');
  console.log('3. Teste com mensagem real do WhatsApp');
}

// Executar testes
executarTestes().catch(console.error);
