import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickFixConstraint() {
  console.log('🔍 Investigando problema de foreign key...\n');

  try {
    // 1. Verificar se existem usuários em auth.users
    console.log('1. Verificando usuários em auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Não foi possível acessar auth.users (normal para usuários anônimos)');
      console.log('Vamos tentar uma abordagem diferente...\n');
    } else {
      console.log(`✅ Encontrados ${authUsers.users.length} usuários em auth.users`);
      if (authUsers.users.length > 0) {
        console.log(`Primeiro usuário: ${authUsers.users[0].id}`);
      }
    }

    // 2. Verificar se existe tabela public.users
    console.log('\n2. Verificando tabela public.users...');
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('id, email')
      .limit(5);

    if (publicError) {
      console.log('❌ Tabela public.users não acessível:', publicError.message);
    } else {
      console.log(`✅ Encontrados ${publicUsers.length} usuários em public.users`);
      if (publicUsers.length > 0) {
        console.log('Primeiro usuário:', publicUsers[0]);
      }
    }

    // 3. Tentar inserir dados usando UUID genérico primeiro
    console.log('\n3. Tentando inserir dados de teste...');
    const testUserId = '123e4567-e89b-12d3-a456-426614174000';
    
    const { data: insertResult, error: insertError } = await supabase
      .from('usage_stats')
      .insert([
        {
          user_id: testUserId,
          date: new Date().toISOString().split('T')[0],
          messages_sent: 25,
          messages_received: 21,
          active_sessions: 1,
          new_contacts: 1
        }
      ]);

    if (insertError) {
      console.log('❌ Erro ao inserir:', insertError.message);
      
      // Se erro de FK, tentar com usuário real se disponível
      if (insertError.message.includes('foreign key') && publicUsers && publicUsers.length > 0) {
        console.log('\n4. Tentando com usuário real...');
        const realUserId = publicUsers[0].id;
        
        const { data: insertResult2, error: insertError2 } = await supabase
          .from('usage_stats')
          .insert([
            {
              user_id: realUserId,
              date: new Date().toISOString().split('T')[0],
              messages_sent: 25,
              messages_received: 21,
              active_sessions: 1,
              new_contacts: 1
            }
          ]);

        if (insertError2) {
          console.log('❌ Ainda erro com usuário real:', insertError2.message);
        } else {
          console.log('✅ Sucesso com usuário real!');
        }
      }
    } else {
      console.log('✅ Dados inseridos com sucesso!');
    }

    // 4. Verificar dados existentes
    console.log('\n5. Verificando dados na tabela usage_stats...');
    const { data: existingData, error: selectError } = await supabase
      .from('usage_stats')
      .select('*')
      .limit(10);

    if (selectError) {
      console.log('❌ Erro ao consultar dados:', selectError.message);
    } else {
      console.log(`✅ Encontrados ${existingData.length} registros na tabela usage_stats`);
      if (existingData.length > 0) {
        console.log('Últimos registros:', existingData);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

quickFixConstraint();
