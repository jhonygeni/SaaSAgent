#!/usr/bin/env node

/**
 * Teste rápido das variáveis de ambiente no modo desenvolvimento
 */

import { config } from 'dotenv';

// Carregar .env e .env.local
config({ path: '.env' });
config({ path: '.env.local', override: true });

console.log('🧪 TESTE DE VARIÁVEIS DE AMBIENTE - MODO DESENVOLVIMENTO');
console.log('======================================================');

const requiredViteVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_EVOLUTION_API_URL',
  'VITE_EVOLUTION_API_TOKEN'
];

console.log('📋 Variáveis VITE_ (Frontend):');
requiredViteVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${value.length > 50 ? value.substring(0, 20) + '...' : value}`);
  } else {
    console.log(`   ❌ ${varName}: NÃO DEFINIDA`);
  }
});

console.log('\n📋 Outras variáveis importantes:');
['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'NODE_ENV'].forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ✅ ${varName}: ${value.length > 50 ? value.substring(0, 20) + '...' : value}`);
  } else {
    console.log(`   ❌ ${varName}: NÃO DEFINIDA`);
  }
});

// Simular o que o Vite faria
console.log('\n🔍 Simulação de carregamento do Vite:');
console.log('import.meta.env.VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL || 'UNDEFINED');
console.log('import.meta.env.VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'DEFINED' : 'UNDEFINED');

if (!process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('\n❌ PROBLEMA IDENTIFICADO: VITE_SUPABASE_ANON_KEY não está definida!');
  console.log('💡 SOLUÇÃO: Certifique-se de que está no arquivo .env ou .env.local');
} else {
  console.log('\n✅ Todas as variáveis Vite estão configuradas corretamente!');
}
