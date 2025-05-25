import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO: Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 VERIFICANDO ESTRUTURA DO BANCO DE DADOS');

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    if (error && error.code === '42P01') {  // Código de erro para "relation does not exist"
      return false;
    }
    
    return true;
  } catch (err) {
    // Se der erro, provavelmente a tabela não existe
    return false;
  }
}

async function validateDatabase() {
  console.log('Verificando tabelas essenciais...');
  
  // Verificar tabela profiles
  const profilesExist = await checkTableExists('profiles');
  console.log(`Tabela profiles: ${profilesExist ? '✅ Existe' : '❌ Não existe'}`);
  
  // Verificar tabela subscription_plans
  const plansExist = await checkTableExists('subscription_plans');
  console.log(`Tabela subscription_plans: ${plansExist ? '✅ Existe' : '❌ Não existe'}`);
  
  // Verificar tabela subscriptions
  const subscriptionsExist = await checkTableExists('subscriptions');
  console.log(`Tabela subscriptions: ${subscriptionsExist ? '✅ Existe' : '❌ Não existe'}`);
  
  if (!profilesExist || !plansExist || !subscriptionsExist) {
    console.log(`
⚠️ ATENÇÃO: Uma ou mais tabelas essenciais estão faltando no banco de dados.
    
O erro "Database error saving new user" pode estar ocorrendo porque:
1. O trigger SQL tenta inserir dados em tabelas que não existem
2. As tabelas existem mas estão com estrutura diferente do esperado

SOLUÇÃO: Execute o arquivo sql-triggers-completo.sql no console SQL do Supabase,
mas primeiro verifique se ele cria as tabelas necessárias ou apenas os triggers.
Se ele apenas cria triggers, você precisa criar as tabelas primeiro.`);
  } else {
    console.log(`
✅ Todas as tabelas essenciais existem no banco de dados.

Se você ainda está tendo o erro "Database error saving new user", pode ser devido a:
1. Conflitos no trigger SQL
2. Problemas de permissão nas tabelas
3. Estrutura de tabela diferente do esperado pelo trigger

PRÓXIMOS PASSOS:
1. Verifique se o trigger SQL está corretamente implementado
2. Teste criar um usuário diretamente no dashboard do Supabase
3. Verifique os logs SQL no dashboard do Supabase`);
  }
  
  // Verificar se tabela subscription_plans tem pelo menos um registro
  if (plansExist) {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('id, name')
        .eq('name', 'Free')
        .limit(1);
      
      if (error) {
        console.error('Erro ao verificar plano Free:', error.message);
      } else if (!data || data.length === 0) {
        console.log(`⚠️ ATENÇÃO: Plano 'Free' não encontrado na tabela subscription_plans.
O trigger SQL tenta buscar este plano, e pode estar falhando por não encontrá-lo.`);
      } else {
        console.log(`✅ Plano 'Free' encontrado: ID ${data[0].id}`);
      }
    } catch (err) {
      console.error('Erro ao verificar planos:', err.message);
    }
  }
}

validateDatabase().catch(err => {
  console.error('❌ Erro na verificação do banco de dados:', err.message);
});
