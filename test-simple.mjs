// Teste simples de conexão
console.log('🚀 Testando conexão...');

try {
  const response = await fetch('https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.PcOQzSbU5aH8X8gQbFZBpJzKwU7E-wUJ_YQa0VLgTRo',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'signup',
      user: {
        email: 'teste@exemplo.com',
        email_confirm: 'https://app.conversaai.com.br/confirmar-email?token=test'
      }
    })
  });

  const result = await response.text();
  console.log('✅ Status:', response.status);
  console.log('📨 Resposta:', result);
} catch (error) {
  console.error('❌ Erro:', error);
}
