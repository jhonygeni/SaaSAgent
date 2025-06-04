#!/usr/bin/env node

/**
 * DIAGNÓSTICO COMPLETO - URLs MALFORMADAS
 * 
 * Este script identifica e corrige problemas de URLs malformadas
 * que aparecem nos logs como "cloudsaas.geni.chatundefined"
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cores para output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`${BLUE}${BOLD}🔍 DIAGNÓSTICO DE URLs MALFORMADAS${RESET}`);
console.log('='.repeat(60));

// Carregar variáveis de ambiente
const envPath = join(__dirname, '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envVars = envContent
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        acc[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
      return acc;
    }, {});
  
  console.log(`${GREEN}✅ Arquivo .env.local carregado${RESET}`);
} else {
  console.log(`${RED}❌ Arquivo .env.local não encontrado${RESET}`);
}

// Função para testar URLs
async function testURL(url, description) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const status = response.status;
    const color = status >= 200 && status < 300 ? GREEN : RED;
    console.log(`${color}${status}${RESET} - ${description}: ${url}`);
    return { url, status, success: status >= 200 && status < 300 };
  } catch (error) {
    console.log(`${RED}❌${RESET} - ${description}: ${url} - ${error.message}`);
    return { url, status: 'ERROR', success: false, error: error.message };
  }
}

// 1. VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE
console.log(`\n${BOLD}1. VARIÁVEIS DE AMBIENTE${RESET}`);
console.log('-'.repeat(40));

const criticalVars = [
  'VITE_EVOLUTION_API_URL',
  'VITE_EVOLUTION_API_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

let hasUndefinedVars = false;

criticalVars.forEach(varName => {
  const value = envVars[varName];
  if (!value || value === 'undefined') {
    console.log(`${RED}❌ ${varName}: ${value || 'NÃO DEFINIDA'}${RESET}`);
    hasUndefinedVars = true;
  } else {
    console.log(`${GREEN}✅ ${varName}: ${value.substring(0, 50)}...${RESET}`);
  }
});

// 2. VERIFICAÇÃO DE URLs CONSTRUÍDAS
console.log(`\n${BOLD}2. URLs CONSTRUÍDAS${RESET}`);
console.log('-'.repeat(40));

const baseURL = envVars.VITE_EVOLUTION_API_URL;
const apiKey = envVars.VITE_EVOLUTION_API_KEY;

if (!baseURL || baseURL === 'undefined') {
  console.log(`${RED}❌ URL base malformada: ${baseURL}${RESET}`);
} else {
  console.log(`${GREEN}✅ URL base: ${baseURL}${RESET}`);
}

if (!apiKey || apiKey === 'undefined') {
  console.log(`${RED}❌ API Key malformada: ${apiKey}${RESET}`);
} else {
  console.log(`${GREEN}✅ API Key definida (${apiKey.length} caracteres)${RESET}`);
}

// Construir URLs de teste
const testUrls = [];
if (baseURL && baseURL !== 'undefined') {
  testUrls.push({
    url: `${baseURL}/instance/fetchInstances`,
    description: 'Fetch Instances'
  });
  
  testUrls.push({
    url: `${baseURL}/instance/create`,
    description: 'Create Instance'
  });
  
  testUrls.push({
    url: `${baseURL}/chat/whatsappNumbers`,
    description: 'WhatsApp Numbers'
  });
}

// 3. TESTE DE CONECTIVIDADE
console.log(`\n${BOLD}3. TESTE DE CONECTIVIDADE${RESET}`);
console.log('-'.repeat(40));

const results = [];
for (const test of testUrls) {
  const result = await testURL(test.url, test.description);
  results.push(result);
  await new Promise(resolve => setTimeout(resolve, 100)); // Evitar rate limiting
}

// 4. BUSCA POR PADRÕES PROBLEMÁTICOS NOS ARQUIVOS
console.log(`\n${BOLD}4. ANÁLISE DE CÓDIGO${RESET}`);
console.log('-'.repeat(40));

const filesToCheck = [
  'src/lib/env.ts',
  'src/services/whatsapp/apiClient.ts',
  'src/constants/api.ts',
  'src/components/WhatsappInstanceCard.tsx'
];

for (const filePath of filesToCheck) {
  const fullPath = join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Procurar por padrões problemáticos
    const patterns = [
      /undefined/g,
      /\$\{.*undefined.*\}/g,
      /cloudsaas\.geni\.chatundefined/g,
      /VITE_EVOLUTION_API_TOKEN/g, // Variável incorreta
      /\.env\./g
    ];
    
    patterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        const patternNames = [
          'undefined values',
          'template literals com undefined', 
          'URLs malformadas específicas',
          'variável incorreta VITE_EVOLUTION_API_TOKEN',
          'referências .env'
        ];
        console.log(`${YELLOW}⚠️  ${filePath}: ${matches.length} ocorrências de ${patternNames[index]}${RESET}`);
      }
    });
    
    console.log(`${GREEN}✅ ${filePath} analisado${RESET}`);
  } else {
    console.log(`${RED}❌ ${filePath} não encontrado${RESET}`);
  }
}

// 5. RELATÓRIO FINAL
console.log(`\n${BOLD}5. RELATÓRIO FINAL${RESET}`);
console.log('-'.repeat(40));

if (hasUndefinedVars) {
  console.log(`${RED}❌ PROBLEMA CRÍTICO: Variáveis de ambiente indefinidas${RESET}`);
}

const failedTests = results.filter(r => !r.success);
if (failedTests.length > 0) {
  console.log(`${RED}❌ ${failedTests.length} testes de conectividade falharam${RESET}`);
  failedTests.forEach(test => {
    console.log(`   - ${test.url}: ${test.status}`);
  });
}

const successfulTests = results.filter(r => r.success);
if (successfulTests.length > 0) {
  console.log(`${GREEN}✅ ${successfulTests.length} testes de conectividade bem-sucedidos${RESET}`);
}

// 6. RECOMENDAÇÕES
console.log(`\n${BOLD}6. RECOMENDAÇÕES${RESET}`);
console.log('-'.repeat(40));

if (hasUndefinedVars) {
  console.log(`${YELLOW}🔧 Corrigir variáveis de ambiente indefinidas${RESET}`);
}

if (failedTests.length > 0) {
  console.log(`${YELLOW}🔧 Verificar conectividade com Evolution API${RESET}`);
}

console.log(`${BLUE}🔄 Executar 'npm run build' após correções${RESET}`);
console.log(`${BLUE}🚀 Testar em ambiente de produção${RESET}`);

console.log(`\n${GREEN}${BOLD}✅ Diagnóstico concluído!${RESET}`);
