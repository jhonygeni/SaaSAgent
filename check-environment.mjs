#!/usr/bin/env node

/**
 * SCRIPT DE VERIFICAÇÃO DE AMBIENTE
 * Verifica todas as configurações necessárias para evitar tela branca
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 VERIFICAÇÃO COMPLETA DO AMBIENTE\n');

let hasErrors = false;

// 1. Verificar arquivos essenciais
console.log('1️⃣ Verificando arquivos essenciais...');
const essentialFiles = [
  'src/main.tsx',
  'src/App.tsx',
  'src/config/environment.ts',
  'src/integrations/supabase/client.ts',
  '.env.local',
  'index.html'
];

essentialFiles.forEach(file => {
  const fullPath = join(__dirname, file);
  if (existsSync(fullPath)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - ARQUIVO AUSENTE!`);
    hasErrors = true;
  }
});

// 2. Verificar variáveis de ambiente
console.log('\n2️⃣ Verificando variáveis de ambiente...');
try {
  const envContent = readFileSync(join(__dirname, '.env.local'), 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_EVOLUTION_API_URL',
    'VITE_EVOLUTION_API_TOKEN'
  ];
  
  requiredVars.forEach(varName => {
    const found = envLines.find(line => line.startsWith(`${varName}=`));
    if (found) {
      const value = found.split('=')[1];
      if (value && value.trim() !== '') {
        console.log(`   ✅ ${varName}: DEFINIDA`);
      } else {
        console.log(`   ❌ ${varName}: VAZIA!`);
        hasErrors = true;
      }
    } else {
      console.log(`   ❌ ${varName}: NÃO ENCONTRADA!`);
      hasErrors = true;
    }
  });
  
} catch (error) {
  console.log('   ❌ .env.local não encontrado ou ilegível!');
  hasErrors = true;
}

// 3. Verificar estrutura do HTML
console.log('\n3️⃣ Verificando index.html...');
try {
  const htmlContent = readFileSync(join(__dirname, 'index.html'), 'utf8');
  
  if (htmlContent.includes('<div id="root">')) {
    console.log('   ✅ Elemento #root encontrado');
  } else {
    console.log('   ❌ Elemento #root não encontrado!');
    hasErrors = true;
  }
  
  if (htmlContent.includes('src="/src/main.tsx"') || htmlContent.includes('src="./src/main.tsx"')) {
    console.log('   ✅ Script main.tsx referenciado');
  } else {
    console.log('   ❌ Script main.tsx não referenciado!');
    hasErrors = true;
  }
  
} catch (error) {
  console.log('   ❌ index.html não encontrado!');
  hasErrors = true;
}

// 4. Verificar configuração do Supabase
console.log('\n4️⃣ Verificando configuração do Supabase...');
try {
  const clientContent = readFileSync(join(__dirname, 'src/integrations/supabase/client.ts'), 'utf8');
  
  if (clientContent.includes('createClient')) {
    console.log('   ✅ createClient importado');
  } else {
    console.log('   ❌ createClient não encontrado!');
    hasErrors = true;
  }
  
  if (clientContent.includes('SUPABASE_CONFIG')) {
    console.log('   ✅ Usando configuração centralizada');
  } else {
    console.log('   ⚠️  Não está usando configuração centralizada');
  }
  
} catch (error) {
  console.log('   ❌ Arquivo client.ts não encontrado!');
  hasErrors = true;
}

// 5. Verificar package.json
console.log('\n5️⃣ Verificando package.json...');
try {
  const packageContent = readFileSync(join(__dirname, 'package.json'), 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  const requiredDeps = [
    'react',
    'react-dom',
    'vite',
    '@supabase/supabase-js'
  ];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`   ✅ ${dep}`);
    } else {
      console.log(`   ❌ ${dep} - DEPENDÊNCIA AUSENTE!`);
      hasErrors = true;
    }
  });
  
  // Verificar scripts
  if (packageJson.scripts?.dev) {
    console.log('   ✅ Script dev configurado');
  } else {
    console.log('   ❌ Script dev não configurado!');
    hasErrors = true;
  }
  
  if (packageJson.scripts?.build) {
    console.log('   ✅ Script build configurado');
  } else {
    console.log('   ❌ Script build não configurado!');
    hasErrors = true;
  }
  
} catch (error) {
  console.log('   ❌ package.json não encontrado ou inválido!');
  hasErrors = true;
}

// 6. Resultado final
console.log('\n📊 RESULTADO DA VERIFICAÇÃO:');
if (hasErrors) {
  console.log('❌ PROBLEMAS ENCONTRADOS! Corrija os erros acima antes de continuar.');
  console.log('\n🔧 COMANDOS PARA CORREÇÃO:');
  console.log('   npm install                    # Instalar dependências');
  console.log('   npm run build                  # Testar build');
  console.log('   npm run dev                    # Iniciar desenvolvimento');
  console.log('   npm run preview                # Testar produção local');
  process.exit(1);
} else {
  console.log('✅ TUDO OK! Ambiente configurado corretamente.');
  console.log('\n🚀 PRÓXIMOS PASSOS:');
  console.log('   npm run dev                    # Iniciar desenvolvimento');
  console.log('   npm run build && npm run preview # Testar produção');
  process.exit(0);
}
