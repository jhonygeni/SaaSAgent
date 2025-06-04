#!/usr/bin/env node

/**
 * Script para diagnosticar problemas de subscriptions Supabase
 * Resolve problemas relacionados a ERR_INSUFFICIENT_RESOURCES
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

const BROWSER_CHECK_CODE = `
// Verificador de Supabase subscriptions
(() => {
  // Localizar conexões Supabase
  const connections = [];
  let loopingConnections = false;
  let duplicateChannels = false;
  
  if (typeof window !== 'undefined' && window.supabase) {
    // Tentar acessar informações de channels
    if (window.supabase._channels) {
      const channels = window.supabase._channels;
      const channelCount = channels.size || Object.keys(channels).length || 0;
      
      if (channelCount > 5) {
        loopingConnections = true;
      }
      
      // Verificar duplicações (mesmo nome de channel)
      const channelNames = [];
      if (channels.forEach) {
        channels.forEach(channel => {
          if (channel.namme) channelNames.push(channel.name);
        });
      } else {
        Object.values(channels).forEach(channel => {
          if (channel.name) channelNames.push(channel.name);
        });
      }
      
      // Contar duplicações
      const nameCount = channelNames.reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
      
      const hasDuplicates = Object.values(nameCount).some(count => count > 1);
      duplicateChannels = hasDuplicates;
    }
  }
  
  return {
    supabaseFound: !!window.supabase,
    connectionCount: connections.length,
    loopingConnections,
    duplicateChannels,
    hasSubscriptionManager: !!window.subscriptionManager || !!window.supabaseSubscriptionStats
  };
})();
`;

// Cores para console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Menu principal
async function main() {
  console.clear();
  console.log(`${colors.cyan}===================================================`);
  console.log(`🔍 DIAGNÓSTICO DE SUBSCRIPTIONS SUPABASE`);
  console.log(`===================================================\n${colors.reset}`);
  
  console.log(`Esta ferramenta ajuda a identificar e corrigir problemas de:
- ${colors.red}ERR_INSUFFICIENT_RESOURCES${colors.reset}
- Múltiplas conexões simultâneas
- Loops infinitos em subscriptions
- Memory leaks em componentes React\n`);

  console.log(`${colors.yellow}OPÇÕES:${colors.reset}`);
  console.log(`1. Verificar aplicação quanto a problemas de subscriptions`);
  console.log(`2. Aplicar correções automáticas`);
  console.log(`3. Instruções para corrigir manualmente`);
  console.log(`4. Verificar implementação do subscription-manager`);
  console.log(`0. Sair\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Digite a opção desejada: ', (answer) => {
    rl.close();
    
    switch (answer.trim()) {
      case '1':
        checkForSubscriptionIssues();
        break;
      case '2':
        applyAutomaticFixes();
        break;
      case '3':
        showManualFixInstructions();
        break;
      case '4':
        checkSubscriptionManager();
        break;
      case '0':
        console.log('\nEncerrando diagnóstico.');
        process.exit(0);
        break;
      default:
        console.log('\nOpção inválida. Por favor, tente novamente.');
        setTimeout(main, 1500);
        break;
    }
  });
}

// Verificar problemas de subscriptions
function checkForSubscriptionIssues() {
  console.clear();
  console.log(`${colors.cyan}===================================================`);
  console.log(`🔍 VERIFICANDO PROBLEMAS DE SUBSCRIPTIONS`);
  console.log(`===================================================\n${colors.reset}`);
  
  console.log(`${colors.yellow}Verificando arquivos do projeto...${colors.reset}`);
  
  // 1. Procurar por padrões problemáticos nos arquivos
  const problemPatterns = {
    'supabase.channel': 0,
    'on(\'postgres_changes\'': 0,
    '.subscribe(': 0,
    'useEffect': 0,
    'useRealTimeUsageStats': 0,
  };
  
  let totalFiles = 0;
  let filesWithPotentialIssues = 0;
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
        scanDirectory(filePath);
      } 
      else if (stats.isFile() && (filePath.endsWith('.js') || filePath.endsWith('.jsx') || 
                                 filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
        totalFiles++;
        let hasIssues = false;
        
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Verificar padrões
        Object.keys(problemPatterns).forEach(pattern => {
          if (content.includes(pattern)) {
            problemPatterns[pattern]++;
            hasIssues = true;
          }
        });
        
        // Potencial loop infinito: useEffect com dependências que incluem funções criadas no componente
        if (content.includes('useEffect') && content.includes('}, [') && 
            content.includes('handle') && content.includes('fetch')) {
          hasIssues = true;
        }
        
        if (hasIssues) {
          filesWithPotentialIssues++;
        }
      }
    });
  }
  
  try {
    scanDirectory('.');
    
    console.log(`\n${colors.green}✓ Análise concluída!${colors.reset}\n`);
    console.log(`Total de arquivos analisados: ${totalFiles}`);
    console.log(`Arquivos com potenciais problemas: ${filesWithPotentialIssues}\n`);
    
    console.log(`${colors.yellow}Padrões problemáticos encontrados:${colors.reset}`);
    Object.entries(problemPatterns).forEach(([pattern, count]) => {
      console.log(`- ${pattern}: ${count} ${count > 5 ? `${colors.red}(RISCO ALTO)${colors.reset}` : ''}`);
    });
    
    // Verificar subscription-manager
    const hasSubscriptionManager = fs.existsSync('./src/lib/subscription-manager.ts') || 
                                  fs.existsSync('./src/lib/subscription-manager.js');
                                  
    console.log(`\n${colors.yellow}Status do gerenciamento de subscriptions:${colors.reset}`);
    console.log(`- Sistema centralizado implementado: ${hasSubscriptionManager ? `${colors.green}SIM${colors.reset}` : `${colors.red}NÃO${colors.reset}`}`);
    
    const rating = calculateRiskRating(problemPatterns, hasSubscriptionManager);
    
    console.log(`\n${colors.yellow}Diagnóstico:${colors.reset} ${getRiskLabel(rating)}`);
    
    if (rating >= 7) {
      console.log(`\n${colors.red}⚠️ ALTO RISCO DE ERR_INSUFFICIENT_RESOURCES!${colors.reset}`);
      console.log(`Recomendação: Implemente o sistema centralizado de gerenciamento de subscriptions`);
    } else if (rating >= 4) {
      console.log(`\n${colors.yellow}⚠️ RISCO MODERADO DE PROBLEMAS DE PERFORMANCE${colors.reset}`);
      console.log(`Recomendação: Revise os componentes que usam subscriptions Supabase`);
    } else {
      console.log(`\n${colors.green}✓ RISCO BAIXO${colors.reset}`);
      console.log(`Seu código parece seguir boas práticas para subscriptions Supabase`);
    }
  } catch (err) {
    console.error(`${colors.red}Erro ao analisar arquivos:${colors.reset}`, err);
  }
  
  console.log(`\nPressione ENTER para voltar ao menu principal...`);
  process.stdin.once('data', () => {
    main();
  });
}

// Aplicar correções automáticas
function applyAutomaticFixes() {
  console.clear();
  console.log(`${colors.cyan}===================================================`);
  console.log(`🛠️ APLICANDO CORREÇÕES AUTOMÁTICAS`);
  console.log(`===================================================\n${colors.reset}`);
  
  console.log(`Verificando arquivos necessários...`);
  
  const hasSubscriptionManager = fs.existsSync('./src/lib/subscription-manager.ts') || 
                               fs.existsSync('./src/lib/subscription-manager.js');
                               
  if (!hasSubscriptionManager) {
    console.log(`\n${colors.yellow}Criando sistema centralizado de gerenciamento de subscriptions...${colors.reset}`);
    
    // Determinar tipo de arquivo a ser criado (TS ou JS)
    const isTypeScript = fs.existsSync('./tsconfig.json');
    const filePath = isTypeScript ? './src/lib/subscription-manager.ts' : './src/lib/subscription-manager.js';
    
    // Garantir que o diretório existe
    if (!fs.existsSync('./src/lib')) {
      fs.mkdirSync('./src/lib', { recursive: true });
    }
    
    console.log(`Criando arquivo ${filePath}...`);
    
    // Conteúdo do arquivo será diferente dependendo se é TS ou JS
    const fileContent = isTypeScript ? 
      fs.readFileSync('./src/lib/subscription-manager.ts', 'utf-8') : 
      fs.readFileSync('./src/lib/subscription-manager.js', 'utf-8');
    
    fs.writeFileSync(filePath, fileContent);
  }
  
  console.log(`\n${colors.green}✓ Sistema de gerenciamento de subscriptions verificado!${colors.reset}\n`);
  console.log(`Verificando componentes problemáticos...`);
  
  // Procurar por arquivos que usam subscriptions diretamente
  const problemFiles = [];
  
  function findProblemFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
        findProblemFiles(filePath);
      } 
      else if (stats.isFile() && (filePath.endsWith('.js') || filePath.endsWith('.jsx') || 
                                filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        if (content.includes('supabase.channel') && content.includes('useEffect') && 
            !content.includes('subscription-manager')) {
          problemFiles.push(filePath);
        }
      }
    });
  }
  
  try {
    findProblemFiles('.');
    
    if (problemFiles.length > 0) {
      console.log(`\n${colors.yellow}Arquivos que precisam ser migrados para o sistema centralizado:${colors.reset}`);
      problemFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
      });
    } else {
      console.log(`\n${colors.green}✓ Não foi encontrado nenhum arquivo que precise ser migrado!${colors.reset}`);
    }
  } catch (err) {
    console.error(`${colors.red}Erro ao procurar arquivos problemáticos:${colors.reset}`, err);
  }
  
  console.log(`\nPressione ENTER para voltar ao menu principal...`);
  process.stdin.once('data', () => {
    main();
  });
}

// Instruções para correção manual
function showManualFixInstructions() {
  console.clear();
  console.log(`${colors.cyan}===================================================`);
  console.log(`📝 INSTRUÇÕES PARA CORREÇÃO MANUAL`);
  console.log(`===================================================\n${colors.reset}`);
  
  console.log(`${colors.yellow}Problemas comuns que causam ERR_INSUFFICIENT_RESOURCES:${colors.reset}\n`);
  
  console.log(`1. ${colors.red}Múltiplas subscriptions para o mesmo recurso${colors.reset}`);
  console.log(`   Vários componentes assinando a mesma tabela simultaneamente\n`);
  
  console.log(`2. ${colors.red}Dependências circulares em useEffect${colors.reset}`);
  console.log(`   useEffect(() => { ... }, [func]) onde func é redefinida em cada render\n`);
  
  console.log(`3. ${colors.red}Falta de cleanup adequado${colors.reset}`);
  console.log(`   Não chamar supabase.removeChannel() no return de useEffect\n`);
  
  console.log(`4. ${colors.red}Race conditions e múltiplos renders${colors.reset}`);
  console.log(`   setState depois que o componente foi desmontado\n`);
  
  console.log(`${colors.yellow}\nPasso a passo para correção:${colors.reset}\n`);
  
  console.log(`1. Implemente o sistema centralizado de gerenciamento:`);
  console.log(`   Copie e cole o arquivo 'subscription-manager.ts' para src/lib/\n`);
  
  console.log(`2. Para cada arquivo que usa subscriptions diretamente (`);
  console.log(`   * Importe o gerenciador: import { subscriptionManager } from '@/lib/subscription-manager'`);
  console.log(`   * Substitua a criação direta de channels:
   
   // ANTES:
   const channel = supabase.channel('name')
     .on('postgres_changes', { ... }, callback)
     .subscribe()
   
   // DEPOIS:
   const unsubscribe = subscriptionManager.subscribe('uniqueId', {
     table: 'tableName',
     event: '*',
     filter: 'condition',
     callback: (payload) => { ... }
   })
   
   // No cleanup:
   return () => unsubscribe()
  `);
  
  console.log(`\n3. Remova dependências circulares em useEffect:\n`);
  console.log(`   // ANTES - Problema: handleUpdate é recriada a cada render`);
  console.log(`   const handleUpdate = useCallback(() => { ... }, [dep1, dep2])`);
  console.log(`   useEffect(() => { ... }, [dep1, handleUpdate])`);
  console.log(`\n   // DEPOIS - Solução: mova a função para dentro do useEffect`);
  console.log(`   useEffect(() => {`);
  console.log(`     const handleUpdate = () => { ... }`);
  console.log(`     // resto do código`);
  console.log(`   }, [dep1])\n`);
  
  console.log(`4. Sempre verifique se o componente está montado:`);
  console.log(`   const isMounted = useRef(true)`);
  console.log(`   useEffect(() => {`);
  console.log(`     return () => { isMounted.current = false }`);
  console.log(`   }, [])`);
  
  console.log(`\nPressione ENTER para voltar ao menu principal...`);
  process.stdin.once('data', () => {
    main();
  });
}

// Verificar implementação do subscription manager
function checkSubscriptionManager() {
  console.clear();
  console.log(`${colors.cyan}===================================================`);
  console.log(`🔍 VERIFICANDO SUBSCRIPTION MANAGER`);
  console.log(`===================================================\n${colors.reset}`);
  
  // Verificar se o arquivo existe
  const typescriptPath = './src/lib/subscription-manager.ts';
  const javascriptPath = './src/lib/subscription-manager.js';
  
  let filePath = null;
  let language = null;
  
  if (fs.existsSync(typescriptPath)) {
    filePath = typescriptPath;
    language = 'typescript';
  } else if (fs.existsSync(javascriptPath)) {
    filePath = javascriptPath;
    language = 'javascript';
  }
  
  if (!filePath) {
    console.log(`${colors.red}❌ Sistema de gerenciamento de subscriptions não encontrado!${colors.reset}\n`);
    console.log(`O sistema não está implementado em:`);
    console.log(`- ${typescriptPath}`);
    console.log(`- ${javascriptPath}\n`);
    console.log(`Recomendação: Volte ao menu principal e escolha a opção 2 para aplicar correções automáticas.`);
  } else {
    console.log(`${colors.green}✓ Sistema encontrado: ${filePath}${colors.reset}\n`);
    
    // Ler conteúdo do arquivo
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Verificar recursos esperados
    const checks = {
      singleton: content.includes('static getInstance'),
      cleanup: content.includes('cleanupAll') || content.includes('removeChannel'),
      limiter: content.includes('MAX_SUBSCRIPTIONS'),
      stats: content.includes('getStats'),
    };
    
    console.log(`${colors.yellow}Verificando implementação:${colors.reset}`);
    
    Object.entries(checks).forEach(([feature, implemented]) => {
      console.log(`- ${feature}: ${implemented ? `${colors.green}IMPLEMENTADO${colors.reset}` : `${colors.red}AUSENTE${colors.reset}`}`);
    });
    
    // Calcular completude
    const completeness = Object.values(checks).filter(v => v).length / Object.values(checks).length * 100;
    
    console.log(`\n${colors.yellow}Resultado:${colors.reset} ${completeness.toFixed(0)}% completo`);
    
    if (completeness < 100) {
      console.log(`\n${colors.yellow}⚠️ Implementação incompleta!${colors.reset}`);
      console.log(`Recursos ausentes podem comprometer a eficácia do sistema.`);
      console.log(`Recomendação: Veja a seção de instruções manuais para detalhes de implementação.`);
    } else {
      console.log(`\n${colors.green}✓ Implementação completa!${colors.reset}`);
      console.log(`O sistema está corretamente implementado com todos os recursos necessários.`);
    }
    
    // Buscar utilização em outros arquivos
    console.log(`\n${colors.yellow}Verificando utilização no projeto:${colors.reset}`);
    
    let totalFiles = 0;
    let filesUsingManager = 0;
    
    function scanForUsage(dir) {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const scanPath = path.join(dir, file);
        const stats = fs.statSync(scanPath);
        
        if (stats.isDirectory() && !scanPath.includes('node_modules') && !scanPath.includes('.git')) {
          scanForUsage(scanPath);
        } 
        else if (stats.isFile() && (scanPath.endsWith('.js') || scanPath.endsWith('.jsx') || 
                                  scanPath.endsWith('.ts') || scanPath.endsWith('.tsx'))) {
          totalFiles++;
          
          if (scanPath !== filePath) { // Não contar o próprio arquivo
            const content = fs.readFileSync(scanPath, 'utf-8');
            
            if (content.includes('subscription-manager') || 
                content.includes('subscriptionManager')) {
              filesUsingManager++;
            }
          }
        }
      });
    }
    
    try {
      scanForUsage('./src');
      
      const usagePercentage = totalFiles > 0 ? (filesUsingManager / totalFiles * 100).toFixed(1) : 0;
      
      console.log(`Total de arquivos no projeto: ${totalFiles}`);
      console.log(`Arquivos usando o gerenciador: ${filesUsingManager} (${usagePercentage}%)`);
      
      if (usagePercentage < 5 && totalFiles > 20) {
        console.log(`\n${colors.yellow}⚠️ Baixa adoção do sistema!${colors.reset}`);
        console.log(`Poucos arquivos estão usando o gerenciador centralizado.`);
        console.log(`Recomendação: Migre gradualmente todos os componentes com subscriptions.`);
      } else if (filesUsingManager > 0) {
        console.log(`\n${colors.green}✓ Sistema está em uso!${colors.reset}`);
      } else {
        console.log(`\n${colors.red}❌ Sistema não está sendo usado!${colors.reset}`);
        console.log(`Nenhum arquivo está importando o gerenciador centralizado.`);
      }
    } catch (err) {
      console.error(`${colors.red}Erro ao analisar utilização:${colors.reset}`, err);
    }
  }
  
  console.log(`\nPressione ENTER para voltar ao menu principal...`);
  process.stdin.once('data', () => {
    main();
  });
}

// Calcular pontuação de risco
function calculateRiskRating(patterns, hasManager) {
  let rating = 0;
  
  // Peso dos padrões
  rating += patterns['supabase.channel'] * 0.5;
  rating += patterns['on(\'postgres_changes\''] * 0.7;
  rating += patterns['.subscribe('] * 0.6;
  
  // Alto número de useEffect é alarmante
  if (patterns['useEffect'] > 30) rating += 3;
  else if (patterns['useEffect'] > 15) rating += 1.5;
  
  // Uso de hooks de real-time
  if (patterns['useRealTimeUsageStats'] > 3) rating += 2.5;
  
  // Pontuação é reduzida se tiver o gerenciador implementado
  if (hasManager) rating -= 3;
  
  return Math.min(Math.max(rating, 0), 10);
}

// Obter label de risco baseado na pontuação
function getRiskLabel(rating) {
  if (rating >= 7) return `${colors.red}ALTO RISCO (${rating.toFixed(1)}/10)${colors.reset}`;
  if (rating >= 4) return `${colors.yellow}RISCO MODERADO (${rating.toFixed(1)}/10)${colors.reset}`;
  return `${colors.green}BAIXO RISCO (${rating.toFixed(1)}/10)${colors.reset}`;
}

// Iniciar o programa
main();
