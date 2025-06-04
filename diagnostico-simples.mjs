#!/usr/bin/env node

/**
 * DIAGNÓSTICO SIMPLES - URLs MALFORMADAS
 */

import fs from 'fs';
import { join } from 'path';

console.log('🔍 DIAGNÓSTICO DE URLs MALFORMADAS');
console.log('=' .repeat(50));

// Carregar .env.local
const envPath = '.env.local';
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Arquivo .env.local carregado');
} catch (error) {
  console.log('❌ Erro ao carregar .env.local:', error.message);
  process.exit(1);
}

// Parse das variáveis
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

console.log('\n📋 VARIÁVEIS DE AMBIENTE:');
console.log('-'.repeat(30));

const critical = [
  'VITE_EVOLUTION_API_URL',
  'VITE_EVOLUTION_API_KEY', 
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

critical.forEach(varName => {
  const value = envVars[varName];
  if (value && value !== 'undefined') {
    console.log(`✅ ${varName}: ${value.substring(0, 30)}...`);
  } else {
    console.log(`❌ ${varName}: ${value || 'NÃO DEFINIDA'}`);
  }
});

// Verificar se há 'undefined' nas URLs
const baseUrl = envVars.VITE_EVOLUTION_API_URL;
console.log('\n🔗 TESTE DE URL:');
console.log('-'.repeat(20));

if (baseUrl && !baseUrl.includes('undefined')) {
  console.log(`✅ URL base válida: ${baseUrl}`);
  console.log(`✅ URL de teste: ${baseUrl}/instance/fetchInstances`);
} else {
  console.log(`❌ URL base inválida: ${baseUrl}`);
}

console.log('\n✅ Diagnóstico básico concluído!');
