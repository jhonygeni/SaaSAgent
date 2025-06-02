// Script para desativar o modo mock no navegador
console.log('🔄 DESATIVANDO MODO MOCK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Remover a chave do localStorage
localStorage.removeItem('MOCK_SUBSCRIPTION_MODE');
localStorage.removeItem('mockUser');

console.log('✅ MODO MOCK DESATIVADO!');
console.log('📊 Agora usando dados reais da API');
console.log('');
console.log('🔄 Recarregando página em 2 segundos...');

// Recarregar a página para aplicar as mudanças
setTimeout(() => {
  console.log('🔄 Recarregando página...');
  window.location.reload();
}, 2000);

// ---- Para usar no console do navegador ----
// 1. Abra o console do navegador (F12)
// 2. Cole o código acima
// 3. Pressione Enter
// 4. A página será recarregada com dados reais
