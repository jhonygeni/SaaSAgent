#!/usr/bin/env node
/**
 * Check SMTP Configuration
 * 
 * Este script verifica a configuração SMTP configurada no .env
 * e envia um email de teste para verificar se está funcionando corretamente.
 */

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const readline = require('readline');
const { promisify } = require('util');

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

async function main() {
  console.log('\n🔍 VERIFICADOR DE CONFIGURAÇÃO SMTP');
  console.log('=====================================\n');
  
  // Verificar se todas as variáveis necessárias estão presentes
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Erro: As seguintes variáveis de ambiente estão faltando no arquivo .env:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\nPor favor, configure o arquivo .env corretamente.');
    process.exit(1);
  }
  
  // Mostrar configuração atual
  console.log('📋 Configuração atual:');
  console.log(`   - SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`   - SMTP_PORT: ${process.env.SMTP_PORT}`);
  console.log(`   - SMTP_USERNAME: ${process.env.SMTP_USERNAME}`);
  console.log(`   - SMTP_PASSWORD: ${'*'.repeat(8)}`);
  console.log(`   - SITE_URL: ${process.env.SITE_URL || 'Não configurado'}`);
  console.log(`   - PROJECT_REF: ${process.env.PROJECT_REF || 'Não configurado'}`);
  
  console.log('\n');
  
  // Perguntar se deseja enviar um email de teste
  const sendTestEmail = await question('Deseja enviar um email de teste para verificar a configuração? (s/n): ');
  
  if (sendTestEmail.toLowerCase() !== 's' && sendTestEmail.toLowerCase() !== 'sim') {
    console.log('\n✅ Verificação completa! Lembre-se de testar o envio de emails.');
    rl.close();
    return;
  }
  
  // Perguntar email de destino
  const testEmail = await question('Digite o email para receber o teste: ');
  
  if (!testEmail || !testEmail.includes('@')) {
    console.log('❌ Email inválido. Encerrando teste.');
    rl.close();
    return;
  }
  
  console.log('\n🔄 Configurando transporte SMTP...');
  
  // Criar transporte SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, // true para porta 465
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });
  
  console.log('📧 Enviando email de teste...');
  
  try {
    // Enviar email
    const info = await transporter.sendMail({
      from: `"ConversaAI Brasil" <${process.env.SMTP_USERNAME}>`,
      to: testEmail,
      subject: "Teste de Configuração SMTP - ConversaAI",
      text: "Este é um email de teste para verificar a configuração SMTP da plataforma ConversaAI Brasil.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #0066FF;">Teste de Configuração SMTP</h2>
          <p>Olá!</p>
          <p>Este é um email de <strong>teste</strong> enviado pelo script de verificação de configuração SMTP.</p>
          <p>Se você está recebendo este email, significa que a configuração SMTP da plataforma ConversaAI Brasil está <strong>funcionando corretamente</strong>.</p>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Data do teste: ${new Date().toLocaleString('pt-BR')}<br>
            Servidor SMTP: ${process.env.SMTP_HOST}<br>
            Remetente: ${process.env.SMTP_USERNAME}
          </p>
        </div>
      `,
    });
    
    console.log('\n✅ Email enviado com sucesso!');
    console.log(`   ID da mensagem: ${info.messageId}`);
    console.log(`   Enviado para: ${testEmail}`);
    console.log('\n📩 Verifique a caixa de entrada (ou spam) do email informado.');
    
  } catch (error) {
    console.error('\n❌ Erro ao enviar email:');
    console.error(`   ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.log('\n⚠️ Problema de autenticação! Verifique:');
      console.log('   1. Se a senha SMTP está correta no arquivo .env');
      console.log('   2. Se a conta de email está ativa no Hostinger');
      console.log('   3. Se o Hostinger não está bloqueando conexões SMTP');
    }
    
    if (error.code === 'ESOCKET') {
      console.log('\n⚠️ Problema de conexão! Verifique:');
      console.log('   1. Se o host e porta SMTP estão corretos');
      console.log('   2. Se há algum firewall bloqueando a conexão');
      console.log('   3. Se sua conexão de internet está funcionando');
    }
  }
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Erro inesperado:', error);
  process.exit(1);
});
