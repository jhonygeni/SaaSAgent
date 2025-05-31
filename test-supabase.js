// Script de teste para verificar dados na tabela usage_stats
import { supabase } from './src/integrations/supabase/client.js'

async function testUsageStats() {
  console.log('🔍 Testando conexão com Supabase...')
  
  try {
    // Verificar se há dados na tabela usage_stats
    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .limit(10)
    
    if (error) {
      console.error('❌ Erro ao buscar dados:', error)
      return
    }
    
    console.log('✅ Dados encontrados:', data?.length || 0, 'registros')
    console.log('📊 Primeiros registros:', data)
    
    // Verificar dados dos últimos 7 dias
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const isoDate = sevenDaysAgo.toISOString().split('T')[0]
    
    const { data: recentData, error: recentError } = await supabase
      .from('usage_stats')
      .select('*')
      .gte('date', isoDate)
      .order('date', { ascending: true })
    
    if (recentError) {
      console.error('❌ Erro ao buscar dados recentes:', recentError)
      return
    }
    
    console.log('📅 Dados dos últimos 7 dias:', recentData?.length || 0, 'registros')
    console.log('🔢 Dados recentes:', recentData)
    
  } catch (err) {
    console.error('💥 Erro geral:', err)
  }
}

testUsageStats()
