#!/usr/bin/env node

/**
 * Script de Teste - Webhook Principal Evolution API
 * Testa o fluxo real: Evolution API → Webhook Principal → N8N
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// URLs de teste
const WEBHOOK_PRINCIPAL_URL = 'https://webhooksaas.geni.chat/webhook/principal';
const LOCAL_WEBHOOK_URL = 'http://localhost:3000/api/webhook/principal';

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

// Função para fazer requisição HTTP
async function fazerRequisicao(url, dados) {
  try {
    console.log(`🔄 Testando: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Evolution-API-Test/1.0'
      },
      body: JSON.stringify(dados)
    });

    const responseData = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response: ${responseData.substring(0, 200)}${responseData.length > 200 ? '...' : ''}`);
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    console.error(`❌ Erro na requisição: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Teste de saúde do webhook
async function testarSaude(url) {
  try {
    console.log(`🏥 Testando saúde: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Webhook-Health-Check/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Webhook saudável:`, data);
      return true;
    } else {
      console.log(`❌ Webhook não saudável: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro no teste de saúde: ${error.message}`);
    return false;
  }
}

// Função principal de teste
async function executarTestes() {
  console.log('🚀 TESTE DO WEBHOOK PRINCIPAL - EVOLUTION API\n');
  console.log('=' .repeat(60));
  
  // 1. Teste de saúde do webhook principal
  console.log('\n1. 🏥 TESTE DE SAÚDE');
  const saudeOk = await testarSaude(WEBHOOK_PRINCIPAL_URL);
  
  if (!saudeOk) {
    console.log('⚠️  Webhook principal não está acessível, testando localmente...');
    await testarSaude(LOCAL_WEBHOOK_URL);
  }
  
  // 2. Teste com dados da Evolution API
  console.log('\n2. 📱 TESTE COM DADOS DA EVOLUTION API');
  const resultado = await fazerRequisicao(
    saudeOk ? WEBHOOK_PRINCIPAL_URL : LOCAL_WEBHOOK_URL, 
    mockEvolutionData
  );
  
  if (resultado.success) {
    console.log('✅ Webhook processou dados da Evolution API com sucesso!');
  } else {
    console.log('❌ Falha ao processar dados da Evolution API');
  }
  
  // 3. Teste com dados inválidos
  console.log('\n3. 🚫 TESTE COM DADOS INVÁLIDOS');
  const dadosInvalidos = { test: 'invalid data' };
  await fazerRequisicao(
    saudeOk ? WEBHOOK_PRINCIPAL_URL : LOCAL_WEBHOOK_URL, 
    dadosInvalidos
  );
  
  // 4. Teste de evento ignorado (status)
  console.log('\n4. 🙈 TESTE COM EVENTO IGNORADO');
  const eventoStatus = {
    ...mockEvolutionData,
    data: {
      key: {
        remoteJid: 'status@broadcast'
      }
    }
  };
  await fazerRequisicao(
    saudeOk ? WEBHOOK_PRINCIPAL_URL : LOCAL_WEBHOOK_URL, 
    eventoStatus
  );
  
  // 5. Resumo
  console.log('\n' + '=' .repeat(60));
  console.log('📋 RESUMO DOS TESTES');
  console.log('=' .repeat(60));
  console.log('✅ Webhook Principal: Configurado em https://webhooksaas.geni.chat/webhook/principal');
  console.log('🔄 Fluxo: WhatsApp → Evolution API → Webhook Principal → N8N');
  console.log('📊 Monitoramento: /admin/webhooks');
  console.log('🔧 Debug: Verificar logs da aplicação');
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Configure um bot na interface');
  console.log('2. Conecte uma instância WhatsApp');
  console.log('3. Configure o workflow N8N');
  console.log('4. Teste com mensagem real');
  
  console.log('\n📞 TESTE REAL:');
  console.log('- Envie uma mensagem para uma instância conectada');
  console.log('- Verifique logs em tempo real: npm run dev');
  console.log('- Monitore em: /admin/webhooks');
}

// Executar testes
executarTestes().catch(console.error);
