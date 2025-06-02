// Script para ativar modo mock no console do navegador
// Cole este código no console do navegador para testar a funcionalidade da barra de progresso

console.log('🚀 ATIVANDO MODO MOCK PARA TESTE DA BARRA DE PROGRESSO');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Ativar modo mock
localStorage.setItem('MOCK_SUBSCRIPTION_MODE', 'true');
localStorage.setItem('mockUser', 'starter_user'); // ou 'free_user', 'growth_user'

console.log('✅ MODO MOCK ATIVADO!');
console.log('📊 Cenário: Usuário Starter (450/1000 mensagens)');
console.log('');
console.log('🔄 Recarregando página em 2 segundos...');
console.log('');
console.log('📋 DEPOIS DO RELOAD:');
console.log('1. Faça login no sistema');
console.log('2. Navegue até o chat');
console.log('3. Verifique se a barra mostra "450 / 1000 mensagens"');
console.log('');
console.log('🎯 OUTROS CENÁRIOS DISPONÍVEIS:');
console.log('- Free User: localStorage.setItem("mockUser", "free_user")');
console.log('- Growth User: localStorage.setItem("mockUser", "growth_user")');

// Recarregar a página para aplicar as mudanças
setTimeout(() => {
  console.log('🔄 Recarregando página...');
  window.location.reload();
}, 2000);

// ---- Para usar no console do navegador ----
// 1. Abra o console do navegador (F12)
// 2. Cole o código acima
// 3. Pressione Enter
// 4. A página será recarregada com dados mockados

// Para desativar:
// localStorage.removeItem('MOCK_SUBSCRIPTION_MODE');
// window.location.reload();
