const { createClient } = require('@supabase/supabase-js');

// Usar as credenciais corretas do .env
const supabase = createClient(
  'https://hpovwcaskorzzrpphgkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc'
);

async function testDirectInsertBypass() {
  console.log('🚀 TESTANDO INSERÇÃO DIRETA - BYPASS RLS');
  console.log('===============================================');
  
  try {
    // Testar inserção direta
    console.log('1. Tentando inserir diretamente...');
    
    const newInstance = {
      user_id: 'e8e521f6-7011-418c-a0b4-7ca696e56030', // jhony@geni.chat
      name: `teste_bypass_${Date.now()}`,
      phone_number: '+5511999887766',
      status: 'created',
      evolution_instance_id: `test_${Date.now()}`,
      session_data: JSON.stringify({ test: true })
    };
    
    console.log('📤 Dados a inserir:', newInstance);
    
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .insert(newInstance)
      .select();
    
    if (error) {
      console.error('❌ ERRO na inserção:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Vamos tentar verificar quantas instâncias existem
      console.log('\n2. Verificando instâncias existentes...');
      const { data: existing, error: selectError } = await supabase
        .from('whatsapp_instances')
        .select('*');
        
      if (selectError) {
        console.error('❌ Erro ao buscar existentes:', selectError);
      } else {
        console.log(`📊 Total de instâncias no banco: ${existing?.length || 0}`);
        if (existing && existing.length > 0) {
          console.log('🔍 Instâncias encontradas:');
          existing.forEach((inst, i) => {
            console.log(`   ${i+1}. ${inst.name} (${inst.user_id}) - ${inst.created_at}`);
          });
        }
      }
      
    } else {
      console.log('✅ SUCESSO! Instância criada:', {
        id: data[0].id,
        name: data[0].name,
        user_id: data[0].user_id,
        created_at: data[0].created_at
      });
      
      // Verificar total após inserção
      const { data: all, error: countError } = await supabase
        .from('whatsapp_instances')
        .select('*');
        
      if (!countError) {
        console.log(`📊 Total de instâncias após inserção: ${all?.length || 0}`);
      }
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testDirectInsertBypass();
