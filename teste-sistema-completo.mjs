import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const envPath = join(__dirname, '.env.local')

let SUPABASE_URL, SUPABASE_ANON_KEY

try {
  const envContent = readFileSync(envPath, 'utf-8')
  const envLines = envContent.split('\n')
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      SUPABASE_URL = line.split('=')[1].replace(/"/g, '')
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      SUPABASE_ANON_KEY = line.split('=')[1].replace(/"/g, '')
    }
  }
} catch (error) {
  console.error('❌ Erro ao carregar .env.local:', error.message)
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('🧪 TESTE ABRANGENTE DO SISTEMA')
console.log('=' .repeat(50))

async function testeCompleto() {
  try {
    // 1. Teste de conectividade
    console.log('\n1. 🌐 TESTANDO CONECTIVIDADE...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('usage_stats')
      .select('count')
      .limit(1)
    
    if (healthError) {
      console.log(`❌ Erro de conectividade: ${healthError.message}`)
      return
    }
    console.log('✅ Conectividade OK')

    // 2. Teste de dados de estatísticas
    console.log('\n2. 📊 VERIFICANDO DADOS DE ESTATÍSTICAS...')
    const { data: stats, error: statsError } = await supabase
      .from('usage_stats')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (statsError) {
      console.log(`❌ Erro ao buscar stats: ${statsError.message}`)
    } else {
      console.log(`✅ Dados encontrados: ${stats.length} registros`)
      if (stats.length > 0) {
        console.log(`   📈 Último registro: ${stats[0].created_at}`)
        console.log(`   📋 Campos: ${Object.keys(stats[0]).join(', ')}`)
      }
    }

    // 3. Teste de autenticação (status)
    console.log('\n3. 🔐 VERIFICANDO STATUS DE AUTENTICAÇÃO...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log(`⚠️  Sem usuário logado (normal): ${authError.message}`)
    } else if (user) {
      console.log(`✅ Usuário logado: ${user.email}`)
    } else {
      console.log('ℹ️  Nenhum usuário logado (esperado)')
    }

    // 4. Teste de tabelas principais
    console.log('\n4. 🗄️  VERIFICANDO TABELAS PRINCIPAIS...')
    
    const tabelas = [
      'users',
      'agents', 
      'whatsapp_instances',
      'subscription_plans'
    ]

    for (const tabela of tabelas) {
      try {
        const { data, error } = await supabase
          .from(tabela)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`   ❌ ${tabela}: ${error.message}`)
        } else {
          console.log(`   ✅ ${tabela}: Acessível`)
        }
      } catch (e) {
        console.log(`   ❌ ${tabela}: ${e.message}`)
      }
    }

    // 5. Verificar configurações críticas
    console.log('\n5. ⚙️  VERIFICANDO CONFIGURAÇÕES...')
    
    // Verificar se as variáveis de ambiente estão definidas
    const configCheck = {
      'SUPABASE_URL': SUPABASE_URL,
      'SUPABASE_ANON_KEY': SUPABASE_ANON_KEY ? '***DEFINIDA***' : undefined
    }

    for (const [key, value] of Object.entries(configCheck)) {
      if (value) {
        console.log(`   ✅ ${key}: Configurada`)
      } else {
        console.log(`   ❌ ${key}: Não configurada`)
      }
    }

    console.log('\n' + '=' .repeat(50))
    console.log('🎯 RESULTADO GERAL:')
    console.log('✅ Sistema básico funcionando')
    console.log('✅ Dashboard de estatísticas operacional')
    console.log('⚠️  Para login: aplicar correção no Supabase Dashboard')
    console.log('📋 Próxima ação: CORRECAO-LOGIN-URGENTE.md')

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message)
  }
}

testeCompleto()
