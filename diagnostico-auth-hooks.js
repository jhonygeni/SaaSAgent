#!/usr/bin/env node

/**
 * Diagnóstico Auth Hooks - Sistema de Confirmação de Email
 * 
 * Este script verifica se há Auth Hooks ou configurações específicas 
 * que podem estar interferindo no processo de confirmação de email.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_ANON_KEY || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('Configure VITE_SUPABASE_ANON_KEY e VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cliente com service role para acesso admin
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 === DIAGNÓSTICO DE AUTH HOOKS E CONFIGURAÇÕES ===\n');

async function verificarConfiguracaoAuth() {
  console.log('📋 1. VERIFICANDO CONFIGURAÇÕES DE AUTENTICAÇÃO');
  console.log('===============================================');

  try {
    console.log('ℹ️  Configurações obtidas via API admin serão limitadas por segurança');
    console.log('   Para verificação completa, acesse o Dashboard do Supabase:\n');
    console.log('   🌐 https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/hooks');
    console.log('   🌐 https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/templates');
    console.log('   🌐 https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/rate-limits\n');

  } catch (error) {
    console.log(`❌ Erro na verificação: ${error.message}\n`);
  }
}

async function testarProcessoConfirmacao() {
  console.log('🧪 2. TESTANDO PROCESSO DE CONFIRMAÇÃO');
  console.log('====================================');

  const testEmail = `teste_${Date.now()}@exemplo.com`;
  const testPassword = 'TestPassword123!';

  try {
    console.log(`📧 Criando usuário de teste: ${testEmail}`);
    
    // Criar usuário
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { name: 'Teste Diagnóstico' }
      }
    });

    if (signUpError) {
      console.log(`❌ Erro no signup: ${signUpError.message}`);
      return false;
    }

    console.log(`✅ Usuário criado: ${signUpData.user?.id}`);
    console.log(`📊 Estado inicial:`, {
      emailConfirmed: signUpData.user?.email_confirmed_at !== null,
      needsConfirmation: !signUpData.session,
      userId: signUpData.user?.id
    });

    // Se o usuário foi criado mas não há sessão, significa que precisa de confirmação
    if (signUpData.user && !signUpData.session) {
      console.log('🔍 Usuário criado mas sem sessão ativa - confirmação necessária');
      
      // Tentar confirmar manualmente via Admin API
      console.log('🔧 Tentando confirmação manual via Admin API...');
      
      const { data: confirmData, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        signUpData.user.id,
        { email_confirm: true }
      );

      if (confirmError) {
        console.log(`❌ Erro na confirmação manual: ${confirmError.message}`);
      } else {
        console.log(`✅ Confirmação manual bem-sucedida!`);
        console.log(`📊 Dados após confirmação:`, {
          emailConfirmed: confirmData.user?.email_confirmed_at !== null,
          confirmedAt: confirmData.user?.email_confirmed_at
        });
      }
    } else if (signUpData.session) {
      console.log('⚠️  Usuário criado COM sessão ativa - confirmação automática está ATIVA');
      console.log('    Isso pode significar que auto-confirmação está habilitada');
    }

    return true;

  } catch (error) {
    console.log(`❌ Erro no teste: ${error.message}`);
    return false;
  }
}

async function verificarFuncaoCustomEmail() {
  console.log('\n📨 3. VERIFICANDO FUNÇÃO CUSTOM-EMAIL');
  console.log('===================================');

  try {
    // Testar se a função custom-email está respondendo
    const testPayload = {
      email: 'teste@exemplo.com',
      type: 'signup',
      token: 'test-token-123',
      metadata: { name: 'Teste' }
    };

    console.log('🌐 Testando função custom-email...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/custom-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📊 Status da função: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Função respondeu corretamente:`, result);
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro na função: ${errorText}`);
    }

  } catch (error) {
    console.log(`❌ Erro ao testar função: ${error.message}`);
  }
}

async function gerarRelatorioCompleto() {
  console.log('\n📋 4. RELATÓRIO DE DIAGNÓSTICO');
  console.log('============================');

  console.log('🔍 PONTOS DE VERIFICAÇÃO MANUAL NECESSÁRIOS:');
  console.log('');
  console.log('1. 🪝 AUTH HOOKS:');
  console.log('   • Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/hooks');
  console.log('   • Verifique se há hooks ativos que podem estar interferindo');
  console.log('   • Se houver hooks, desabilite temporariamente para teste');
  console.log('');
  
  console.log('2. 📧 EMAIL TEMPLATES:');
  console.log('   • Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/templates');
  console.log('   • Verifique se o webhook está configurado corretamente');
  console.log('   • URL esperada: https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email');
  console.log('');
  
  console.log('3. ⚙️  CONFIGURAÇÕES GERAIS:');
  console.log('   • Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/settings');
  console.log('   • Verifique "Confirm email" está habilitado');
  console.log('   • Verifique "Site URL" está correto: https://ia.geni.chat');
  console.log('   • Verifique "Redirect URLs" incluem: https://ia.geni.chat/confirmar-email');
  console.log('');
  
  console.log('4. 🔐 SEGURANÇA:');
  console.log('   • Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/rate-limits');
  console.log('   • Verifique se os limites de taxa não estão muito restritivos');
  console.log('   • Token verifications deve ser >= 30 por hora');
  console.log('');

  console.log('🎯 PRÓXIMOS PASSOS SUGERIDOS:');
  console.log('');
  console.log('1. Verificar e desabilitar Auth Hooks temporariamente');
  console.log('2. Aumentar limite de "Token verifications" para 150/hora');
  console.log('3. Testar confirmação com hooks desabilitados');
  console.log('4. Se funcionar, o problema são os hooks interferindo');
  console.log('5. Considerar implementar confirmação manual se hooks são necessários');
}

// Executar diagnóstico
async function main() {
  try {
    await verificarConfiguracaoAuth();
    await testarProcessoConfirmacao();
    await verificarFuncaoCustomEmail();
    await gerarRelatorioCompleto();
    
    console.log('\n✅ Diagnóstico concluído!');
    console.log('\n🔧 Para corrigir o problema:');
    console.log('1. Acesse o Dashboard do Supabase');
    console.log('2. Verifique as seções indicadas acima');
    console.log('3. Desabilite hooks temporariamente se existirem');
    console.log('4. Teste novamente o processo de confirmação');
    
  } catch (error) {
    console.error('\n❌ Erro durante diagnóstico:', error.message);
  }
}

main();
