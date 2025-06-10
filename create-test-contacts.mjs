import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fdzhhdmxhzsrfbtqmwip.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkemhoZG14aHpzcmZidHFtd2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1ODYxNTAsImV4cCI6MjA0NzE2MjE1MH0.7QON3_zSNGF5oOTU1Pzo1nRCFZ-YxnKCTSXasDz2aOY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkUsersAndCreateContacts() {
  console.log('🔍 Verificando usuários e criando contatos de teste...');
  
  try {
    // Buscar usuários existentes na tabela profiles
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log('👥 Usuários encontrados:', users?.length || 0);
    
    if (!users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado');
      return;
    }

    // Usar o primeiro usuário para criar contatos de teste
    const testUser = users[0];
    console.log('🧪 Criando contatos de teste para usuário:', testUser.id);

    const testContacts = [
      {
        name: 'João Silva Santos',
        phone_number: '+55 11 99876-5432',
        email: 'joao.silva@email.com',
        user_id: testUser.id,
        custom_fields: {
          summary: 'Cliente interessado em apartamentos de 2 quartos na zona sul. Perguntou sobre financiamento.',
          status: 'Contacted',
          source: 'WhatsApp'
        },
        tags: ['lead', 'imoveis']
      },
      {
        name: 'Maria Oliveira Costa',
        phone_number: '+55 11 98765-4321',
        email: 'maria.oliveira@email.com',
        user_id: testUser.id,
        custom_fields: {
          summary: 'Procurando casa com quintal para comprar. Orçamento de R$ 500 mil.',
          status: 'Negotiating',
          source: 'Site'
        },
        tags: ['hot-lead', 'casa']
      },
      {
        name: 'Carlos Ferreira Lima',
        phone_number: '+55 21 99876-1234',
        email: 'carlos.ferreira@email.com',
        user_id: testUser.id,
        custom_fields: {
          summary: 'Comprou apartamento de 3 quartos na zona oeste. Cliente satisfeito.',
          status: 'Purchased',
          purchaseAmount: 450000,
          source: 'Indicação'
        },
        tags: ['cliente', 'vendido']
      }
    ];

    // Verificar se já existem contatos para este usuário
    const { data: existingContacts, error: existingError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', testUser.id);

    if (existingError) {
      console.error('❌ Erro ao verificar contatos existentes:', existingError);
      return;
    }

    console.log('📋 Contatos existentes:', existingContacts?.length || 0);

    if (existingContacts && existingContacts.length > 0) {
      console.log('✅ Já existem contatos para este usuário');
      console.log('📊 Contatos encontrados:');
      existingContacts.forEach(contact => {
        console.log(`  • ${contact.name} (${contact.phone_number})`);
      });
      return;
    }

    // Inserir contatos de teste
    const { data: insertedContacts, error: insertError } = await supabase
      .from('contacts')
      .insert(testContacts)
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir contatos:', insertError);
      return;
    }

    console.log('✅ Contatos de teste criados com sucesso!');
    console.log('📊 Contatos criados:');
    insertedContacts?.forEach(contact => {
      console.log(`  • ${contact.name} (${contact.phone_number})`);
    });

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkUsersAndCreateContacts();
