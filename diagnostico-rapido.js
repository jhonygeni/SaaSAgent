console.log('🔍 === DIAGNÓSTICO RÁPIDO - CONFIRMAÇÃO DE EMAIL ===\n');

console.log('📋 PROBLEMA IDENTIFICADO:');
console.log('Tokens de confirmação expiram IMEDIATAMENTE (otp_expired)');
console.log('Mesmo tokens claramente inválidos retornam o mesmo erro\n');

console.log('🎯 CAUSA MAIS PROVÁVEL:');
console.log('Auth Hooks ou Rate Limits no Supabase Dashboard\n');

console.log('🚀 SOLUÇÃO IMEDIATA (5 minutos):');
console.log('');
console.log('1. Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/hooks');
console.log('   • DESABILITE todos os hooks temporariamente');
console.log('   • Teste confirmação de email');
console.log('');
console.log('2. Se não resolver, acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/rate-limits');
console.log('   • Aumente "Token verifications" para 150 por hora');
console.log('   • Teste novamente');
console.log('');
console.log('3. Se ainda não resolver, acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/settings');
console.log('   • Verifique se "Confirm email" está habilitado corretamente');
console.log('   • Site URL deve ser: https://ia.geni.chat');
console.log('');

console.log('🎯 TESTE DEPOIS DE CADA MUDANÇA:');
console.log('1. Criar novo usuário em: https://ia.geni.chat/entrar');
console.log('2. Clicar no link do email recebido');
console.log('3. Ver se confirma sem erro "otp_expired"');
console.log('');

console.log('⚠️  IMPORTANTE:');
console.log('O problema está na CONFIGURAÇÃO do Supabase, não no código!');
console.log('Os emails são enviados corretamente, mas tokens expiram na verificação.');
