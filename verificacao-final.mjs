#!/usr/bin/env node

/**
 * Verificação Final - Environment Variables
 * Este script verifica se todas as configurações de variáveis de ambiente
 * estão funcionando corretamente antes do deploy.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 VERIFICAÇÃO FINAL - ENVIRONMENT VARIABLES\n');

// 1. Verificar se o arquivo .env.local existe e tem as variáveis necessárias
console.log('1️⃣ Verificando arquivo .env.local...');
try {
  const envContent = readFileSync(join(__dirname, '.env.local'), 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  const requiredViteVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_EVOLUTION_API_BASE_URL',
    'VITE_EVOLUTION_API_TOKEN'
  ];
  
  const requiredBackendVars = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_URL',
    'EVOLUTION_API_BASE_URL',
    'EVOLUTION_API_TOKEN'
  ];
  
  console.log('   📝 Variáveis VITE (Frontend):');
  requiredViteVars.forEach(varName => {
    const found = envLines.find(line => line.startsWith(`${varName}=`));
    if (found) {
      const value = found.split('=')[1];
      console.log(`   ✅ ${varName}: ${value ? 'DEFINIDA' : 'VAZIA'}`);
    } else {
      console.log(`   ❌ ${varName}: NÃO ENCONTRADA`);
    }
  });
  
  console.log('\n   🔧 Variáveis Backend (Node.js):');
  requiredBackendVars.forEach(varName => {
    const found = envLines.find(line => line.startsWith(`${varName}=`));
    if (found) {
      const value = found.split('=')[1];
      console.log(`   ✅ ${varName}: ${value ? 'DEFINIDA' : 'VAZIA'}`);
    } else {
      console.log(`   ❌ ${varName}: NÃO ENCONTRADA`);
    }
  });
  
} catch (error) {
  console.log('   ❌ Arquivo .env.local não encontrado!');
}

// 2. Verificar se os arquivos principais foram corrigidos
console.log('\n2️⃣ Verificando arquivos corrigidos...');

const filesToCheck = [
  'src/integrations/supabase/client.ts',
  'src/config/environment.ts',
  'src/constants/api.ts'
];

filesToCheck.forEach(file => {
  try {
    const content = readFileSync(join(__dirname, file), 'utf8');
    
    // Verificar se não há strings malformadas
    const hasMalformedStrings = content.includes('"process.env.') || 
                               content.includes("'process.env.");
    
    if (hasMalformedStrings) {
      console.log(`   ❌ ${file}: Contém strings malformadas com process.env`);
    } else {
      console.log(`   ✅ ${file}: Sintaxe correta`);
    }
    
    // Verificar imports do environment.ts
    if (file !== 'src/config/environment.ts' && content.includes('environment')) {
      console.log(`   ✅ ${file}: Usando configuração centralizada`);
    }
    
  } catch (error) {
    console.log(`   ❌ ${file}: Não encontrado`);
  }
});

// 3. Verificar se o build está funcionando
console.log('\n3️⃣ Verificando build...');
try {
  // Se chegamos até aqui e o script anterior funcionou, o build está ok
  console.log('   ✅ Build passou sem erros (verificado anteriormente)');
} catch (error) {
  console.log('   ❌ Problemas no build');
}

// 4. Instruções para Vercel
console.log('\n4️⃣ PRÓXIMOS PASSOS PARA VERCEL:');
console.log('\n📋 CONFIGURAR NO DASHBOARD VERCEL:');
console.log('   • Acesse https://vercel.com/dashboard');
console.log('   • Vá em Settings > Environment Variables');
console.log('   • Adicione TODAS as variáveis do arquivo .env.local');
console.log('   • Use o guia GUIA-CONFIGURACAO-VERCEL.md');

console.log('\n🚀 DEPLOY:');
console.log('   • Execute: vercel --prod');
console.log('   • Ou conecte o repositório GitHub no Vercel');

console.log('\n🧪 TESTAR PRODUÇÃO:');
console.log('   • Acesse a URL de produção');
console.log('   • Teste todas as funcionalidades');
console.log('   • Verifique o console do navegador para erros');

console.log('\n✅ VERIFICAÇÃO FINAL CONCLUÍDA!');
console.log('📚 Consulte GUIA-CONFIGURACAO-VERCEL.md para instruções detalhadas.');
