#!/usr/bin/env node

/**
 * Script para facilitar o deploy das funções Edge do Supabase
 * 
 * Uso:
 *   node deploy-functions.js [all|function-name]
 * 
 * Exemplos:
 *   node deploy-functions.js all        # Deploy de todas as funções
 *   node deploy-functions.js custom-email  # Deploy apenas da função custom-email
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Diretório que contém as funções
const FUNCTIONS_DIR = path.join(__dirname, 'functions');

// Função para fazer deploy de uma função específica
function deployFunction(funcName) {
  console.log(`\n🚀 Fazendo deploy da função: ${funcName}`);
  
  try {
    const command = `supabase functions deploy ${funcName} --project-ref hpovwcaskorzzrpphgkc`;
    console.log(`Executando: ${command}`);
    
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ Deploy da função ${funcName} concluído com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao fazer deploy da função ${funcName}:`);
    console.error(error.message || error);
    return false;
  }
}

// Função para listar todas as funções disponíveis
function listFunctions() {
  try {
    return fs.readdirSync(FUNCTIONS_DIR)
      .filter(item => fs.statSync(path.join(FUNCTIONS_DIR, item)).isDirectory());
  } catch (error) {
    console.error('Erro ao listar funções:', error);
    return [];
  }
}

// Função principal
function main() {
  const args = process.argv.slice(2);
  const target = args[0] || 'all';
  
  console.log('🔧 Supabase Functions Deployment Tool');
  console.log('------------------------------------');
  
  // Verificar se o usuário está autenticado no Supabase CLI
  try {
    execSync('supabase --version', { stdio: 'pipe' });
  } catch {
    console.error('❌ Supabase CLI não está instalado ou não está no PATH');
    console.error('Instale com: npm install -g supabase');
    process.exit(1);
  }
  
  // Listar todas as funções disponíveis
  const functions = listFunctions();
  
  if (functions.length === 0) {
    console.error('❌ Nenhuma função encontrada no diretório functions/');
    process.exit(1);
  }
  
  console.log(`🔍 Funções disponíveis: ${functions.join(', ')}\n`);
  
  // Fazer deploy com base no argumento fornecido
  if (target === 'all') {
    console.log('🚀 Fazendo deploy de todas as funções...\n');
    
    let success = 0;
    let failed = 0;
    
    for (const func of functions) {
      const result = deployFunction(func);
      result ? success++ : failed++;
    }
    
    console.log('\n📊 Resumo do Deploy:');
    console.log(`✅ Funções com deploy bem-sucedido: ${success}`);
    console.log(`❌ Funções com falha no deploy: ${failed}`);
  } else if (functions.includes(target)) {
    deployFunction(target);
  } else {
    console.error(`❌ Função "${target}" não encontrada.`);
    console.error(`Funções disponíveis: ${functions.join(', ')}`);
    process.exit(1);
  }
}

main();
