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

async function testAfterFix() {
  console.log('🧪 Testando após aplicação da correção...\n');

  try {
    // 1. Verificar dados existentes na usage_stats
    console.log('1. Verificando dados na tabela usage_stats...');
    const { data: existingData, error: selectError } = await supabase
      .from('usage_stats')
      .select('*')
      .order('date', { ascending: false })
      .limit(10);

    if (selectError) {
      console.log('❌ Erro ao consultar dados:', selectError.message);
      return;
    }

    console.log(`✅ Encontrados ${existingData.length} registros na tabela usage_stats`);
    
    if (existingData.length > 0) {
      console.log('\n📊 Dados encontrados:');
      existingData.forEach((record, index) => {
        console.log(`${index + 1}. Data: ${record.date} | Mensagens: ${record.messages_sent}/${record.messages_received} | User: ${record.user_id}`);
      });
    } else {
      console.log('⚠️  Nenhum dado encontrado. Pode ser necessário executar o script SQL.');
    }

    // 2. Tentar inserir novo registro para verificar se constraints funcionam
    console.log('\n2. Testando inserção de novo registro...');
    const today = new Date().toISOString().split('T')[0];
    
    const { data: insertData, error: insertError } = await supabase
      .from('usage_stats')
      .insert([
        {
          user_id: existingData.length > 0 ? existingData[0].user_id : '123e4567-e89b-12d3-a456-426614174000',
          date: today,
          messages_sent: 50,
          messages_received: 45,
          active_sessions: 2,
          new_contacts: 1
        }
      ])
      .select();

    if (insertError) {
      if (insertError.code === '23505') {
        console.log('✅ Constraint de unicidade funcionando (registro já existe para hoje)');
      } else {
        console.log('❌ Erro ao inserir:', insertError.message);
      }
    } else {
      console.log('✅ Novo registro inserido com sucesso!');
      console.log('Dados inseridos:', insertData);
    }

    // 3. Verificar políticas RLS
    console.log('\n3. Testando acesso de leitura...');
    const { data: readTest, error: readError } = await supabase
      .from('usage_stats')
      .select('count(*)')
      .single();

    if (readError) {
      console.log('❌ Erro de RLS na leitura:', readError.message);
    } else {
      console.log('✅ Políticas RLS funcionando corretamente para leitura');
      console.log('Total de registros:', readTest.count);
    }

    console.log('\n🎯 RESULTADO DO TESTE:');
    if (existingData.length > 0) {
      console.log('✅ Dados estão presentes na tabela usage_stats');
      console.log('✅ O dashboard deve agora carregar as estatísticas corretamente');
      console.log('\n🌐 Acesse http://localhost:5173 para verificar o dashboard');
    } else {
      console.log('❌ Ainda não há dados na tabela');
      console.log('📋 Execute o script SQL no Supabase Dashboard primeiro');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testAfterFix();
