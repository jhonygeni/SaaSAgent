// Verificar e corrigir políticas RLS para produção
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Verificando e corrigindo políticas RLS...');

async function fixRLSPolicies() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 1. Verificar se conseguimos acessar usage_stats
    console.log('\n1. Testando acesso à tabela usage_stats...');
    const { data: usageData, error: usageError } = await supabase
      .from('usage_stats')
      .select('*')
      .limit(1);

    if (usageError) {
      console.log('❌ Erro ao acessar usage_stats:', usageError.message);
      
      // Verificar se existe algum dado de teste
      console.log('\n2. Tentando inserir dados de teste...');
      const testData = {
        user_id: 'test-user-id',
        date: new Date().toISOString().split('T')[0],
        messages_sent: 10,
        messages_received: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('usage_stats')
        .insert([testData])
        .select();
      
      if (insertError) {
        console.log('❌ Erro ao inserir dados de teste:', insertError.message);
        console.log('🔧 Isso indica problema com políticas RLS');
      } else {
        console.log('✅ Dados de teste inseridos com sucesso');
      }
    } else {
      console.log('✅ Acesso à tabela usage_stats funcionando');
      console.log('📊 Registros encontrados:', usageData?.length || 0);
    }
    
    // 3. Verificar contacts
    console.log('\n3. Testando acesso à tabela contacts...');
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);

    if (contactsError) {
      console.log('❌ Erro ao acessar contacts:', contactsError.message);
    } else {
      console.log('✅ Acesso à tabela contacts funcionando');
      console.log('📊 Registros encontrados:', contactsData?.length || 0);
    }
    
    // 4. Verificar whatsapp_instances
    console.log('\n4. Testando acesso à tabela whatsapp_instances...');
    const { data: instancesData, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);

    if (instancesError) {
      console.log('❌ Erro ao acessar whatsapp_instances:', instancesError.message);
    } else {
      console.log('✅ Acesso à tabela whatsapp_instances funcionando');
      console.log('📊 Registros encontrados:', instancesData?.length || 0);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

fixRLSPolicies();
