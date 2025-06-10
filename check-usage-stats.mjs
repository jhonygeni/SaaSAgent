// Verificar se há dados na tabela usage_stats
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Verificando dados na tabela usage_stats...');

async function checkUsageStats() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Verificando se existem dados na tabela usage_stats...');
    
    const { data, error, count } = await supabase
      .from('usage_stats')
      .select('*', { count: 'exact' })
      .limit(10);

    if (error) {
      console.error('❌ Erro ao buscar usage_stats:', error.message);
      return;
    }

    console.log(`✅ Total de registros na tabela: ${count}`);
    
    if (data && data.length > 0) {
      console.log('\n📊 Primeiros registros encontrados:');
      data.forEach((record, index) => {
        console.log(`${index + 1}. User ID: ${record.user_id}, Data: ${record.date}, Enviadas: ${record.messages_sent}, Recebidas: ${record.messages_received}`);
      });
    } else {
      console.log('⚠️ Nenhum dado encontrado na tabela usage_stats');
      console.log('\n🎯 Vou criar alguns dados de exemplo...');
      
      // Criar dados de exemplo
      const testData = [];
      const today = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        testData.push({
          user_id: 'test-user-id',
          date: date.toISOString().split('T')[0],
          messages_sent: Math.floor(Math.random() * 25) + 15,
          messages_received: Math.floor(Math.random() * 20) + 10,
          created_at: date.toISOString(),
          updated_at: date.toISOString()
        });
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('usage_stats')
        .insert(testData)
        .select();
      
      if (insertError) {
        console.error('❌ Erro ao inserir dados de exemplo:', insertError.message);
      } else {
        console.log('✅ Dados de exemplo criados:', insertData.length, 'registros');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

checkUsageStats();
