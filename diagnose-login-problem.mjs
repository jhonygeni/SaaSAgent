#!/usr/bin/env node

// Script para diagnosticar problemas de login
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔐 DIAGNOSTICANDO PROBLEMA DE LOGIN');
  console.log('=' .repeat(50));

  // 1. Verificar conectividade básica
  console.log('\n1. 🌐 TESTANDO CONECTIVIDADE...');
  try {
    const { data, error } = await supabase.from('usage_stats').select('count', { count: 'exact' });
    if (error) {
      console.error('❌ Erro de conectividade:', error.message);
      return false;
    }
    console.log('✅ Conectividade OK');
  } catch (err) {
    console.error('❌ Falha na conectividade:', err.message);
    return false;
  }

  // 2. Listar usuários existentes
  console.log('\n2. 👥 VERIFICANDO USUÁRIOS EXISTENTES...');
  try {
    const { data: authResponse, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erro ao listar usuários (sem service key):', authError.message);
      console.log('ℹ️  Continuando com teste de login manual...');
    } else {
      console.log(`✅ ${authResponse.users.length} usuários encontrados`);
      authResponse.users.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      ID: ${user.id}`);
        console.log(`      Confirmado: ${user.email_confirmed_at ? '✅' : '❌'}`);
        console.log(`      Criado: ${new Date(user.created_at).toLocaleString()}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log('ℹ️  Admin API não acessível (esperado)');
  }

  // 3. Testar criação de usuário de teste
  console.log('\n3. 🧪 TESTANDO CRIAÇÃO DE USUÁRIO...');
  const testEmail = `teste-login-${Date.now()}@exemplo.com`;
  const testPassword = 'senha123!@#';
  
  try {
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Teste Login'
        }
      }
    });

    if (signupError) {
      console.error('❌ Erro no signup:', signupError.message);
      if (signupError.message.includes('rate limit')) {
        console.log('ℹ️  Rate limit - testando com usuário existente...');
        return await testExistingUser();
      }
      return false;
    }

    console.log('✅ Usuário criado com sucesso');
    console.log('   ID:', signupData.user?.id);
    console.log('   Email:', signupData.user?.email);
    console.log('   Confirmado:', signupData.user?.email_confirmed_at ? 'Sim' : 'Não');

    // 4. Tentar fazer login imediatamente
    console.log('\n4. 🔑 TESTANDO LOGIN COM USUÁRIO RECÉM-CRIADO...');
    
    // Aguardar um pouco para o usuário ser processado
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      
      if (loginError.message.includes('Email not confirmed')) {
        console.log('ℹ️  Email não confirmado - isso é esperado se email confirmation estiver habilitado');
        console.log('⚠️  POSSÍVEL CAUSA DO PROBLEMA: Email confirmation habilitado sem configuração SMTP adequada');
        return await checkEmailConfirmationSettings();
      }
      return false;
    }

    console.log('✅ Login bem-sucedido!');
    console.log('   Session ID:', loginData.session?.access_token ? 'OK' : 'FALHA');
    console.log('   User ID:', loginData.user?.id);

    // 5. Fazer logout
    await supabase.auth.signOut();
    console.log('✅ Logout realizado');
    
    return true;

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    return false;
  }
}

async function testExistingUser() {
  console.log('\n🔄 TESTANDO COM USUÁRIOS CONHECIDOS...');
  
  // Tentar com alguns emails comuns de teste
  const testUsers = [
    { email: 'test@example.com', password: 'password123' },
    { email: 'admin@test.com', password: 'admin123' },
    { email: 'user@test.com', password: 'user123' }
  ];

  for (const testUser of testUsers) {
    console.log(`\n   Testando: ${testUser.email}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });

      if (error) {
        console.log(`   ❌ ${error.message}`);
        continue;
      }

      console.log('   ✅ Login bem-sucedido!');
      await supabase.auth.signOut();
      return true;
    } catch (err) {
      console.log(`   ❌ Erro: ${err.message}`);
    }
  }

  console.log('\n❌ Nenhum usuário de teste funcionou');
  return false;
}

async function checkEmailConfirmationSettings() {
  console.log('\n📧 VERIFICANDO CONFIGURAÇÕES DE EMAIL...');
  
  try {
    // Tentar acessar configurações de auth
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': supabaseAnonKey
      }
    });

    if (response.ok) {
      const settings = await response.json();
      console.log('✅ Configurações de auth acessíveis:');
      console.log('   Email confirmation habilitado:', settings.email_confirm ? 'Sim' : 'Não');
      console.log('   SMTP configurado:', settings.smtp_host ? 'Sim' : 'Não');
      
      if (settings.email_confirm && !settings.smtp_host) {
        console.log('\n🔴 PROBLEMA IDENTIFICADO:');
        console.log('   ❌ Email confirmation está habilitado');
        console.log('   ❌ SMTP não está configurado adequadamente');
        console.log('\n💡 SOLUÇÃO:');
        console.log('   1. Configurar SMTP no Dashboard Supabase');
        console.log('   2. OU desabilitar email confirmation para testes');
        return false;
      }
    } else {
      console.log('ℹ️  Não foi possível acessar configurações de auth');
    }
  } catch (err) {
    console.log('ℹ️  Erro ao verificar configurações:', err.message);
  }

  return true;
}

async function main() {
  const success = await testLogin();
  
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('🎉 DIAGNÓSTICO: Login está funcionando normalmente');
    console.log('💡 O problema pode ser específico de um usuário ou configuração local');
  } else {
    console.log('🚨 DIAGNÓSTICO: Problema identificado no sistema de login');
    console.log('💡 Verifique as configurações sugeridas acima');
  }
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('   1. Testar login no navegador com usuário conhecido');
  console.log('   2. Verificar configurações SMTP no Dashboard Supabase');
  console.log('   3. Revisar logs de autenticação no console do navegador');
}

main().catch(console.error);
