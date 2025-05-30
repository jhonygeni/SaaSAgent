#!/usr/bin/env node

/**
 * TESTE RÁPIDO - VERIFICAÇÃO INSTANTÂNEA
 * Execute este script para verificar se tudo está funcionando
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('🚀 TESTE RÁPIDO DA APLICAÇÃO\n');

async function runCommand(command, args = [], timeout = 10000) {
  return new Promise((resolve, reject) => {
    console.log(`▶️  Executando: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, { 
      stdio: 'pipe',
      shell: true 
    });
    
    let output = '';
    let hasOutput = false;
    
    process.stdout.on('data', (data) => {
      output += data.toString();
      hasOutput = true;
    });
    
    process.stderr.on('data', (data) => {
      output += data.toString();
      hasOutput = true;
    });
    
    process.on('close', (code) => {
      resolve({ code, output, hasOutput });
    });
    
    process.on('error', (error) => {
      reject(error);
    });
    
    // Timeout para comandos que podem travar
    setTimeout(() => {
      if (!hasOutput) {
        process.kill('SIGTERM');
        resolve({ code: -1, output: 'TIMEOUT', hasOutput: false });
      }
    }, timeout);
  });
}

async function checkEnvironment() {
  console.log('1️⃣ Verificando ambiente...');
  
  try {
    const result = await runCommand('npm', ['run', 'check-env'], 5000);
    if (result.code === 0) {
      console.log('   ✅ Ambiente OK');
      return true;
    } else {
      console.log('   ❌ Problemas no ambiente');
      console.log('   📝 Output:', result.output.substring(0, 200));
      return false;
    }
  } catch (error) {
    console.log('   ⚠️  Script de verificação não encontrado, continuando...');
    return true;
  }
}

async function testBuild() {
  console.log('\n2️⃣ Testando build...');
  
  try {
    const result = await runCommand('npm', ['run', 'build'], 30000);
    if (result.code === 0) {
      console.log('   ✅ Build successful');
      return true;
    } else {
      console.log('   ❌ Build failed');
      console.log('   📝 Erro:', result.output.substring(-500));
      return false;
    }
  } catch (error) {
    console.log('   ❌ Erro no build:', error.message);
    return false;
  }
}

async function testDev() {
  console.log('\n3️⃣ Testando servidor dev...');
  
  try {
    const devProcess = spawn('npm', ['run', 'dev'], { 
      stdio: 'pipe',
      shell: true 
    });
    
    let devOutput = '';
    let serverStarted = false;
    
    devProcess.stdout.on('data', (data) => {
      devOutput += data.toString();
      if (data.toString().includes('Local:') || data.toString().includes('localhost')) {
        serverStarted = true;
      }
    });
    
    // Aguardar até 10 segundos para o servidor iniciar
    await setTimeout(10000);
    
    devProcess.kill('SIGTERM');
    
    if (serverStarted) {
      console.log('   ✅ Servidor dev iniciou corretamente');
      const urlMatch = devOutput.match(/http:\/\/localhost:\d+/);
      if (urlMatch) {
        console.log(`   🌐 URL: ${urlMatch[0]}`);
      }
      return true;
    } else {
      console.log('   ❌ Servidor dev não iniciou');
      console.log('   📝 Output:', devOutput.substring(0, 300));
      return false;
    }
  } catch (error) {
    console.log('   ❌ Erro no servidor dev:', error.message);
    return false;
  }
}

async function main() {
  const results = {
    environment: await checkEnvironment(),
    build: await testBuild(),
    dev: await testDev()
  };
  
  console.log('\n📊 RESULTADO DOS TESTES:');
  console.log(`   Ambiente: ${results.environment ? '✅' : '❌'}`);
  console.log(`   Build: ${results.build ? '✅' : '❌'}`);
  console.log(`   Dev Server: ${results.dev ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('🚀 Sua aplicação está pronta para uso.');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('   • npm run dev - Iniciar desenvolvimento');
    console.log('   • npm run build && npm run preview - Testar produção');
    console.log('   • npx vercel --prod - Deploy para produção');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM');
    console.log('🔧 Verifique os problemas acima e tente novamente.');
    console.log('\n🆘 COMANDOS DE AJUDA:');
    console.log('   • npm install - Reinstalar dependências');
    console.log('   • npm run check-env - Verificar ambiente');
    console.log('   • npm run diagnose - Diagnóstico completo');
    process.exit(1);
  }
}

main().catch(console.error);
