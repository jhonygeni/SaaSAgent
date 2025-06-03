#!/usr/bin/env node

// Script para diagnosticar problemas de email confirmation no login
console.log('📧 DIAGNÓSTICO DE EMAIL CONFIRMATION');
console.log('===================================');

console.log('\n🔍 PROBLEMA IDENTIFICADO:');
console.log('Se o login não está funcionando, provavelmente é porque:');
console.log('1. ❌ Email confirmation está habilitado no Supabase');
console.log('2. ❌ Usuários não conseguem confirmar email por problemas SMTP');
console.log('3. ❌ Usuários existentes ficaram com email não confirmado');

console.log('\n💡 SOLUÇÕES POSSÍVEIS:');

console.log('\n🔧 SOLUÇÃO 1: DESABILITAR EMAIL CONFIRMATION (TEMPORÁRIO)');
console.log('1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/settings');
console.log('2. Em "User Signups" > "Enable email confirmations"');
console.log('3. DESABILITE temporariamente');
console.log('4. Salve as configurações');
console.log('5. Teste o login novamente');

console.log('\n🔧 SOLUÇÃO 2: CONFIRMAR USUÁRIOS EXISTENTES MANUALMENTE');
console.log('1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/users');
console.log('2. Para cada usuário com email não confirmado:');
console.log('   - Clique no usuário');
console.log('   - Clique em "Confirm email"');
console.log('3. Ou execute SQL para confirmar todos:');

console.log(`
-- SQL para confirmar todos os usuários (Execute no SQL Editor)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
`);

console.log('\n🔧 SOLUÇÃO 3: CONFIGURAR SMTP CORRETAMENTE');
console.log('1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/settings');
console.log('2. Em "SMTP Settings":');
console.log('   ✅ Enable custom SMTP: ATIVADO');
console.log('   ✅ Host: smtp.hostinger.com');
console.log('   ✅ Port: 465');
console.log('   ✅ Username: validar@geni.chat');
console.log('   ⚠️  Password: [VERIFICAR SE ESTÁ CORRETO]');
console.log('   ✅ Sender name: ConversaAI Brasil');
console.log('   ✅ Sender email: validar@geni.chat');
console.log('3. Teste enviando um email de teste');

console.log('\n🔧 SOLUÇÃO 4: REABILITAR EMAIL CONFIRMATION APÓS CORREÇÃO');
console.log('Depois de corrigir o SMTP:');
console.log('1. Reabilite "Enable email confirmations"');
console.log('2. Teste criando um novo usuário');
console.log('3. Verifique se o email de confirmação chega');

console.log('\n🚨 SENHA SMTP EXPOSTA');
console.log('A senha SMTP k7;Ex7~yh?cA está visível nos arquivos.');
console.log('RECOMENDAÇÃO URGENTE:');
console.log('1. Altere a senha no painel da Hostinger');
console.log('2. Atualize a nova senha no Supabase Dashboard');
console.log('3. Remova a senha dos arquivos de código');

console.log('\n📋 TESTE RÁPIDO NO CONSOLE DO NAVEGADOR:');
console.log('Abra o console (F12) em http://localhost:5173/login e execute:');

console.log(`
// Verificar configuração de auth
supabase.auth.getSession().then(({ data, error }) => {
  console.log('Session atual:', data.session ? 'Existe' : 'Não existe');
  if (error) console.error('Erro:', error);
});

// Teste de signup rápido
supabase.auth.signUp({
  email: 'teste' + Date.now() + '@example.com',
  password: 'senha123!@#'
}).then(({ data, error }) => {
  if (error) {
    console.log('❌ Erro signup:', error.message);
  } else {
    console.log('✅ Signup OK');
    console.log('📧 Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
    if (!data.user?.email_confirmed_at) {
      console.log('🔍 PROBLEMA: Email não confirmado automaticamente');
      console.log('💡 SOLUÇÃO: Desabilitar email confirmation ou configurar SMTP');
    }
  }
});
`);

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('1. 🔧 IMPLEMENTAR SOLUÇÃO 1 (mais rápido)');
console.log('2. 🧪 TESTAR login após desabilitar email confirmation');
console.log('3. 🔒 TROCAR senha SMTP exposta');
console.log('4. 📧 RECONFIGURAR SMTP adequadamente');
console.log('5. ✅ REABILITAR email confirmation quando SMTP funcionar');

console.log('\n✅ DIAGNÓSTICO CONCLUÍDO');
