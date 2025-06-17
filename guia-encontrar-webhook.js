#!/usr/bin/env node

/**
 * GUIA DETALHADO - ONDE ENCONTRAR O WEBHOOK NO SUPABASE
 * 
 * Este guia mostra exatamente onde está a configuração do webhook
 * no Console do Supabase, pois ela pode estar em locais diferentes.
 */

console.log('🔍 GUIA DETALHADO - ONDE ENCONTRAR O WEBHOOK');
console.log('='.repeat(60));
console.log('');

console.log('📍 LOCALIZAÇÃO DO WEBHOOK NO CONSOLE SUPABASE:');
console.log('');

console.log('🎯 OPÇÃO 1 - AUTHENTICATION > EMAIL TEMPLATES:');
console.log('1. Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/templates');
console.log('2. Procure por seção "Email Templates"');
console.log('3. Role a página para baixo');
console.log('4. Procure por "Custom Email Template Webhook" ou "Email Hooks"');
console.log('');

console.log('🎯 OPÇÃO 2 - AUTHENTICATION > HOOKS:');
console.log('1. Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/hooks');
console.log('2. Procure por "Email Hooks" ou "Template Hooks"');
console.log('3. Pode estar em uma aba separada');
console.log('');

console.log('🎯 OPÇÃO 3 - SETTINGS > AUTH:');
console.log('1. Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/settings/auth');
console.log('2. Role para baixo até encontrar seção de "Webhooks" ou "Email"');
console.log('3. Procure por opções relacionadas a "Custom Email"');
console.log('');

console.log('🎯 OPÇÃO 4 - EDGE FUNCTIONS > HOOKS:');
console.log('1. Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/functions');
console.log('2. Procure por uma aba "Hooks" ou "Email Hooks"');
console.log('3. Pode estar integrado na seção de Edge Functions');
console.log('');

console.log('📝 O QUE PROCURAR ESPECIFICAMENTE:');
console.log('');
console.log('✅ Textos que podem aparecer:');
console.log('   • "Custom Email Template Webhook"');
console.log('   • "Email Template Hook"');
console.log('   • "Auth Email Hook"');
console.log('   • "Send Email Hook"');
console.log('   • "Custom SMTP"');
console.log('   • "Email Webhook URL"');
console.log('');

console.log('✅ Campos para configurar:');
console.log('   • Checkbox para habilitar');
console.log('   • Campo de URL');
console.log('   • Configurações de evento (signup, recovery, etc.)');
console.log('');

console.log('⚙️ CONFIGURAÇÃO CORRETA:');
console.log('   • Habilitar: ✅ MARCADO');
console.log('   • URL: https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email');
console.log('   • Eventos: signup, email_change, recovery');
console.log('');

console.log('🔄 SE NÃO ENCONTRAR EM LUGAR NENHUM:');
console.log('');
console.log('1. 📧 CONFIGURAÇÃO ALTERNATIVA VIA API:');
console.log('   Podemos configurar via API REST do Supabase');
console.log('');
console.log('2. 🔧 VERIFICAR VERSÃO DO PROJETO:');
console.log('   Projetos mais antigos podem ter interface diferente');
console.log('');
console.log('3. 📞 MÉTODO ALTERNATIVO - CONFIGURAR VIA CÓDIGO:');
console.log('   Podemos configurar diretamente no código do registro');
console.log('');

console.log('💡 DICA IMPORTANTE:');
console.log('Se você não encontrar a opção do webhook, isso pode significar:');
console.log('• O projeto Supabase não tem essa funcionalidade habilitada');
console.log('• A interface mudou de lugar');
console.log('• Precisamos usar uma abordagem alternativa');
console.log('');

console.log('🚀 PRÓXIMO PASSO:');
console.log('Tente encontrar em cada uma das 4 opções acima.');
console.log('Se não encontrar, me avise e implementaremos uma solução alternativa!');
console.log('');

console.log('📋 LINKS DIRETOS PARA TESTAR:');
console.log('• Auth Templates: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/templates');
console.log('• Auth Hooks: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/hooks');
console.log('• Settings Auth: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/settings/auth');
console.log('• Edge Functions: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/functions');
