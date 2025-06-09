import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA whatsapp_instances');
console.log('='.repeat(60));

async function checkTableStructure() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Tentando SELECT * para ver estrutura...');
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro no SELECT:', error);
    } else {
      console.log('✅ SELECT funcionou. Dados encontrados:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('📋 Estrutura da primeira linha:', Object.keys(data[0]));
      }
    }
    
    console.log('\n2. Testando INSERT com campos básicos...');
    const basicInstance = {
      name: 'test-basic',
      phone: '+5511999999999',
      status: 'offline',
      user_id: 'test-user'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert([basicInstance])
      .select();
    
    if (insertError) {
      console.error('❌ Erro INSERT básico:', {
        code: insertError.code,
        message: insertError.message
      });
    } else {
      console.log('✅ INSERT básico funcionou:', insertData);
    }
    
    console.log('\n3. Testando INSERT sem campos opcionais...');
    const minimalInstance = {
      name: 'test-minimal',
      user_id: 'test-user-minimal'
    };
    
    const { data: minimalData, error: minimalError } = await supabase
      .from('whatsapp_instances')
      .insert([minimalInstance])
      .select();
    
    if (minimalError) {
      console.error('❌ Erro INSERT minimal:', {
        code: minimalError.code,
        message: minimalError.message
      });
    } else {
      console.log('✅ INSERT minimal funcionou:', minimalData);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkTableStructure().catch(console.error);
