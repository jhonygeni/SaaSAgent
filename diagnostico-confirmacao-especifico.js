#!/usr/bin/env node

/**
 * DIAGNÓSTICO ESPECÍFICO - PÁGINA DE CONFIRMAÇÃO
 * 
 * Este script analisa especificamente o problema atual da página de confirmação
 * que está apresentando erro mesmo com email do Geni Chat chegando corretamente.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO - PÁGINA DE CONFIRMAÇÃO DE EMAIL');
console.log('='.repeat(70));
console.log('');

console.log('📧 STATUS ATUAL:');
console.log('✅ Email do "Geni Chat" está chegando corretamente');
console.log('❌ Página de confirmação apresentando erro: "Token de confirmação inválido ou ausente"');
console.log('');

// 1. VERIFICAR PÁGINA DE CONFIRMAÇÃO
console.log('1. 📝 VERIFICANDO PÁGINA DE CONFIRMAÇÃO:');
const confirmationPagePath = path.join(__dirname, 'src/pages/EmailConfirmationPage.tsx');

if (fs.existsSync(confirmationPagePath)) {
  console.log('   ✅ EmailConfirmationPage.tsx encontrada');
  
  const pageContent = fs.readFileSync(confirmationPagePath, 'utf8');
  
  // Verificar principais funcionalidades
  const checks = [
    { name: 'Detecta token na URL', pattern: /searchParams\.get\("token"\)/ },
    { name: 'Detecta token_hash na URL', pattern: /searchParams\.get\("token_hash"\)/ },
    { name: 'Função verifyEmailWithToken', pattern: /verifyEmailWithToken/ },
    { name: 'Chamada supabase.auth.verifyOtp', pattern: /supabase\.auth\.verifyOtp/ },
    { name: 'Estado "rejected" implementado', pattern: /status.*rejected/ },
    { name: 'Detecção ConversaAI links', pattern: /detectConversaAILink/ }
  ];
  
  checks.forEach(check => {
    if (check.pattern.test(pageContent)) {
      console.log(`   ✅ ${check.name}`);
    } else {
      console.log(`   ❌ ${check.name} - PROBLEMA!`);
    }
  });
} else {
  console.log('   ❌ EmailConfirmationPage.tsx NÃO ENCONTRADA');
}
console.log('');

// 2. VERIFICAR INTEGRAÇÃO SUPABASE
console.log('2. 🔧 VERIFICANDO INTEGRAÇÃO SUPABASE:');
const supabaseClientPath = path.join(__dirname, 'src/integrations/supabase/client.ts');

if (fs.existsSync(supabaseClientPath)) {
  console.log('   ✅ Cliente Supabase encontrado');
  
  const clientContent = fs.readFileSync(supabaseClientPath, 'utf8');
  
  if (clientContent.includes('createClient')) {
    console.log('   ✅ createClient configurado');
  } else {
    console.log('   ❌ createClient NÃO configurado');
  }
} else {
  console.log('   ❌ Cliente Supabase NÃO ENCONTRADO');
}
console.log('');

// 3. ANALISAR PROBLEMA ESPECÍFICO
console.log('3. 🎯 ANÁLISE DO PROBLEMA ESPECÍFICO:');
console.log('');

console.log('📋 POSSÍVEIS CAUSAS DO ERRO:');
console.log('');

console.log('1. ❌ FORMATO DO LINK DE CONFIRMAÇÃO:');
console.log('   • O link do email do Geni Chat pode ter formato diferente do esperado');
console.log('   • Links do Supabase padrão usam #access_token em vez de ?token=');
console.log('   • A página pode não estar detectando o token corretamente');
console.log('');

console.log('2. ❌ MÉTODO DE VERIFICAÇÃO INCORRETO:');
console.log('   • Usando verifyOtp() mas deveria usar getSession() após redirect');
console.log('   • Links do Supabase padrão fazem redirect automático');
console.log('   • Token pode estar no hash (#) em vez de query params (?)');
console.log('');

console.log('3. ❌ CONFIGURAÇÃO DE REDIRECT:');
console.log('   • emailRedirectTo pode estar incorreto');
console.log('   • URL de confirmação pode não estar batendo com a rota');
console.log('');

console.log('🚀 SOLUÇÕES PARA TESTAR:');
console.log('');

console.log('1. 📝 MODIFICAR DETECÇÃO DE TOKEN:');
console.log('   • Verificar tanto query params (?token=) quanto hash (#access_token=)');
console.log('   • Adicionar logs para ver que parâmetros estão chegando');
console.log('');

console.log('2. 🔧 AJUSTAR MÉTODO DE VERIFICAÇÃO:');
console.log('   • Se não há token explícito, verificar se usuário já está autenticado');
console.log('   • Usar getSession() para verificar se redirect foi bem-sucedido');
console.log('');

console.log('3. 🔍 ADICIONAR DEBUG:');
console.log('   • Logar todos os parâmetros da URL');
console.log('   • Verificar o que realmente está chegando na página');
console.log('');

console.log('⚡ AÇÃO IMEDIATA RECOMENDADA:');
console.log('');
console.log('Modificar EmailConfirmationPage.tsx para:');
console.log('1. Logar todos os parâmetros da URL recebidos');
console.log('2. Verificar se usuário já está autenticado (caso do redirect automático)');
console.log('3. Melhorar detecção de diferentes formatos de token');
console.log('4. Adicionar tratamento específico para links do Supabase padrão');
console.log('');

console.log('🧪 COMO TESTAR:');
console.log('1. Abrir console do navegador');
console.log('2. Clicar no link do email "Geni Chat"');
console.log('3. Verificar logs na página de confirmação');
console.log('4. Ver exatamente que parâmetros estão sendo recebidos');
console.log('');

console.log('📞 PRÓXIMO PASSO:');
console.log('Vamos modificar a página de confirmação para melhor diagnóstico e correção!');
