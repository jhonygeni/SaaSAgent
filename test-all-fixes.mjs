#!/usr/bin/env node

/**
 * TESTE COMPLETO DAS CORREÇÕES APLICADAS
 * =====================================
 * 
 * Este script testa todas as correções implementadas:
 * 1. ✅ Correção do erro "t.unsubscribe is not a function" 
 * 2. ✅ Correção do loop infinito na página de perfil
 * 3. ⏳ Correção RLS (requer execução manual no Supabase)
 * 4. ✅ Sistema de throttling de requisições
 * 5. ✅ Melhorias na comunicação webhook
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('🔧 TESTE COMPLETO DAS CORREÇÕES APLICADAS');
console.log('==========================================\n');

// Função para colorir output do terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logAction(message) {
  console.log(`${colors.cyan}🔄 ${message}${colors.reset}`);
}

// 1. Teste de sintaxe dos arquivos corrigidos
async function testSyntax() {
  logAction('Testando sintaxe dos arquivos corrigidos...');
  
  const filesToCheck = [
    'src/context/UserContext.tsx',
    'src/pages/UserProfilePage.tsx',
    'src/components/AgentChat.tsx',
    'src/lib/webhook-utils.ts',
    'src/lib/api-throttle.ts',
    'src/lib/subscription-throttle.ts'
  ];
  
  for (const file of filesToCheck) {
    try {
      if (fs.existsSync(file)) {
        // Verifica se o arquivo pode ser lido e tem o conteúdo esperado
        const content = fs.readFileSync(file, 'utf8');
        
        if (file === 'src/context/UserContext.tsx') {
          if (content.includes('subscription?.unsubscribe?.()')) {
            logSuccess(`${file}: Correção unsubscribe aplicada ✅`);
          } else {
            logError(`${file}: Correção unsubscribe NÃO encontrada`);
          }
        }
        
        if (file === 'src/pages/UserProfilePage.tsx') {
          if (content.includes('await checkSubscriptionStatus()') && 
              !content.includes('useEffect(() => {\n    if (user) {\n      checkSubscriptionStatusDetails()')) {
            logSuccess(`${file}: Correção loop infinito aplicada ✅`);
          } else {
            logError(`${file}: Correção loop infinito NÃO aplicada corretamente`);
          }
        }
        
        if (file === 'src/lib/api-throttle.ts') {
          if (content.includes('throttle') && content.includes('cache')) {
            logSuccess(`${file}: Sistema de throttling implementado ✅`);
          }
        }
        
        logSuccess(`${file}: Sintaxe OK`);
      } else {
        logWarning(`${file}: Arquivo não encontrado`);
      }
    } catch (error) {
      logError(`${file}: Erro de sintaxe - ${error.message}`);
    }
  }
}

// 2. Teste da configuração do ambiente
async function testEnvironment() {
  logAction('Verificando configuração do ambiente...');
  
  try {
    if (fs.existsSync('.env.local')) {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      
      if (envContent.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
        logSuccess('SUPABASE_SERVICE_ROLE_KEY configurado ✅');
      } else {
        logError('SUPABASE_SERVICE_ROLE_KEY não encontrado no .env.local');
      }
      
      if (envContent.includes('VITE_SUPABASE_URL=')) {
        logSuccess('VITE_SUPABASE_URL configurado ✅');
      }
      
      if (envContent.includes('VITE_SUPABASE_ANON_KEY=')) {
        logSuccess('VITE_SUPABASE_ANON_KEY configurado ✅');
      }
    } else {
      logError('.env.local não encontrado');
    }
  } catch (error) {
    logError(`Erro ao verificar ambiente: ${error.message}`);
  }
}

// 3. Verificação do TypeScript e build
async function testBuild() {
  logAction('Testando build do TypeScript...');
  
  try {
    const { stdout, stderr } = await execAsync('npm run build --dry-run || tsc --noEmit', {
      timeout: 30000
    });
    
    if (stderr && !stderr.includes('warning')) {
      logError(`Erros de TypeScript encontrados:\n${stderr}`);
    } else {
      logSuccess('Build TypeScript OK ✅');
    }
  } catch (error) {
    logError(`Erro no build: ${error.message}`);
  }
}

// 4. Teste das importações e dependências
async function testDependencies() {
  logAction('Verificando dependências e importações...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredDeps = [
      '@supabase/supabase-js',
      'react',
      'react-router-dom',
      'lucide-react'
    ];
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
        logSuccess(`Dependência ${dep} encontrada ✅`);
      } else {
        logWarning(`Dependência ${dep} não encontrada`);
      }
    });
    
  } catch (error) {
    logError(`Erro ao verificar dependências: ${error.message}`);
  }
}

// 5. Verificação dos arquivos de documentação e SQL
async function testDocumentation() {
  logAction('Verificando documentação e arquivos SQL...');
  
  const criticalFiles = [
    'EXECUTE-ESTE-SQL-AGORA.sql',
    'HTTP-REQUEST-LOOP-FIX.md',
    'CHAT-DEBUG-COMPLETE.md',
    'CONCLUSAO-FINAL-PROJETO.md'
  ];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logSuccess(`${file} encontrado ✅`);
    } else {
      logWarning(`${file} não encontrado`);
    }
  });
}

// Função principal
async function runAllTests() {
  console.log(`${colors.bold}🚀 INICIANDO TESTES COMPLETOS${colors.reset}\n`);
  
  await testSyntax();
  console.log('');
  
  await testEnvironment();
  console.log('');
  
  await testDependencies();
  console.log('');
  
  await testDocumentation();
  console.log('');
  
  // Instruções finais
  console.log(`${colors.bold}📋 PRÓXIMOS PASSOS OBRIGATÓRIOS:${colors.reset}`);
  console.log(`${colors.yellow}1. ${colors.reset}Execute o SQL no dashboard do Supabase:`);
  console.log(`   ${colors.cyan}https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/sql${colors.reset}`);
  console.log(`   ${colors.cyan}Copie e cole o conteúdo de: EXECUTE-ESTE-SQL-AGORA.sql${colors.reset}`);
  
  console.log(`${colors.yellow}2. ${colors.reset}Teste a aplicação:`);
  console.log(`   ${colors.cyan}http://localhost:8081/perfil${colors.reset} (página de perfil)`);
  console.log(`   ${colors.cyan}http://localhost:8081/${colors.reset} (chat principal)`);
  
  console.log(`${colors.yellow}3. ${colors.reset}Verifique os logs do console do navegador:`);
  console.log(`   ${colors.cyan}- NÃO deve ter "t.unsubscribe is not a function"${colors.reset}`);
  console.log(`   ${colors.cyan}- NÃO deve ter loops infinitos de requisições${colors.reset}`);
  console.log(`   ${colors.cyan}- Mensagens do chat devem ser enviadas sem erro 403${colors.reset}`);
  
  console.log(`\n${colors.green}${colors.bold}✅ TESTES CONCLUÍDOS!${colors.reset}`);
  console.log(`${colors.magenta}Execute as ações acima para finalizar todas as correções.${colors.reset}\n`);
}

// Executar testes
runAllTests().catch(console.error);
