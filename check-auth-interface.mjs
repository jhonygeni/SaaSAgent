#!/usr/bin/env node

// Script para verificar opções de configuração de Auth Hooks disponíveis
console.log('🔍 Verificando opções de Auth Hooks disponíveis...');

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const serviceKey = 'process.env.SUPABASE_ANON_KEY || ""';

async function checkAuthOptions() {
  try {
    // Tentar verificar configurações atuais de Auth
    const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const settings = await response.json();
      console.log('✅ Configurações atuais de Auth:');
      console.log(JSON.stringify(settings, null, 2));
    } else {
      console.log('❌ Não foi possível acessar configurações via API');
      console.log('Status:', response.status);
      console.log('Response:', await response.text());
    }
  } catch (error) {
    console.log('❌ Erro ao verificar configurações:', error.message);
  }

  console.log('\n📋 Aguardando print da interface do console para instruções precisas...');
}

checkAuthOptions();
