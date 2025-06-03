import { supabase } from '../integrations/supabase/client'

// Função para gerar dados de teste para os últimos 7 dias
export async function generateTestData() {
  console.log('🎯 Gerando dados de teste para usage_stats...')
  
  try {
    // Primeiro, vamos verificar se já existem dados
    const { data: existingData } = await supabase
      .from('usage_stats')
      .select('*')
      .limit(1)
    
    if (existingData && existingData.length > 0) {
      console.log('✅ Já existem dados na tabela usage_stats')
      return
    }
    
    // Gerar dados para os últimos 7 dias
    const testData = []
    const currentUser = 'test-user-123' // Usuário de teste padrão
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const isoDate = date.toISOString().split('T')[0]
      
      testData.push({
        user_id: currentUser,
        date: isoDate,
        messages_sent: Math.floor(Math.random() * 50) + 10, // 10-60 mensagens
        messages_received: Math.floor(Math.random() * 40) + 5, // 5-45 mensagens
        active_sessions: Math.floor(Math.random() * 8) + 1, // 1-8 sessões
        new_contacts: Math.floor(Math.random() * 5) // 0-4 contatos
      })
    }
    
    // Inserir dados de teste
    const { data, error } = await supabase
      .from('usage_stats')
      .insert(testData)
    
    if (error) {
      console.error('❌ Erro ao inserir dados de teste:', error)
      return
    }
    
    console.log('✅ Dados de teste criados com sucesso:', testData.length, 'registros')
    console.log('📊 Dados inseridos:', testData)
    
  } catch (err) {
    console.error('💥 Erro ao gerar dados de teste:', err)
  }
}

// Auto-executar quando importado
generateTestData()
