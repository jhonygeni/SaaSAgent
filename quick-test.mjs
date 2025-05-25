#!/usr/bin/env node

console.log('🚀 ConversaAI Brasil - Verificação Rápida');
console.log('=========================================\n');

// Verificar se podemos fazer uma requisição básica
console.log('📧 Testando função custom-email...');

const testEmail = () => {
  return fetch('https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.PcOQzSbU5aH8X8gQbFZBpJzKwU7E-wUJ_YQa0VLgTRo'
    },
    body: JSON.stringify({
      type: 'signup',
      user: {
        email: 'teste@conversaai.com.br',
        email_confirm: 'https://app.conversaai.com.br/confirmar-email?token=test123'
      }
    })
  })
  .then(response => {
    console.log(`Status: ${response.status}`);
    return response.text();
  })
  .then(text => {
    console.log(`Resposta: ${text}`);
    if (text.includes('success')) {
      console.log('✅ Função custom-email está funcionando!\n');
    } else {
      console.log('⚠️  Função respondeu mas pode ter problemas\n');
    }
  })
  .catch(error => {
    console.error('❌ Erro ao testar função:', error.message);
  });
};

// Executar teste
testEmail().then(() => {
  console.log('📋 PRÓXIMAS AÇÕES OBRIGATÓRIAS:');
  console.log('1. Configure Auth Hooks no console Supabase');
  console.log('2. Execute SQL triggers no console');
  console.log('3. Teste cadastro real de usuário');
  console.log('\n📖 Veja: STATUS-ATUAL-E-PROXIMOS-PASSOS.md');
});
