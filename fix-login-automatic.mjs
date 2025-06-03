#!/usr/bin/env node

// Script para aplicar correção automática do problema de login
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fixLoginProblem() {
  console.log('🔐 CORREÇÃO AUTOMÁTICA DO PROBLEMA DE LOGIN');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar usuários com email não confirmado
    console.log('\n1. 🔍 VERIFICANDO USUÁRIOS NÃO CONFIRMADOS...');
    
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao listar usuários:', usersError.message);
      return false;
    }

    const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
    console.log(`📊 Total de usuários: ${users.users.length}`);
    console.log(`❌ Usuários não confirmados: ${unconfirmedUsers.length}`);
    
    if (unconfirmedUsers.length === 0) {
      console.log('✅ Todos os usuários já estão confirmados!');
      return await testLogin();
    }

    // 2. Confirmar usuários não confirmados
    console.log('\n2. ✅ CONFIRMANDO USUÁRIOS...');
    
    let successCount = 0;
    for (const user of unconfirmedUsers) {
      try {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          email_confirm: true
        });
        
        if (error) {
          console.log(`   ❌ Falha ao confirmar ${user.email}: ${error.message}`);
        } else {
          console.log(`   ✅ Confirmado: ${user.email}`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Erro ao confirmar ${user.email}: ${err.message}`);
      }
    }

    console.log(`\n📊 RESULTADO: ${successCount}/${unconfirmedUsers.length} usuários confirmados`);

    // 3. Verificar resultado
    console.log('\n3. 🔍 VERIFICANDO RESULTADO...');
    
    const { data: updatedUsers, error: checkError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (checkError) {
      console.error('❌ Erro ao verificar usuários:', checkError.message);
    } else {
      const stillUnconfirmed = updatedUsers.users.filter(user => !user.email_confirmed_at);
      console.log(`✅ Usuários confirmados agora: ${updatedUsers.users.length - stillUnconfirmed.length}`);
      console.log(`❌ Ainda não confirmados: ${stillUnconfirmed.length}`);
    }

    // 4. Testar login
    return await testLogin();

  } catch (error) {
    console.error('❌ Erro na correção:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n4. 🧪 TESTANDO LOGIN...');
  
  const supabaseClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc');
  
  // Teste de signup
  const testEmail = `teste-login-${Date.now()}@example.com`;
  
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: 'senha123!@#'
    });
    
    if (error) {
      console.log('❌ Signup erro:', error.message);
      
      if (error.message.includes('Email not confirmed')) {
        console.log('\n🚨 PROBLEMA AINDA EXISTE:');
        console.log('   Email confirmation ainda está bloqueando signup');
        console.log('\n💡 PRÓXIMOS PASSOS:');
        console.log('   1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/settings');
        console.log('   2. Desabilite "Enable email confirmations"');
        console.log('   3. OU configure SMTP adequadamente');
        return false;
      }
    } else {
      console.log('✅ Signup sucesso!');
      console.log('📧 Email auto-confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
      
      if (data.user?.email_confirmed_at) {
        console.log('\n🎉 PROBLEMA RESOLVIDO!');
        console.log('   ✅ Novos usuários são confirmados automaticamente');
        console.log('   ✅ Login deve funcionar normalmente');
        return true;
      } else {
        console.log('\n⚠️ Email confirmation ainda necessário');
        console.log('   Configure SMTP ou desabilite email confirmation');
        return false;
      }
    }
  } catch (err) {
    console.error('❌ Erro no teste:', err.message);
    return false;
  }
}

async function main() {
  const success = await fixLoginProblem();
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 CORREÇÃO APLICADA COM SUCESSO!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('   1. Teste login em: http://localhost:5173/login');
    console.log('   2. Verifique se cadastro funciona normalmente');
    console.log('   3. Configure SMTP para email confirmation (opcional)');
  } else {
    console.log('❌ CORREÇÃO PARCIAL OU PROBLEMA PERSISTENTE');
    console.log('\n📋 AÇÕES MANUAIS NECESSÁRIAS:');
    console.log('   1. Execute: FIX-LOGIN-EMAIL-CONFIRMATION.sql no Supabase');
    console.log('   2. Desabilite email confirmation temporariamente');
    console.log('   3. Consulte: RESOLUCAO-PROBLEMA-LOGIN.md');
  }
  
  console.log('\n📚 DOCUMENTAÇÃO:');
  console.log('   - Guia completo: RESOLUCAO-PROBLEMA-LOGIN.md');
  console.log('   - SQL de correção: FIX-LOGIN-EMAIL-CONFIRMATION.sql');
}

main().catch(console.error);
