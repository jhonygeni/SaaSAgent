// Teste direto do hook useUsageStats
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUsageStatsAccess() {
  console.log('🔍 Testando acesso às estatísticas de uso...\n');

  // Simulação do que o hook useUsageStats faz
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  console.log('👤 Usuário de teste:', userId);

  // Datas dos últimos 7 dias
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  console.log('📅 Período:', sevenDaysAgo.toISOString().split('T')[0], 'até', today.toISOString().split('T')[0]);

  // Teste 1: Busca com filtro de usuário
  console.log('\n📊 Teste 1: Busca com filtro de usuário...');
  try {
    const result1 = await supabase
      .from('usage_stats')
      .select('date, messages_sent, messages_received')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: true });

    console.log('✅ Resultado:', {
      erro: result1.error?.message,
      codigo: result1.error?.code,
      dados: result1.data?.length || 0,
      primeiroItem: result1.data?.[0]
    });
  } catch (error) {
    console.error('❌ Erro na busca 1:', error.message);
  }

  // Teste 2: Busca sem filtro de usuário
  console.log('\n📊 Teste 2: Busca sem filtro de usuário...');
  try {
    const result2 = await supabase
      .from('usage_stats')
      .select('date, messages_sent, messages_received, user_id')
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(10);

    console.log('✅ Resultado:', {
      erro: result2.error?.message,
      codigo: result2.error?.code,
      dados: result2.data?.length || 0,
      primeiroItem: result2.data?.[0]
    });
  } catch (error) {
    console.error('❌ Erro na busca 2:', error.message);
  }

  // Teste 3: Verificar se a tabela existe
  console.log('\n📊 Teste 3: Verificar estrutura da tabela...');
  try {
    const result3 = await supabase
      .from('usage_stats')
      .select('*')
      .limit(1);

    console.log('✅ Tabela existe:', {
      erro: result3.error?.message,
      codigo: result3.error?.code,
      detalhes: result3.error?.details,
      hint: result3.error?.hint
    });
  } catch (error) {
    console.error('❌ Erro na verificação da tabela:', error.message);
  }

  // Teste 4: Tentar inserir dados de teste
  console.log('\n📊 Teste 4: Tentar inserir dados de teste...');
  try {
    const testData = {
      user_id: userId,
      date: today.toISOString().split('T')[0],
      messages_sent: 5,
      messages_received: 3,
      active_sessions: 1,
      new_contacts: 0
    };

    const result4 = await supabase
      .from('usage_stats')
      .insert(testData)
      .select();

    console.log('✅ Inserção:', {
      erro: result4.error?.message,
      codigo: result4.error?.code,
      sucesso: !!result4.data,
      dados: result4.data
    });
  } catch (error) {
    console.error('❌ Erro na inserção:', error.message);
  }

  // Teste 5: Verificar usuário atual
  console.log('\n👤 Teste 5: Verificar autenticação...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('✅ Usuário:', {
      autenticado: !!user,
      id: user?.id,
      email: user?.email,
      erro: error?.message
    });
  } catch (error) {
    console.error('❌ Erro na autenticação:', error.message);
  }

  console.log('\n🔧 Diagnóstico completo!');
}

// Executar teste
testUsageStatsAccess().catch(console.error);
