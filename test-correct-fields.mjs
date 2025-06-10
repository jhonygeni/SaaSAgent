import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 TESTANDO CAMPOS CORRETOS DA TABELA CONTACTS');
console.log('='.repeat(60));

async function testCorrectFields() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Verificando estrutura da tabela contacts...');
    
    // Tentar inserir um contato de teste com os campos corretos
    const testContact = {
      name: 'Teste Campos Corretos',
      phone_number: '+5511999999999',
      email: 'teste@campos.com',
      resume: 'Este é um resumo de teste para verificar o campo resume',
      status: 'Contacted',
      valor_da_compra: 299.99,
      user_id: 'test-user-id'
    };
    
    console.log('\n2. Tentando inserir contato com campos corretos...');
    console.log('Dados a inserir:', JSON.stringify(testContact, null, 2));
    
    const { data, error } = await supabase
      .from('contacts')
      .insert([testContact])
      .select();
    
    if (error) {
      console.error('❌ Erro ao inserir:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Se der erro, pode ser que os campos não existam
      console.log('\n3. Verificando quais campos existem...');
      
      // Tentar inserir apenas com campos básicos
      const basicContact = {
        name: 'Teste Básico',
        phone_number: '+5511888888888',
        user_id: 'test-user-id'
      };
      
      const { data: basicData, error: basicError } = await supabase
        .from('contacts')
        .insert([basicContact])
        .select();
      
      if (basicError) {
        console.error('❌ Erro com campos básicos:', basicError.message);
      } else {
        console.log('✅ Inserção básica funcionou:', basicData);
        
        // Tentar fazer SELECT para ver estrutura real
        const { data: allData, error: selectError } = await supabase
          .from('contacts')
          .select('*')
          .limit(1);
        
        if (!selectError && allData && allData.length > 0) {
          console.log('\n📋 Estrutura real da tabela (campos disponíveis):');
          console.log(Object.keys(allData[0]));
        }
      }
    } else {
      console.log('✅ Inserção com campos corretos funcionou!');
      console.log('Dados inseridos:', data);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testCorrectFields().catch(console.error);
