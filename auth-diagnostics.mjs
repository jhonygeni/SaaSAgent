#!/usr/bin/env node

/**
 * Diagnóstico de autenticação para verificar problemas de loop infinito
 * Usado para verificar a solução implementada para o problema de autenticação
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuração básica
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = __dirname;

console.log('🔍 Diagnóstico de Autenticação');
console.log('==============================');

// Verifica presença dos arquivos principais
const FILES_TO_CHECK = [
  'src/context/UserContext.tsx',
  'src/context/UserContext.fixed.tsx',
  'src/lib/subscription-throttle.ts',
  'src/utils/auth-diagnostic.ts',
  'src/components/AuthDiagnosticButton.tsx',
  'src/utils/injectAuthDebugger.ts',
  'SOLUCAO-LOOP-AUTENTICACAO.md'
];

console.log('\n1. Verificando arquivos da solução...');
const missingFiles = [];

FILES_TO_CHECK.forEach(file => {
  const filePath = path.join(PROJECT_ROOT, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} encontrado`);
  } else {
    console.log(`❌ ${file} não encontrado`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('\n⚠️ Alguns arquivos da solução estão faltando. Verificar a implementação.');
} else {
  console.log('\n✅ Todos os arquivos da solução estão presentes.');
}

// Verificar trechos de código chave
console.log('\n2. Verificando implementações críticas...');

function checkCodeImplementation(filePath, patterns) {
  const fullPath = path.join(PROJECT_ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    return {
      success: false,
      message: `Arquivo ${filePath} não encontrado`
    };
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const results = [];
  
  patterns.forEach(pattern => {
    const { name, regex } = pattern;
    const found = regex.test(content);
    results.push({
      name,
      found
    });
  });
  
  return {
    success: results.every(r => r.found),
    results
  };
}

// Definir os padrões críticos a verificar
const userContextPatterns = [
  { 
    name: 'Ref para controle de inicialização',
    regex: /const\s+initializationAttempted\s*=\s*useRef\(\s*false\s*\)/
  },
  { 
    name: 'Proteção contra inicialização múltipla',
    regex: /if\s*\(\s*initializationAttempted\.current\s*\)/
  },
  { 
    name: 'Tracking de eventos',
    regex: /logAuthEvent/
  },
  { 
    name: 'Reset de cache',
    regex: /resetSubscriptionCache/
  }
];

const throttlePatterns = [
  { 
    name: 'Contadores de verificação',
    regex: /checkCount\+\+/
  },
  {
    name: 'Intervalo estendido',
    regex: /EXTENDED_INTERVAL/
  },
  {
    name: 'Tratamento de erros',
    regex: /catch\s*\(\s*error\s*\)/
  }
];

const diagnosticPatterns = [
  {
    name: 'Detecção de loops',
    regex: /detectLoopPatterns/
  },
  {
    name: 'Inspeção de localStorage',
    regex: /checkLocalStorage/
  }
];

// Executar verificações
console.log('\nVerificando UserContext.tsx...');
const userContextCheck = checkCodeImplementation('src/context/UserContext.tsx', userContextPatterns);
userContextCheck.results.forEach(result => {
  console.log(`${result.found ? '✅' : '❌'} ${result.name}`);
});

console.log('\nVerificando subscription-throttle.ts...');
const throttleCheck = checkCodeImplementation('src/lib/subscription-throttle.ts', throttlePatterns);
throttleCheck.results.forEach(result => {
  console.log(`${result.found ? '✅' : '❌'} ${result.name}`);
});

console.log('\nVerificando utilitários de diagnóstico...');
const diagnosticCheck = checkCodeImplementation('src/utils/auth-diagnostic.ts', diagnosticPatterns);
diagnosticCheck.results.forEach(result => {
  console.log(`${result.found ? '✅' : '❌'} ${result.name}`);
});

// Verificar documentação da solução
console.log('\n3. Verificando documentação da solução...');
if (fs.existsSync(path.join(PROJECT_ROOT, 'SOLUCAO-LOOP-AUTENTICACAO.md'))) {
  const docContent = fs.readFileSync(path.join(PROJECT_ROOT, 'SOLUCAO-LOOP-AUTENTICACAO.md'), 'utf8');
  
  // Verifica conteúdo mínimo da documentação
  const hasProblems = docContent.includes('Problema');
  const hasSolution = docContent.includes('Correções Implementadas');
  const hasVerification = docContent.includes('Como Verificar');
  
  console.log(`${hasProblems ? '✅' : '❌'} Descrição do problema`);
  console.log(`${hasSolution ? '✅' : '❌'} Detalhamento das correções`);
  console.log(`${hasVerification ? '✅' : '❌'} Instruções de verificação`);
} else {
  console.log('❌ Documentação da solução não encontrada');
}

// Resumo final
console.log('\n4. Resumo do diagnóstico');

const allChecks = [
  { name: 'Arquivos', success: missingFiles.length === 0 },
  { name: 'UserContext', success: userContextCheck.success },
  { name: 'Throttling', success: throttleCheck.success },
  { name: 'Diagnóstico', success: diagnosticCheck.success },
];

const allSuccess = allChecks.every(check => check.success);

console.log('\nStatus da implementação:');
allChecks.forEach(check => {
  console.log(`${check.success ? '✅' : '❌'} ${check.name}`);
});

console.log('\n=== CONCLUSÃO ===');
if (allSuccess) {
  console.log('✅ A solução para o problema de loop infinito está completamente implementada.');
  console.log('   Recomenda-se testar em diferentes navegadores e condições.');
} else {
  console.log('⚠️ A solução está parcialmente implementada ou possui problemas.');
  console.log('   Revise os itens marcados como falha acima.');
}

console.log('\nPróximos passos:');
console.log('1. Execute o aplicativo e teste o fluxo de autenticação');
console.log('2. Utilize o botão de diagnóstico (Auth Debug) para monitorar o estado');
console.log('3. Verifique o Console do navegador para mensagens de diagnóstico');
console.log('4. Se necessário, use window.__AUTH_DEBUG__ no console para depuração manual');

console.log('\n🏁 Diagnóstico concluído.');
