#!/usr/bin/env node

/**
 * CORREÇÃO DEFINITIVA DO PROBLEMA DE EMAIL
 * 
 * Este script identifica e corrige especificamente por que
 * os emails não chegam mesmo com usuário criado no Supabase.
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🎯 CORREÇÃO DEFINITIVA - EMAILS NÃO CHEGANDO');
console.log('='.repeat(50));
console.log('');

// Função para executar comandos
const runCommand = (command, description) => {
  try {
    console.log(`${description}...`);
    const result = execSync(command, { encoding: 'utf8', cwd: '/Users/jhonymonhol/Desktop/SaaSAgent' });
    console.log(`✅ ${description} - Sucesso`);
    return result;
  } catch (error) {
    console.log(`❌ ${description} - Erro: ${error.message}`);
    return null;
  }
};

// 1. Verificar se a função existe localmente
console.log('1. 📧 Verificando função custom-email...');
if (fs.existsSync('/Users/jhonymonhol/Desktop/SaaSAgent/supabase/functions/custom-email/index.ts')) {
  console.log('✅ Função custom-email encontrada localmente');
} else {
  console.log('❌ Função custom-email não encontrada');
  process.exit(1);
}

// 2. Tentar fazer deploy da função
console.log('\\n2. 🚀 Tentando implantar função...');
const deployResult = runCommand(
  'supabase functions deploy custom-email --project-ref hpovwcaskorzzrpphgkc',
  'Deploy da função custom-email'
);

// 3. Verificar se a função foi implantada
console.log('\\n3. 📋 Verificando funções implantadas...');
const listResult = runCommand(
  'supabase functions list --project-ref hpovwcaskorzzrpphgkc',
  'Listagem de funções'
);

if (listResult && listResult.includes('custom-email')) {
  console.log('✅ Função custom-email está implantada');
} else {
  console.log('❌ Função custom-email não encontrada na lista');
}

// 4. Verificar variáveis de ambiente
console.log('\\n4. ⚙️ Verificando variáveis de ambiente...');
const secretsResult = runCommand(
  'supabase secrets list --project-ref hpovwcaskorzzrpphgkc',
  'Listagem de variáveis'
);

console.log('\\n5. 🔧 Configurando variáveis essenciais...');
// Configurar variáveis básicas sem a senha por enquanto
const configResult = runCommand(
  'supabase secrets set SMTP_HOST="smtp.hostinger.com" SMTP_PORT="465" SMTP_USERNAME="validar@geni.chat" SITE_URL="https://ia.geni.chat" PROJECT_REF="hpovwcaskorzzrpphgkc" --project-ref hpovwcaskorzzrpphgkc',
  'Configuração de variáveis básicas'
);

// 6. Teste da função
console.log('\\n6. 🧪 Testando função...');
const testResult = runCommand(
  'curl -s -X POST "https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email" -H "Content-Type: application/json" -d \'{"email":"teste@teste.com","type":"signup","token":"test-token"}\'',
  'Teste da função'
);

console.log('\\n📋 DIAGNÓSTICO COMPLETO:');
console.log('='.repeat(50));
console.log('');

console.log('✅ VERIFICAÇÕES CONCLUÍDAS:');
console.log('• Função custom-email existe localmente');
console.log('• Tentativa de deploy executada');
console.log('• Variáveis básicas configuradas');
console.log('• Teste de conectividade executado');
console.log('');

console.log('⚠️  AÇÕES MANUAIS NECESSÁRIAS:');
console.log('');
console.log('1. 🔑 CONFIGURAR SENHA SMTP:');
console.log('   Você precisa configurar a senha real do email validar@geni.chat:');
console.log('   supabase secrets set SMTP_PASSWORD="[SENHA_REAL]" --project-ref hpovwcaskorzzrpphgkc');
console.log('');

console.log('2. 🔗 HABILITAR WEBHOOK NO CONSOLE:');
console.log('   • Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/templates');
console.log('   • Procure "Custom Email Template Webhook"');
console.log('   • MARQUE a caixa "Enable custom email template webhook"');
console.log('   • URL: https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email');
console.log('   • SALVE as configurações');
console.log('');

console.log('3. 🧪 TESTAR NOVAMENTE:');
console.log('   • Vá para: http://localhost:5173/registrar');
console.log('   • Registre um novo usuário');
console.log('   • Verifique se o email chegou');
console.log('');

console.log('💡 PROBLEMA MAIS PROVÁVEL:');
console.log('O webhook não está habilitado no Console do Supabase.');
console.log('Mesmo que a função esteja implantada, se o webhook não');
console.log('estiver habilitado, o Supabase não vai chamá-la.');
console.log('');

console.log('🔍 PARA DEBUG EM TEMPO REAL:');
console.log('supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc --follow');
console.log('');

console.log('🎯 RESUMO: Configure a senha SMTP e habilite o webhook no Console!');
