// Debug para verificar se o user_id corresponde aos dados da tabela usage_stats
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const USER_ID = 'e8e521f6-7011-418c-a0b4-7ca696e56030';

console.log('🔍 Verificando dados para user_id:', USER_ID);

async function checkUserData() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Verificando dados na tabela usage_stats para este usuário...');
    
    const { data: usageData, error: usageError } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', USER_ID)
      .order('date', { ascending: false });

    if (usageError) {
      console.error('❌ Erro ao buscar usage_stats:', usageError.message);
      return;
    }

    console.log(`✅ Encontrados ${usageData?.length || 0} registros para este usuário`);
    
    if (usageData && usageData.length > 0) {
      console.log('\n📊 Dados encontrados:');
      usageData.forEach((record, index) => {
        console.log(`${index + 1}. Data: ${record.date}, Enviadas: ${record.messages_sent}, Recebidas: ${record.messages_received}`);
      });
      
      const totalEnviadas = usageData.reduce((sum, record) => sum + (record.messages_sent || 0), 0);
      const totalRecebidas = usageData.reduce((sum, record) => sum + (record.messages_received || 0), 0);
      console.log(`\n📈 TOTAIS: Enviadas: ${totalEnviadas}, Recebidas: ${totalRecebidas}, Total: ${totalEnviadas + totalRecebidas}`);
    } else {
      console.log('⚠️ Nenhum dado encontrado para este usuário específico');
      
      console.log('\n🔍 Verificando todos os user_ids na tabela...');
      const { data: allUsers, error: allError } = await supabase
        .from('usage_stats')
        .select('user_id')
        .limit(10);
      
      if (!allError && allUsers) {
        const uniqueUserIds = [...new Set(allUsers.map(u => u.user_id))];
        console.log('👥 User IDs encontrados na tabela:');
        uniqueUserIds.forEach((id, index) => {
          console.log(`${index + 1}. ${id}`);
        });
      }
    }
    
    // Verificar dados dos últimos 7 dias especificamente
    console.log('\n📅 Verificando dados dos últimos 7 dias...');
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    
    const { data: last7Days, error: last7Error } = await supabase
      .from('usage_stats')
      .select('date, messages_sent, messages_received')
      .eq('user_id', USER_ID)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    if (!last7Error) {
      console.log(`📊 Dados dos últimos 7 dias: ${last7Days?.length || 0} registros`);
      if (last7Days && last7Days.length > 0) {
        last7Days.forEach(record => {
          console.log(`  ${record.date}: ${record.messages_sent} enviadas, ${record.messages_received} recebidas`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

checkUserData();
