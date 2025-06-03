import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardData() {
  console.log('🏠 Testando dados do dashboard...\n');

  try {
    // 1. Simular exatamente o que o hook useUsageStats faz
    console.log('1. Simulando comportamento do hook useUsageStats...');
    
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);
    
    console.log(`📅 Buscando dados de ${sevenDaysAgo.toISOString().split('T')[0]} até ${today.toISOString().split('T')[0]}`);

    // Primeira tentativa: busca sem filtro de usuário (como o hook faz quando falha a primeira)
    const { data: usageData, error: usageError } = await supabase
      .from('usage_stats')
      .select('date, messages_sent, messages_received, user_id')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(50);

    if (usageError) {
      console.log('❌ Erro na consulta RLS:', usageError.message);
      console.log('🔧 Execute o script FINAL-RLS-FIX.sql no Supabase Dashboard');
      return;
    }

    if (!usageData || usageData.length === 0) {
      console.log('⚠️ Nenhum dado encontrado no período especificado');
      
      // Buscar qualquer dado disponível
      const { data: anyData, error: anyError } = await supabase
        .from('usage_stats')
        .select('date, messages_sent, messages_received, user_id')
        .order('date', { ascending: false })
        .limit(10);

      if (anyError) {
        console.log('❌ Erro ao buscar qualquer dado:', anyError.message);
        return;
      }

      console.log(`📊 Encontrados ${anyData.length} registros na tabela (fora do período):`);
      anyData.forEach((record, index) => {
        console.log(`${index + 1}. ${record.date} | ${record.messages_sent}/${record.messages_received} | User: ${record.user_id.substring(0, 8)}...`);
      });
      
      return;
    }

    console.log(`✅ Encontrados ${usageData.length} registros no período especificado:`);
    
    // 2. Processar dados como o hook faz
    const processedData = usageData.map(item => {
      const date = new Date(item.date);
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      
      return {
        dia: dayNames[date.getDay()],
        enviadas: item.messages_sent || 0,
        recebidas: item.messages_received || 0,
        date: item.date
      };
    });

    // 3. Calcular totais
    const totalMessages = processedData.reduce((sum, day) => sum + day.enviadas + day.recebidas, 0);

    console.log('\n📈 Dados processados para o dashboard:');
    processedData.forEach((day, index) => {
      console.log(`${index + 1}. ${day.dia} (${day.date}) | Enviadas: ${day.enviadas} | Recebidas: ${day.recebidas}`);
    });

    console.log(`\n📊 Total de mensagens: ${totalMessages}`);

    // 4. Verificar se há dados suficientes para todos os 7 dias
    if (processedData.length < 7) {
      console.log(`\n⚠️ Apenas ${processedData.length} de 7 dias têm dados`);
      console.log('💡 O dashboard mostrará dados mock para os dias faltantes');
    } else {
      console.log('\n✅ Dados completos para todos os 7 dias!');
    }

    console.log('\n🎯 RESULTADO:');
    console.log('✅ O dashboard deve carregar corretamente');
    console.log('✅ Dados reais estão sendo retornados pelo Supabase');
    console.log('✅ Políticas RLS estão funcionando para leitura');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testDashboardData();
