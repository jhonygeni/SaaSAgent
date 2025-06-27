#!/usr/bin/env node

/**
 * EMERGENCY FIX: Desabilitar setInterval que causa loop infinito
 * Este script corrige o problema de recarregamento contínuo da página
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILE = '/Users/jhonymonhol/Desktop/SaaSAgent/src/hooks/whatsapp/useWhatsAppStatus.ts';

console.log('🚨 EMERGENCY FIX: Corrigindo loop infinito no useWhatsAppStatus...');

try {
  // Ler arquivo
  let content = fs.readFileSync(TARGET_FILE, 'utf8');
  
  // Encontrar e comentar o setInterval problemático
  const originalInterval = 'const connectionDetectionInterval = setInterval(async () => {';
  const fixedInterval = '// EMERGENCY FIX: Disabled to prevent infinite loops\n    // const connectionDetectionInterval = setInterval(async () => {\n    const connectionDetectionInterval = null; // DISABLED\n    \n    if (false) { // Block disabled to prevent infinite loops';
  
  if (content.includes(originalInterval)) {
    content = content.replace(originalInterval, fixedInterval);
    
    // Backup do arquivo original
    fs.writeFileSync(TARGET_FILE + '.backup', fs.readFileSync(TARGET_FILE));
    
    // Escrever arquivo corrigido
    fs.writeFileSync(TARGET_FILE, content);
    
    console.log('✅ CORREÇÃO APLICADA:');
    console.log('  • setInterval desabilitado');
    console.log('  • Backup criado: useWhatsAppStatus.ts.backup');
    console.log('  • Recarregamento de página deve parar');
    console.log('');
    console.log('📱 IMPORTANTE: Conexão WhatsApp agora precisa ser verificada manualmente');
    console.log('   Use o botão "Verificar Conexão" no dashboard');
    
  } else {
    console.log('⚠️ setInterval não encontrado - arquivo pode já estar corrigido');
  }
  
} catch (error) {
  console.error('❌ Erro ao aplicar correção:', error.message);
  process.exit(1);
}
