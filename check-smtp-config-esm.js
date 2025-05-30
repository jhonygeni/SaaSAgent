import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se o arquivo .env existe
const envPath = join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log('🔍 VERIFICANDO CONFIGURAÇÕES SMTP');
console.log(`📁 Arquivo .env ${envExists ? 'encontrado ✅' : 'não encontrado ❌'}`);

// Função para mascarar senha
function maskPassword(password) {
  if (!password) return '❌ Não definido';
  if (password.length <= 4) return '***' + password.slice(-1);
  return password.slice(0, 2) + '*'.repeat(password.length - 4) + password.slice(-2);
}

// Verificar variáveis de ambiente
console.log('\n📌 VARIÁVEIS DE AMBIENTE SMTP:');
console.log(`SMTP_HOST: ${process.env.SMTP_HOST || '❌ Não definido'}`);
console.log(`SMTP_PORT: ${process.env.SMTP_PORT || '❌ Não definido'}`);
console.log(`SMTP_USERNAME: ${process.env.SMTP_USERNAME || '❌ Não definido'}`);
console.log(`SMTP_PASSWORD: ${maskPassword(process.env.SMTP_PASSWORD)}`);
console.log(`SMTP_FROM: ${process.env.SMTP_FROM || '❌ Não definido'}`);

// Verificar outras variáveis importantes
console.log('\n📌 OUTRAS VARIÁVEIS IMPORTANTES:');
console.log(`SITE_URL: ${process.env.SITE_URL || '❌ Não definido'}`);
console.log(`SUPABASE_URL: ${process.env.SUPABASE_URL || '❌ Não definido'}`);
console.log(`SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Definido' : '❌ Não definido'}`);
console.log(`PROJECT_REF: ${process.env.PROJECT_REF || '❌ Não definido'}`);

// Criar transportador SMTP para teste
if (process.env.SMTP_HOST && process.env.SMTP_PORT && 
    process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD) {
    
  console.log('\n📧 TENTANDO CONECTAR AO SERVIDOR SMTP...');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD
    }
  });
  
  console.log('🔄 Verificando conexão SMTP...');
  
  try {
    transporter.verify(function(error, success) {
      if (error) {
        console.log('❌ ERRO DE CONEXÃO SMTP:', error.message);
        console.log('\n🚨 DIAGNÓSTICO:');
        
        if (error.code === 'ECONNREFUSED') {
          console.log('- Servidor SMTP inacessível. Verifique se o host e porta estão corretos.');
        } else if (error.code === 'ETIMEDOUT') {
          console.log('- Tempo de conexão esgotado. Verifique sua conexão de internet ou firewall.');
        } else if (error.code === 'EAUTH') {
          console.log('- Credenciais incorretas. Verifique o usuário e senha.');
        } else {
          console.log('- Erro desconhecido. Veja a mensagem de erro acima.');
        }
        
      } else {
        console.log('✅ CONEXÃO SMTP BEM SUCEDIDA!');
        console.log('✅ O servidor está pronto para enviar emails.');
      }
      
      console.log('\n📝 PRÓXIMOS PASSOS:');
      if (!success) {
        console.log('1. Corrija os problemas de configuração SMTP');
        console.log('2. Atualize o arquivo .env com as informações corretas');
        console.log('3. Execute este script novamente para verificar');
      } else {
        console.log('1. Configure o SMTP no dashboard do Supabase');
        console.log('2. Teste o envio de um email de confirmação');
      }
    });
  } catch (err) {
    console.log('❌ ERRO AO CRIAR TRANSPORTADOR SMTP:', err.message);
  }
} else {
  console.log('\n❌ CONFIGURAÇÃO SMTP INCOMPLETA!');
  console.log('Por favor, defina todas as variáveis SMTP no arquivo .env');
  
  console.log('\n📝 PRÓXIMOS PASSOS:');
  console.log('1. Crie/edite o arquivo .env na raiz do projeto');
  console.log('2. Adicione todas as variáveis SMTP necessárias');
  console.log('3. Execute este script novamente');
}
