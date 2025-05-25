#!/usr/bin/env node

// Script para verificar opções de configuração de Auth Hooks disponíveis
console.log('🔍 Verificando opções de Auth Hooks disponíveis...');

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

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
