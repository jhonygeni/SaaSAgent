const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hpovwcaskorzzrpphgkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc'
);

async function testeRapido() {
  console.log('🔥 TESTE PÓS-FIX SQL');
  console.log('==================');
  
  try {
    // Teste 1: Inserção
    console.log('\n1️⃣ Testando inserção...');
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .insert({
        user_id: 'e8e521f6-7011-418c-a0b4-7ca696e56030',
        name: `teste_verificacao_${Date.now()}`,
        phone_number: '+5511999887766',
        status: 'active'
      })
      .select();
    
    if (error) {
      console.log('❌ ERRO:', error.code, '-', error.message);
      return;
    }
    
    console.log('✅ SUCESSO! Dados inseridos:');
    console.log('   ID:', data[0].id);
    console.log('   Nome:', data[0].name);
    console.log('   Criado em:', data[0].created_at);
    
    // Teste 2: Consulta
    console.log('\n2️⃣ Testando consulta...');
    const { data: all, error: selectError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', 'e8e521f6-7011-418c-a0b4-7ca696e56030');
    
    if (selectError) {
      console.log('❌ Erro na consulta:', selectError.message);
    } else {
      console.log(`✅ Consulta OK - ${all.length} instâncias encontradas`);
    }
    
    console.log('\n🎉 RESULTADO FINAL: PROBLEMA RESOLVIDO!');
    
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

testeRapido();
