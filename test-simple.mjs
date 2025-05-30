// Teste simples de conexão
console.log('🚀 Testando conexão...');

try {
  const response = await fetch('https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer process.env.SUPABASE_ANON_KEY || ""',
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
