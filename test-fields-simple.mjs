import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NTYxMjAsImV4cCI6MjA0OTIzMjEyMH0.WrYqnftZOEX1FzLG0a4OEqgANOr9-dNxtQ-3R9hqJ50';

console.log('🔍 TESTANDO CAMPOS CORRETOS DA TABELA CONTACTS');
console.log('='.repeat(50));

async function testCorrectFields() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Verificando estrutura da tabela contacts...');
    
    // Primeiro vamos ver se existem dados
    const { data: existingData, error: selectError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Erro ao buscar dados:', selectError.message);
      return;
    }
    
    console.log('✅ Dados existentes:', existingData?.length || 0);
    
    if (existingData && existingData.length > 0) {
      console.log('\n📋 Estrutura do primeiro registro:');
      console.log('Campos disponíveis:', Object.keys(existingData[0]));
      console.log('Dados:', JSON.stringify(existingData[0], null, 2));
    }
    
    console.log('\n2. Testando criação com campos corretos...');
    
    // Criar um contato de teste com os campos que você especificou
    const testContact = {
      name: 'Teste Campos Corretos',
      phone_number: '+5511999888777',
      user_id: 'test-user-123',
      // Campos que você quer usar diretamente:
      resume: 'Este é o resumo no campo resume da tabela',
      status: 'Contacted',
      valor_da_compra: 299.99,
      // Campo que existe na tabela:
      email: 'teste@exemplo.com'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('contacts')
      .insert([testContact])
      .select();
    
    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError.message);
      console.error('Código:', insertError.code);
      console.error('Detalhes:', insertError.details);
      
      // Se der erro, pode ser que os campos não existam
      console.log('\n🔍 Vamos tentar com apenas campos básicos...');
      
      const basicContact = {
        name: 'Teste Básico',
        phone_number: '+5511888777666',
        user_id: 'test-user-basic'
      };
      
      const { data: basicData, error: basicError } = await supabase
        .from('contacts')
        .insert([basicContact])
        .select();
      
      if (basicError) {
        console.error('❌ Erro mesmo com campos básicos:', basicError.message);
      } else {
        console.log('✅ Inserção básica funcionou:', basicData);
        console.log('📋 Campos disponíveis:', Object.keys(basicData[0]));
      }
      
    } else {
      console.log('✅ Inserção com campos corretos funcionou!');
      console.log('📄 Dados inseridos:', JSON.stringify(insertData, null, 2));
      
      // Limpar dados de teste
      await supabase
        .from('contacts')
        .delete()
        .eq('id', insertData[0].id);
      
      console.log('🧹 Dados de teste removidos');
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
  
  process.exit(0);
}

testCorrectFields();
