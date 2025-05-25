const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 Testando conexão com Supabase...');

supabase.functions.invoke('custom-email', {
  body: {
    email: 'teste@exemplo.com',
    type: 'signup',
    token: 'test-token-123',
    redirect_to: 'https://app.conversaai.com.br/confirmar-email',
    metadata: { name: 'Usuário Teste' }
  }
}).then(({ data, error }) => {
  if (error) {
    console.error('❌ Erro na função:', error);
  } else {
    console.log('✅ Resposta da função:', data);
  }
  process.exit(0);
}).catch(err => {
  console.error('💥 Erro geral:', err);
  process.exit(1);
});
