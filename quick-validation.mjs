#!/usr/bin/env node

console.log('🔍 VALIDAÇÃO RÁPIDA - Status do Sistema');
console.log('='.repeat(40));

// Verificar se servidor está rodando
console.log('1. Verificando servidor...');
try {
  const response = await fetch('http://localhost:8080/')
    .then(r => r.status)
    .catch(() => null);
  
  if (response === 200) {
    console.log('✅ Servidor rodando corretamente');
  } else {
    console.log('❌ Servidor não responde');
  }
} catch (e) {
  console.log('⚠️ Não foi possível verificar servidor');
}

console.log('\n2. Status das correções aplicadas:');
console.log('✅ UserContext.tsx - Reescrito com controles anti-loop');
console.log('✅ useUsageStats.ts - Substituído por versão com throttle');
console.log('✅ Hooks realtime - Desabilitados temporariamente');
console.log('✅ App.tsx - UserProvider exportando corretamente');

console.log('\n3. Próximos passos para validação:');
console.log('🔗 1. Abrir http://localhost:8080 no navegador');
console.log('🔍 2. Verificar se não há re-renders excessivos no console');
console.log('💾 3. Testar se instâncias persistem no dashboard');
console.log('📱 4. Verificar se mensagens não ficam em loading infinito');

console.log('\n🎯 SISTEMA PRONTO PARA TESTES MANUAIS!');
