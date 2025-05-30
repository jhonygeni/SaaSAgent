#!/usr/bin/env node

/**
 * Script de configuração rápida do webhook do WhatsApp
 * 
 * Este script ajuda a:
 * 1. Verificar configurações necessárias
 * 2. Testar o webhook localmente
 * 3. Gerar URLs para configurar no Meta Business
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function checkEnvironmentFiles() {
  console.log('🔍 Verificando arquivos de ambiente...\n');
  
  const envFiles = ['.env', '.env.local'];
  const requiredVars = [
    'NEXT_PUBLIC_WEBHOOK_BASE_URL',
    'WEBHOOK_VERIFY_TOKEN',
    'WEBHOOK_SECRET'
  ];
  
  let hasValidConfig = false;
  
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, envFile);
    
    if (fs.existsSync(envPath)) {
      console.log(`✅ Encontrado: ${envFile}`);
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const hasAllVars = requiredVars.every(varName => 
        envContent.includes(varName) && !envContent.includes(`${varName}=`)
      );
      
      if (hasAllVars) {
        hasValidConfig = true;
        console.log(`   📝 Todas as variáveis necessárias estão configuradas`);
      } else {
        console.log(`   ⚠️  Algumas variáveis podem estar faltando`);
      }
    } else {
      console.log(`❌ Não encontrado: ${envFile}`);
    }
  }
  
  if (!hasValidConfig) {
    console.log('\n⚠️  AÇÃO NECESSÁRIA:');
    console.log('1. Copie .env.local.example para .env.local');
    console.log('2. Configure as variáveis necessárias:');
    requiredVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }
  
  return hasValidConfig;
}

function generateWebhookInstructions() {
  console.log('\n📋 INSTRUÇÕES PARA CONFIGURAR NO META BUSINESS:\n');
  
  // Ler configurações do arquivo de configuração
  const baseUrl = process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL || 'https://seu-dominio.com';
  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'seu-token-aqui';
  
  console.log('1. Acesse o Meta Business Manager');
  console.log('2. Vá para seu App do WhatsApp Business API');
  console.log('3. Na seção Webhooks, configure:');
  console.log('');
  console.log(`   📍 Callback URL: ${baseUrl}/api/webhook/whatsapp`);
  console.log(`   🔑 Verify Token: ${verifyToken}`);
  console.log('');
  console.log('4. Assine os seguintes eventos:');
  console.log('   ✓ messages');
  console.log('   ✓ message_status (opcional)');
  console.log('');
  console.log('5. Clique em "Verificar e Salvar"');
  console.log('');
  console.log('🔗 URLs importantes:');
  console.log(`   Webhook: ${baseUrl}/api/webhook/whatsapp`);
  console.log(`   Verificação: ${baseUrl}/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test`);
}

function generateTestCommands() {
  console.log('\n🧪 COMANDOS PARA TESTAR:\n');
  
  console.log('1. Inicie o servidor de desenvolvimento:');
  console.log('   npm run dev\n');
  
  console.log('2. Em outro terminal, teste o webhook:');
  console.log('   node test-webhook.mjs\n');
  
  console.log('3. Para expor localmente (ngrok):');
  console.log('   ngrok http 3000');
  console.log('   (use a URL do ngrok no NEXT_PUBLIC_WEBHOOK_BASE_URL)\n');
  
  console.log('4. Teste manual com curl:');
  console.log(`   curl "http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=${process.env.WEBHOOK_VERIFY_TOKEN || 'token'}&hub.challenge=test"`);
}

function generateSecurityChecklist() {
  console.log('\n🔒 CHECKLIST DE SEGURANÇA:\n');
  
  console.log('✓ WEBHOOK_SECRET configurado (para validação HMAC)');
  console.log('✓ WEBHOOK_VERIFY_TOKEN único e seguro');
  console.log('✓ HTTPS em produção (obrigatório para WhatsApp)');
  console.log('✓ Rate limiting implementado');
  console.log('✓ Logs de webhook configurados');
  console.log('✓ Monitoramento de erros ativo');
  console.log('✓ Backup das configurações');
}

function main() {
  console.log('🎯 CONFIGURAÇÃO DO WEBHOOK WHATSAPP - CONVERSA AI BRASIL\n');
  console.log('=' .repeat(60));
  
  // Verificar arquivos de ambiente
  const hasValidConfig = checkEnvironmentFiles();
  
  // Gerar instruções
  generateWebhookInstructions();
  generateTestCommands();
  generateSecurityChecklist();
  
  console.log('\n' + '=' .repeat(60));
  
  if (hasValidConfig) {
    console.log('🎉 Configuração parece estar correta!');
    console.log('Execute os testes para verificar se tudo está funcionando.');
  } else {
    console.log('⚠️  Configure as variáveis de ambiente primeiro.');
  }
  
  console.log('\n📚 Para mais informações:');
  console.log('   - Documentação WhatsApp: https://developers.facebook.com/docs/whatsapp');
  console.log('   - Meta Business Manager: https://business.facebook.com');
}

main();
