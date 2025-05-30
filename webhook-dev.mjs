#!/usr/bin/env node

/**
 * Script de desenvolvimento para webhook
 * Facilita o desenvolvimento e teste do sistema de webhook
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Executando: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Comando falhou com código ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function setupEnvironment() {
  console.log('🔧 Configurando ambiente de desenvolvimento...\n');
  
  try {
    // Verificar se package.json existe e instalar dependências se necessário
    await runCommand('npm', ['install']);
    console.log('✅ Dependências instaladas\n');
  } catch (error) {
    console.error('❌ Erro ao instalar dependências:', error.message);
  }
}

async function runSetup() {
  console.log('📋 Executando configuração do webhook...\n');
  
  try {
    await runCommand('node', ['setup-webhook.mjs']);
    console.log('\n✅ Configuração concluída\n');
  } catch (error) {
    console.error('❌ Erro na configuração:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Executando testes do webhook...\n');
  
  try {
    await runCommand('node', ['test-webhook.mjs']);
    console.log('\n✅ Testes concluídos\n');
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

async function startDevelopment() {
  console.log('🚀 Iniciando servidor de desenvolvimento...\n');
  
  try {
    // Executar npm run dev em background
    const child = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });
    
    console.log('✅ Servidor iniciado! Acesse http://localhost:3000');
    console.log('📊 Monitor de webhooks: http://localhost:3000/admin/webhooks');
    console.log('\n⚠️  Para parar o servidor, pressione Ctrl+C\n');
    
    // Aguardar o processo
    return new Promise((resolve, reject) => {
      child.on('close', resolve);
      child.on('error', reject);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error.message);
  }
}

async function showHelp() {
  console.log('🎯 WEBHOOK DEV - Conversa AI Brasil\n');
  console.log('Comandos disponíveis:');
  console.log('  setup     - Configurar ambiente e webhook');
  console.log('  test      - Executar testes do webhook');
  console.log('  dev       - Iniciar servidor de desenvolvimento');
  console.log('  all       - Executar setup + test + dev');
  console.log('  help      - Mostrar esta ajuda');
  console.log('\nExemplos:');
  console.log('  node webhook-dev.mjs setup');
  console.log('  node webhook-dev.mjs test');
  console.log('  node webhook-dev.mjs dev');
  console.log('  node webhook-dev.mjs all');
}

async function runAll() {
  console.log('🎯 Executando configuração completa...\n');
  
  await setupEnvironment();
  await runSetup();
  await runTests();
  
  console.log('🚀 Tudo pronto! Iniciando servidor...\n');
  await startDevelopment();
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'setup':
      await setupEnvironment();
      await runSetup();
      break;
      
    case 'test':
      await runTests();
      break;
      
    case 'dev':
      await startDevelopment();
      break;
      
    case 'all':
      await runAll();
      break;
      
    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;
      
    default:
      console.log('❓ Comando não reconhecido. Use "help" para ver os comandos disponíveis.\n');
      showHelp();
      break;
  }
}

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', () => {
  console.log('\n👋 Encerrando webhook-dev...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Encerrando webhook-dev...');
  process.exit(0);
});

main().catch((error) => {
  console.error('💥 Erro:', error.message);
  process.exit(1);
});
