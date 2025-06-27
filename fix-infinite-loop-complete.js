#!/usr/bin/env node

/**
 * EMERGENCY FIX: Corrigir loop infinito no useWhatsAppStatus
 * Substituir o bloco inteiro do setInterval problemático
 */

const fs = require('fs');

const TARGET_FILE = '/Users/jhonymonhol/Desktop/SaaSAgent/src/hooks/whatsapp/useWhatsAppStatus.ts';

console.log('🚨 EMERGENCY FIX: Corrigindo loop infinito completo...');

try {
  let content = fs.readFileSync(TARGET_FILE, 'utf8');
  
  // Encontrar o início do bloco problemático
  const startPattern = 'const connectionDetectionInterval = setInterval(async () => {';
  const endPattern = '}, CONNECTION_POLL_INTERVAL);';
  
  const startIndex = content.indexOf(startPattern);
  const endIndex = content.indexOf(endPattern, startIndex) + endPattern.length;
  
  if (startIndex !== -1 && endIndex !== -1) {
    const beforeBlock = content.substring(0, startIndex);
    const afterBlock = content.substring(endIndex);
    
    // Substituir pelo código fixo
    const fixedBlock = `// EMERGENCY FIX: Disable polling to prevent infinite loops
    const connectionDetectionInterval = setTimeout(() => {
      console.log('⚠️ EMERGENCY: Connection polling disabled to prevent infinite page reloads');
      console.log('📱 Please use "Verificar Conexão" button for manual connection check');
    }, 1000);`;
    
    const fixedContent = beforeBlock + fixedBlock + afterBlock;
    
    // Backup e escrever arquivo corrigido
    fs.writeFileSync(TARGET_FILE + '.emergency-backup', content);
    fs.writeFileSync(TARGET_FILE, fixedContent);
    
    console.log('✅ CORREÇÃO APLICADA COM SUCESSO!');
    console.log('  • Polling setInterval removido completamente');
    console.log('  • Loop infinito deve estar resolvido');
    console.log('  • Backup salvo como .emergency-backup');
    console.log('  • Dashboard deve parar de recarregar');
    
  } else {
    console.log('⚠️ Padrão do setInterval não encontrado no arquivo');
  }
  
} catch (error) {
  console.error('❌ Erro ao aplicar correção:', error.message);
  process.exit(1);
}
