#!/usr/bin/env node

/**
 * Script de verificação rápida para testar a configuração da API
 * Executa testes básicos de conectividade e configuração
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Verificação Rápida da Configuração API\n');

// 1. Verificar arquivos de configuração
console.log('1. Verificando arquivos de configuração...');

const configFiles = [
  '.env.local',
  '.env',
  'vite.config.ts',
  'src/config/api.ts',
  'src/services/whatsapp/secureApiClient.ts'
];

configFiles.forEach(file => {
  const filePath = join(__dirname, file);
  if (existsSync(filePath)) {
    console.log(`   ✅ ${file} existe`);
  } else {
    console.log(`   ❌ ${file} não encontrado`);
  }
});

// 2. Verificar variáveis de ambiente
console.log('\n2. Verificando variáveis de ambiente...');

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_API_BASE_URL',
  'VITE_EVOLUTION_API_URL',
  'VITE_WEBHOOK_URL'
];

// Carregar .env.local se existir
const envLocalPath = join(__dirname, '.env.local');
if (existsSync(envLocalPath)) {
  const envContent = readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar} configurado`);
  } else {
    console.log(`   ⚠️  ${envVar} não configurado`);
  }
});

// 3. Verificar URLs
console.log('\n3. Verificando URLs de configuração...');

const urls = {
  'API Base': process.env.VITE_API_BASE_URL || 'não configurado',
  'Evolution API': process.env.VITE_EVOLUTION_API_URL || 'não configurado',
  'Webhook': process.env.VITE_WEBHOOK_URL || 'não configurado',
  'Supabase': process.env.VITE_SUPABASE_URL || 'não configurado'
};

Object.entries(urls).forEach(([name, url]) => {
  console.log(`   📍 ${name}: ${url}`);
});

// 4. Verificar estrutura de API routes
console.log('\n4. Verificando estrutura de API routes...');

const apiRoutes = [
  'api/evolution',
  'api/test-evolution'
];

apiRoutes.forEach(route => {
  const routePath = join(__dirname, route);
  if (existsSync(routePath)) {
    console.log(`   ✅ ${route} existe`);
  } else {
    console.log(`   ❌ ${route} não encontrado`);
  }
});

// 5. Teste de conectividade básica (se estiver online)
console.log('\n5. Executando teste de conectividade...');

async function testConnectivity() {
  try {
    // Teste básico de DNS/conectividade
    const testUrls = [
      'https://ia.geni.chat',
      'https://cloudsaas.geni.chat', 
      'https://webhooksaas.geni.chat'
    ];

    for (const url of testUrls) {
      try {
        const response = await fetch(url, { 
          method: 'HEAD', 
          signal: AbortSignal.timeout(5000) 
        });
        console.log(`   ✅ ${url} - Status: ${response.status}`);
      } catch (error) {
        console.log(`   ❌ ${url} - Erro: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Erro no teste de conectividade: ${error.message}`);
  }
}

// Executar teste de conectividade
testConnectivity().then(() => {
  console.log('\n📋 Resumo da Verificação:');
  console.log('   - Verifique se todas as variáveis de ambiente estão configuradas');
  console.log('   - Certifique-se de que os API routes existem');
  console.log('   - Teste a conectividade usando test-connectivity-final.html');
  console.log('   - Em produção, configure VITE_API_BASE_URL=https://ia.geni.chat');
  console.log('\n✨ Verificação concluída!');
});
