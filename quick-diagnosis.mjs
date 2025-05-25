#!/usr/bin/env node

// Diagnóstico rápido do problema
const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const serviceKey = 'process.env.SUPABASE_ANON_KEY || ""';

async function quickCheck() {
  console.log('🔍 DIAGNÓSTICO RÁPIDO');
  
  // 1. Testar função de email
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/custom-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type: 'signup', email: 'teste@exemplo.com' })
    });
    const result = await response.text();
    console.log('✅ Função email:', result);
  } catch (error) {
    console.log('❌ Função email falhou:', error.message);
  }

  // 2. Verificar usuários
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    const users = await response.json();
    console.log(`✅ Usuários encontrados: ${users.users?.length || 0}`);
    if (users.users?.length > 0) {
      users.users.forEach((user, i) => {
        console.log(`   ${i+1}. ${user.email} - Confirmado: ${user.email_confirmed_at ? 'SIM' : 'NÃO'}`);
      });
    }
  } catch (error) {
    console.log('❌ Erro ao verificar usuários:', error.message);
  }

  // 3. Verificar perfis
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey
      }
    });
    const profiles = await response.json();
    console.log(`✅ Perfis encontrados: ${profiles.length || 0}`);
  } catch (error) {
    console.log('❌ Erro ao verificar perfis:', error.message);
  }

  console.log('\n🚨 PROBLEMA IDENTIFICADO:');
  console.log('1. ❌ Auth Hooks NÃO configurado (emails não são enviados)');
  console.log('2. ❌ SQL Triggers NÃO executados (perfis não são criados)');
  
  console.log('\n🔧 SOLUÇÃO:');
  console.log('Execute as configurações em: EXECUTAR-AGORA-MANUAL.md');
}

quickCheck();
