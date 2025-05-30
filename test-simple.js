const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qxnbowuzpsagwvcucsyb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4bmJvd3V6cHNhZ3d2Y3Vjc3liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2ODUyMzksImV4cCI6MjA1MjI2MTIzOX0.8CwLJJuLNhE6E9B0hDEm0H1RJJEcNQyxWcrXfE0WzMo';

console.log('🔍 TESTE SIMPLES - CONEXÃO SUPABASE');
console.log('=================================');

console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testBasic() {
  try {
    console.log('\n🔧 Testando conexão básica...');
    
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Erro:', error.message);
      return;
    }
    
    console.log('✅ Sucesso! Total de usuários:', count);
    
    // Testar busca de instâncias
    const { data: instances, error: instError } = await supabase
      .from('whatsapp_instances')
      .select('*');
    
    if (instError) {
      console.error('❌ Erro ao buscar instâncias:', instError.message);
      return;
    }
    
    console.log('✅ Instâncias encontradas:', instances.length);
    
    if (instances.length > 0) {
      console.log('📱 Primeira instância:', instances[0].name);
    } else {
      console.log('⚠️ Nenhuma instância WhatsApp registrada');
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

testBasic();
