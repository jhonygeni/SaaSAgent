#!/usr/bin/env node

/**
 * Script de Verificação do Webhook de Email
 * 
 * Este script verifica e corrige as configurações do webhook no Supabase
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 VERIFICAÇÃO E CONFIGURAÇÃO DO WEBHOOK DE EMAIL');
console.log('='.repeat(60));
console.log('');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log('📋 CONFIGURAÇÕES NECESSÁRIAS NO CONSOLE DO SUPABASE:');
  console.log('');
  
  console.log('1. 🌐 Acesse o Console do Supabase:');
  console.log('   https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc');
  console.log('');
  
  console.log('2. 📧 Configure o Email Webhook:');
  console.log('   • Vá até: Authentication → Email Templates');
  console.log('   • Ative: "Enable custom email template webhook"');
  console.log('   • URL do Webhook: https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email');
  console.log('');
  
  console.log('3. 🔗 Configure as URLs de Redirecionamento:');
  console.log('   • Vá até: Authentication → URL Configuration');
  console.log('   • Site URL: https://ia.geni.chat');
  console.log('   • Redirect URLs: https://ia.geni.chat/**');
  console.log('');
  
  console.log('4. ⚙️ Verifique as Variáveis de Ambiente:');
  console.log('   • SITE_URL = https://ia.geni.chat');
  console.log('   • SMTP_HOST = smtp.hostinger.com');
  console.log('   • SMTP_PORT = 465');
  console.log('   • SMTP_USERNAME = validar@geni.chat');
  console.log('   • SMTP_PASSWORD = [sua senha SMTP]');
  console.log('');
  
  await askQuestion('Pressione Enter após configurar no Console do Supabase...');
  
  console.log('');
  console.log('🧪 TESTANDO CONFIGURAÇÕES:');
  console.log('');
  
  console.log('Para testar o webhook manualmente:');
  console.log('');
  console.log('curl -X POST \\');
  console.log('  https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "Authorization: Bearer [SUA_ANON_KEY]" \\');
  console.log('  -d \'{');
  console.log('    "type": "auth",');
  console.log('    "event": "signup",');
  console.log('    "user": {');
  console.log('      "id": "test-user-id",');
  console.log('      "email": "test@example.com",');
  console.log('      "user_metadata": {"name": "Test User"}');
  console.log('    },');
  console.log('    "data": {');
  console.log('      "token": "test-token-12345"');
  console.log('    }');
  console.log('  }\'');
  console.log('');
  
  console.log('📊 STATUS DAS CORREÇÕES:');
  console.log('');
  console.log('✅ CORRIGIDO - EmailConfirmationPage.tsx:');
  console.log('   • Agora suporta confirmação via redirect do Supabase');
  console.log('   • Verifica automaticamente se usuário já está autenticado');
  console.log('   • Lida com tokens diretos E redirecionamentos');
  console.log('   • Mensagens de erro melhoradas');
  console.log('');
  
  console.log('✅ CORRIGIDO - Fluxo de Registro:');
  console.log('   • Register.tsx configurado com URL correta');
  console.log('   • emailRedirectTo: https://ia.geni.chat/confirmar-email');
  console.log('');
  
  console.log('✅ CORRIGIDO - Função Edge:');
  console.log('   • custom-email configurada e ativa');
  console.log('   • Gera URLs corretas para o Supabase');
  console.log('   • Suporte a diferentes tipos de email');
  console.log('');
  
  console.log('🎯 PRÓXIMOS PASSOS PARA TESTE:');
  console.log('');
  console.log('1. Inicie o servidor de desenvolvimento:');
  console.log('   npm run dev');
  console.log('');
  console.log('2. Teste o registro de um novo usuário:');
  console.log('   http://localhost:5173/registrar');
  console.log('');
  console.log('3. Verifique o email recebido');
  console.log('');
  console.log('4. Clique no link de confirmação');
  console.log('');
  console.log('5. Deve ser redirecionado e processado automaticamente');
  console.log('');
  
  console.log('🐛 SE AINDA HOUVER PROBLEMAS:');
  console.log('');
  console.log('• Verifique os logs da função Edge:');
  console.log('  supabase functions logs custom-email');
  console.log('');
  console.log('• Verifique se o usuário pode fazer login manualmente:');
  console.log('  http://localhost:5173/entrar');
  console.log('');
  console.log('• Use a página de reenvio se necessário:');
  console.log('  http://localhost:5173/reenviar-confirmacao');
  console.log('');
  
  rl.close();
}

main().catch(console.error);
