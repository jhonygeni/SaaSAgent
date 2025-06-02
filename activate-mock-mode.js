// Script para testar o sistema de contagem de mensagens
// Execute este código no console do navegador para ativar o modo mock

console.log("🧪 Ativando modo mock para teste da barra de progresso...");

// Ativar modo mock
localStorage.setItem('MOCK_SUBSCRIPTION_MODE', 'true');

// Recarregar a página para aplicar as mudanças
window.location.reload();

// Instruções
console.log(`
✅ Modo mock ativado!

Para testar:
1. Faça login na aplicação
2. Vá para o dashboard 
3. Observe a barra de progresso na seção "Uso de Mensagens"
4. Use o Debug Panel (canto inferior direito) para alternar entre diferentes cenários

Cenários disponíveis:
- Plano Free: 25/100 mensagens (25%)
- Plano Starter: 450/1000 mensagens (45%) 
- Plano Growth: 2750/5000 mensagens (55%)

Para desativar o modo mock:
localStorage.removeItem('MOCK_SUBSCRIPTION_MODE');
window.location.reload();
`);
