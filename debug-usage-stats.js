const { createClient } = require('@supabase/supabase-js')

// Usar as credenciais do .env.local
const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugUsageStatsTable() {
  console.log('🔍 Verificando estado da tabela usage_stats...')
  
  // 1. Tentar acessar dados básicos
  console.log('\n1. Testando acesso básico à tabela:')
  try {
    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('❌ Erro ao acessar tabela:', error.message)
      console.error('   Código:', error.code)
      console.error('   Detalhes:', error.details)
      console.error('   Dica:', error.hint)
    } else {
      console.log('✅ Acesso à tabela bem-sucedido')
      console.log('   Registros encontrados:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('   Primeiro registro:', data[0])
      }
    }
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }

  // 2. Testar inserção de dados
  console.log('\n2. Testando inserção de dados:')
  try {
    const testRecord = {
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      date: new Date().toISOString().split('T')[0],
      messages_sent: 1,
      messages_received: 0,
      active_sessions: 1,
      new_contacts: 0
    }
    
    const { data, error } = await supabase
      .from('usage_stats')
      .insert(testRecord)
      .select()
    
    if (error) {
      console.error('❌ Erro ao inserir dados:', error.message)
      console.error('   Código:', error.code)
      console.error('   Detalhes:', error.details)
    } else {
      console.log('✅ Inserção bem-sucedida:', data)
    }
  } catch (error) {
    console.error('❌ Erro geral na inserção:', error.message)
  }

  // 3. Testar busca com filtro de usuário
  console.log('\n3. Testando busca com filtro de usuário:')
  try {
    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', '123e4567-e89b-12d3-a456-426614174000')
    
    if (error) {
      console.error('❌ Erro na busca filtrada:', error.message)
    } else {
      console.log('✅ Busca filtrada bem-sucedida')
      console.log('   Registros do usuário:', data?.length || 0)
    }
  } catch (error) {
    console.error('❌ Erro geral na busca filtrada:', error.message)
  }

  // 4. Verificar se conseguimos acessar informações do usuário atual
  console.log('\n4. Verificando usuário atual:')
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.log('ℹ️ Nenhum usuário autenticado (modo anônimo)')
    } else {
      console.log('✅ Usuário autenticado:', user?.id)
    }
  } catch (error) {
    console.log('ℹ️ Erro ao verificar usuário:', error.message)
  }

  console.log('\n🔧 Diagnóstico concluído!')
}

// Executar diagnóstico
debugUsageStatsTable().catch(console.error)
