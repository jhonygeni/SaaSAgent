/**
 * Script para enviar email para usuário já existente
 * 
 * Este script utiliza a API de recuperação de senha do Supabase
 * para enviar um email para um usuário já cadastrado.
 * Evita o erro "User already registered".
 * 
 * Utiliza duas abordagens:
 * 1. Método com ANON_KEY (para usuários normais)
 * 2. Método com SERVICE_ROLE_KEY (para administradores)
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

// Verificar configuração básica
if (!process.env.SUPABASE_URL) {
  console.error('❌ Erro: SUPABASE_URL não configurado');
  console.log('Configure esta variável no arquivo .env');
  process.exit(1);
}

// Criação de dois clientes: um para usuário anônimo e outro para admin
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || ''
);

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
) : null;

/**
 * Tenta enviar email para usuário existente usando método padrão (resetPasswordForEmail)
 */
async function enviarEmailMetodoPadrao(email) {
  console.log(`\n📧 MÉTODO 1: Tentando enviar e-mail com resetPasswordForEmail...`);
  
  try {
    const { data, error } = await supabaseAnon.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.SITE_URL || 'https://app.conversaai.com.br'}/redefinir-senha`,
    });

    if (error) {
      console.log(`❌ Falhou o método padrão: ${error.message}`);
      return false;
    }

    console.log('✅ Método padrão: Email enviado com sucesso!');
    return true;
  } catch (err) {
    console.log(`❌ Erro no método padrão: ${err.message}`);
    return false;
  }
}

/**
 * Tenta enviar email para usuário existente usando método administrativo (admin.generateLink)
 */
async function enviarEmailMetodoAdmin(email) {
  console.log(`\n🔑 MÉTODO 2: Tentando enviar e-mail com admin.generateLink...`);
  
  if (!supabaseAdmin) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY não configurada, não é possível usar método admin');
    return false;
  }
  
  try {
    // Gerar token de redefinição de senha (isso envia um e-mail)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${process.env.SITE_URL || 'https://app.conversaai.com.br'}/redefinir-senha`
      }
    });

    if (error) {
      console.log(`❌ Falhou o método admin: ${error.message}`);
      return false;
    }

    console.log('✅ Método admin: Email enviado com sucesso!');
    return true;
  } catch (err) {
    console.log(`❌ Erro no método admin: ${err.message}`);
    return false;
  }
}

/**
 * Envia email usando método direto da função custom-email
 */
async function enviarEmailMetodoDireto(email) {
  console.log(`\n🔧 MÉTODO 3: Tentando enviar e-mail direto via função custom-email...`);
  
  try {
    const testToken = `test-${Math.random().toString(36).substr(2, 10)}`;
    
    const { data, error } = await supabaseAnon.functions.invoke('custom-email', {
      body: {
        email: email,
        type: 'recovery',
        token: testToken,
        redirect_to: `${process.env.SITE_URL || 'https://app.conversaai.com.br'}/redefinir-senha`,
        metadata: { name: email.split('@')[0] }
      }
    });

    if (error) {
      console.log(`❌ Falhou o método direto: ${error.message}`);
      return false;
    }

    console.log('✅ Método direto: Email enviado com sucesso!');
    return true;
  } catch (err) {
    console.log(`❌ Erro no método direto: ${err.message}`);
    return false;
  }
}

/**
 * Função principal para enviar email usando todos os métodos disponíveis
 */
async function enviarEmailParaUsuarioExistente(email) {
  console.log(`\n🚀 Enviando e-mail para usuário existente: ${email}`);
  
  // Tentar método padrão primeiro
  const sucessoMetodo1 = await enviarEmailMetodoPadrao(email);
  
  // Se falhou, tentar método admin
  if (!sucessoMetodo1) {
    const sucessoMetodo2 = await enviarEmailMetodoAdmin(email);
    
    // Se ambos falharam, tentar método direto
    if (!sucessoMetodo2) {
      const sucessoMetodo3 = await enviarEmailMetodoDireto(email);
      
      if (!sucessoMetodo3) {
        console.log('\n❌ Todos os métodos falharam. Verifique:');
        console.log('  1. Se o email existe no sistema');
        console.log('  2. Se as configurações SMTP estão corretas');
        console.log('  3. Se a função custom-email está implantada');
        return false;
      }
    }
  }
  
  console.log('\n✅ E-mail enviado com sucesso!');
  console.log('📨 Verifique a caixa de entrada (ou spam) de:', email);
  
  // Verificar logs no dashboard do Supabase para confirmar o envio
  console.log('\n🔍 Para mais detalhes, verifique:');
  console.log('  - Logs de autenticação: Authentication > Logs');
  console.log('  - Logs da função: Edge Functions > custom-email > Logs');
  console.log('  - Ou execute: ./check-email-function-logs.sh');
  
  return true;
}

async function main() {
  console.log('🔄 TESTE DE ENVIO DE EMAIL PARA USUÁRIO EXISTENTE');
  console.log('==============================================');
  
  // E-mail para o qual você deseja enviar (substitua pelo e-mail do usuário existente)
  const emailDoUsuario = process.argv[2] || 'usuario@exemplo.com';
  
  if (emailDoUsuario === 'usuario@exemplo.com') {
    console.log('\n⚠️  Por favor, especifique um e-mail como parâmetro:');
    console.log('   node test-enviar-email-usuario-existente.js seuemail@exemplo.com');
    process.exit(1);
  }
  
  if (!emailDoUsuario.includes('@')) {
    console.log('\n❌ Email inválido! Por favor, forneça um email válido.');
    process.exit(1);
  }
  
  // Executar o teste
  const resultado = await enviarEmailParaUsuarioExistente(emailDoUsuario);
  
  if (resultado) {
    console.log('\n✨ Teste concluído com sucesso!');
  } else {
    console.log('\n🛠 Tente também o comando:');
    console.log(`  ./test-custom-email-direct.sh ${emailDoUsuario}`);
  }
  
  process.exit(resultado ? 0 : 1);
}

// Iniciar o script
main().catch(err => {
  console.error('❌ Erro inesperado:', err.message);
  process.exit(1);
});
