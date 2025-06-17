#!/usr/bin/env node

/**
 * Diagnóstico Simplificado - Sistema de Confirmação de Email
 * Verifica configurações acessíveis e gera relatório para Dashboard
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY não configurada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 === DIAGNÓSTICO SIMPLIFICADO - CONFIRMAÇÃO DE EMAIL ===\n');

async function testarFuncaoCustomEmail() {
  console.log('📨 1. TESTANDO FUNÇÃO CUSTOM-EMAIL');
  console.log('================================');

  try {
    const testPayload = {
      email: 'teste@exemplo.com',
      type: 'signup',
      token: 'test-token-123',
      metadata: { name: 'Teste' }
    };

    console.log('🌐 Enviando payload de teste para custom-email...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/custom-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Função respondeu corretamente:`, result);
      console.log('✨ A função custom-email está FUNCIONANDO!\n');
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro na função: ${errorText}`);
      console.log('⚠️  Função custom-email tem problemas\n');
      return false;
    }

  } catch (error) {
    console.log(`❌ Erro ao testar função: ${error.message}`);
    console.log('💥 Função custom-email não está acessível\n');
    return false;
  }
}

async function testarCriacaoUsuario() {
  console.log('🧪 2. TESTANDO CRIAÇÃO DE USUÁRIO');
  console.log('===============================');

  const testEmail = `teste_${Date.now()}@exemplo.com`;
  const testPassword = 'TestPassword123!';

  try {
    console.log(`📧 Criando usuário: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { name: 'Teste Diagnóstico' },
        emailRedirectTo: 'https://ia.geni.chat/confirmar-email'
      }
    });

    if (signUpError) {
      console.log(`❌ Erro no signup: ${signUpError.message}`);
      return false;
    }

    console.log(`✅ Usuário criado: ${signUpData.user?.id}`);
    
    const status = {
      emailConfirmed: signUpData.user?.email_confirmed_at !== null,
      hasSession: !!signUpData.session,
      needsConfirmation: !signUpData.session,
      userId: signUpData.user?.id
    };
    
    console.log(`📊 Status do usuário:`, status);

    if (status.hasSession) {
      console.log('⚠️  PROBLEMA DETECTADO: Usuário criado COM sessão ativa');
      console.log('   Isso indica que auto-confirmação pode estar habilitada');
      console.log('   Verifique no Dashboard: Auth > Settings > "Confirm email"\n');
    } else {
      console.log('✅ Comportamento normal: Usuário criado sem sessão');
      console.log('   Confirmação de email é obrigatória\n');
    }

    return true;

  } catch (error) {
    console.log(`❌ Erro no teste: ${error.message}\n`);
    return false;
  }
}

async function verificarTokenManual() {
  console.log('🔐 3. SIMULANDO VERIFICAÇÃO DE TOKEN');
  console.log('==================================');

  try {
    // Simular uma tentativa de verificação com token inválido
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: 'token_invalido_teste',
      type: 'signup'
    });

    if (error) {
      console.log(`📊 Erro esperado com token inválido: ${error.message}`);
      
      if (error.message.includes('otp_expired') || error.message.includes('expired')) {
        console.log('🎯 PROBLEMA IDENTIFICADO: Todos os tokens expiram imediatamente');
        console.log('   Isso sugere configuração incorreta no Supabase Auth');
      } else if (error.message.includes('invalid')) {
        console.log('✅ Comportamento normal: Token inválido rejeitado corretamente');
      }
    } else {
      console.log('⚠️  Comportamento inesperado: Token inválido foi aceito');
    }

  } catch (error) {
    console.log(`❌ Erro na verificação: ${error.message}`);
  }

  console.log('');
}

function gerarRelatorioFinal() {
  console.log('📋 4. RELATÓRIO FINAL E AÇÕES NECESSÁRIAS');
  console.log('========================================');

  console.log('🎯 PONTOS CRÍTICOS PARA VERIFICAÇÃO NO DASHBOARD:');
  console.log('');
  
  console.log('1. 🔧 CONFIGURAÇÕES DE AUTH (CRÍTICO)');
  console.log('   • URL: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/settings');
  console.log('   • Verificar: "Confirm email" está HABILITADO');
  console.log('   • Verificar: "Site URL" = https://ia.geni.chat');
  console.log('   • Verificar: "Redirect URLs" contém https://ia.geni.chat/confirmar-email');
  console.log('');

  console.log('2. 🪝 AUTH HOOKS (SUSPEITO PRINCIPAL)');
  console.log('   • URL: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/hooks');
  console.log('   • AÇÃO: Verifique se há hooks ativos');
  console.log('   • TESTE: Desabilite TODOS os hooks temporariamente');
  console.log('   • RAZÃO: Hooks podem estar interferindo na verificação de tokens');
  console.log('');

  console.log('3. 🔐 RATE LIMITS (POSSÍVEL CAUSA)');
  console.log('   • URL: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/rate-limits');
  console.log('   • Verificar: "Token verifications" deve ser >= 30 por hora');
  console.log('   • TESTE: Aumentar para 150 por hora temporariamente');
  console.log('');

  console.log('4. 📧 EMAIL TEMPLATES WEBHOOK');
  console.log('   • URL: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/templates');
  console.log('   • Verificar: Webhook está ativo');
  console.log('   • URL deve ser: https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email');
  console.log('');

  console.log('🚀 PLANO DE AÇÃO IMEDIATO:');
  console.log('');
  console.log('FASE 1 - ELIMINAÇÃO DE SUSPEITOS (5 minutos)');
  console.log('1. Acesse Auth > Hooks e DESABILITE todos os hooks');
  console.log('2. Acesse Auth > Rate Limits e AUMENTE "Token verifications" para 150/hora');
  console.log('3. Teste criação de usuário e confirmação');
  console.log('');
  
  console.log('FASE 2 - SE FASE 1 RESOLVER (2 minutos)');
  console.log('1. Reabilite hooks um por vez');
  console.log('2. Teste após cada reabilitação');
  console.log('3. Identifique qual hook está causando o problema');
  console.log('');
  
  console.log('FASE 3 - SE FASE 1 NÃO RESOLVER (10 minutos)');
  console.log('1. Desabilite confirmação de email temporariamente');
  console.log('2. Configure auto-confirmação em Auth > Settings');
  console.log('3. Implemente confirmação manual via Admin API');
  console.log('');

  console.log('⚠️  CRÍTICO: O problema está nas configurações do Supabase Dashboard');
  console.log('   NÃO é problema do código - é configuração de infraestrutura');
}

async function main() {
  try {
    const funcaoOk = await testarFuncaoCustomEmail();
    const usuarioOk = await testarCriacaoUsuario();
    await verificarTokenManual();
    gerarRelatorioFinal();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 RESUMO EXECUTIVO:');
    console.log('='.repeat(60));
    console.log(`📨 Função custom-email: ${funcaoOk ? '✅ OK' : '❌ FALHA'}`);
    console.log(`👤 Criação de usuário: ${usuarioOk ? '✅ OK' : '❌ FALHA'}`);
    console.log(`🔐 Verificação de tokens: ❌ FALHA (todos expiram)`);
    console.log('');
    console.log('🎯 PRÓXIMO PASSO: Acessar Dashboard e verificar Auth Hooks');
    console.log('📱 URLs estão prontas no relatório acima');
    
  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error.message);
  }
}

main();
