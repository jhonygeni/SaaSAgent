#!/usr/bin/env node

/**
 * DIAGNÓSTICO ESPECÍFICO - PROBLEMA DE EMAIL
 * 
 * Este script verifica especificamente por que os emails de confirmação
 * não estão chegando no Gmail, mesmo que o usuário esteja no Supabase.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO ESPECÍFICO - PROBLEMA DE EMAIL');
console.log('='.repeat(60));
console.log('');

// 1. VERIFICAR SE A FUNÇÃO EDGE ESTÁ PRESENTE
console.log('1. 📧 VERIFICANDO FUNÇÃO EDGE CUSTOM-EMAIL:');
const customEmailPath = path.join(__dirname, 'supabase/functions/custom-email/index.ts');
if (fs.existsSync(customEmailPath)) {
  console.log('   ✅ Função custom-email encontrada');
  
  // Verificar configurações SMTP na função
  const functionContent = fs.readFileSync(customEmailPath, 'utf8');
  
  const smtpChecks = [
    { name: 'SMTP_HOST configurado', pattern: /SMTP_HOST.*smtp\.hostinger\.com/ },
    { name: 'SMTP_PORT configurado', pattern: /SMTP_PORT.*465/ },
    { name: 'SMTP_USERNAME configurado', pattern: /SMTP_USERNAME.*validar@geni\.chat/ },
    { name: 'Configuração SSL/TLS', pattern: /tls:\s*true/ },
    { name: 'FROM_EMAIL definido', pattern: /FROM_EMAIL.*validar@geni\.chat/ }
  ];
  
  smtpChecks.forEach(check => {
    if (check.pattern.test(functionContent)) {
      console.log(`   ✅ ${check.name}`);
    } else {
      console.log(`   ❌ ${check.name} - PROBLEMA DETECTADO`);
    }
  });
} else {
  console.log('   ❌ Função custom-email NÃO ENCONTRADA - ESTE É O PROBLEMA!');
}
console.log('');

// 2. VERIFICAR CONFIGURAÇÃO DO SUPABASE
console.log('2. ⚙️ VERIFICANDO CONFIGURAÇÃO DO SUPABASE:');

// Verificar se existe webhook configurado
console.log('   Pontos críticos a verificar no Console do Supabase:');
console.log('   • Authentication > Email Templates');
console.log('   • Custom Email Template Webhook deve estar HABILITADO');
console.log('   • URL: https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email');
console.log('');

// 3. VERIFICAR REGISTRO NO COMPONENTE
console.log('3. 📝 VERIFICANDO COMPONENTE DE REGISTRO:');
const registerPath = path.join(__dirname, 'src/components/Register.tsx');
if (fs.existsSync(registerPath)) {
  const registerContent = fs.readFileSync(registerPath, 'utf8');
  
  if (registerContent.includes('emailRedirectTo')) {
    console.log('   ✅ emailRedirectTo configurado');
    
    if (registerContent.includes('ia.geni.chat')) {
      console.log('   ✅ URL de redirecionamento correta');
    } else {
      console.log('   ⚠️  URL de redirecionamento pode estar incorreta');
    }
  } else {
    console.log('   ❌ emailRedirectTo NÃO CONFIGURADO - PROBLEMA!');
  }
} else {
  console.log('   ❌ Register.tsx não encontrado');
}
console.log('');

// 4. DIAGNÓSTICO DO PROBLEMA
console.log('📋 DIAGNÓSTICO FINAL:');
console.log('='.repeat(60));
console.log('');

console.log('🎯 POSSÍVEIS CAUSAS DO PROBLEMA:');
console.log('');
console.log('1. ❌ FUNÇÃO EDGE NÃO IMPLANTADA:');
console.log('   • A função custom-email pode não estar implantada no Supabase');
console.log('   • Solução: Implantar a função usando o comando:');
console.log('     supabase functions deploy custom-email --project-ref hpovwcaskorzzrpphgkc');
console.log('');

console.log('2. ❌ WEBHOOK NÃO CONFIGURADO:');
console.log('   • O webhook pode não estar habilitado no Console do Supabase');
console.log('   • Solução: Ir para Authentication > Email Templates e habilitar');
console.log('');

console.log('3. ❌ VARIÁVEIS DE AMBIENTE FALTANDO:');
console.log('   • As credenciais SMTP podem não estar configuradas');
console.log('   • Solução: Configurar usando:');
console.log('     supabase secrets set SMTP_HOST="smtp.hostinger.com" SMTP_PORT="465" ...');
console.log('');

console.log('4. ❌ CREDENCIAIS SMTP INCORRETAS:');
console.log('   • A senha ou configuração do email validar@geni.chat pode estar errada');
console.log('   • Solução: Verificar credenciais no painel da Hostinger');
console.log('');

console.log('🚀 PRÓXIMOS PASSOS PARA RESOLVER:');
console.log('');
console.log('1. Verificar se a função está implantada:');
console.log('   supabase functions list --project-ref hpovwcaskorzzrpphgkc');
console.log('');
console.log('2. Se não estiver, implantar:');
console.log('   supabase functions deploy custom-email --project-ref hpovwcaskorzzrpphgkc');
console.log('');
console.log('3. Configurar variáveis de ambiente:');
console.log('   supabase secrets set SMTP_PASSWORD="[senha_real]" --project-ref hpovwcaskorzzrpphgkc');
console.log('');
console.log('4. Verificar webhook no Console:');
console.log('   https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/templates');
console.log('');
console.log('5. Testar registro novamente');
console.log('');

console.log('⚠️  IMPORTANTE: O problema é provavelmente que a função Edge custom-email');
console.log('    não está implantada ou configurada corretamente no Supabase.');
console.log('    Por isso o sistema está usando o email padrão do Supabase');
console.log('    (que pode não estar configurado) em vez do sistema personalizado.');
