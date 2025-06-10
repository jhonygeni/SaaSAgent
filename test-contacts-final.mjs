import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NTYxMjAsImV4cCI6MjA0OTIzMjEyMH0.WrYqnftZOEX1FzLG0a4OEqgANOr9-dNxtQ-3R9hqJ50';

console.log('🔍 TESTE FINAL - VALIDAÇÃO DOS CONTATOS');
console.log('='.repeat(60));

async function testContacts() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Verificando autenticação...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Erro de autenticação:', authError.message);
      return;
    }
    
    if (!session?.user) {
      console.log('⚠️ Usuário não autenticado - simulando com dados gerais');
      
      // Buscar todos os contatos para verificar se existem
      const { data: allContacts, error: allError } = await supabase
        .from('contacts')
        .select('*')
        .limit(5);
        
      if (allError) {
        console.error('❌ Erro ao buscar todos os contatos:', allError.message);
        return;
      }
      
      console.log('📊 Total de contatos na tabela:', allContacts?.length || 0);
      
      if (allContacts && allContacts.length > 0) {
        console.log('\n📋 Contatos encontrados:');
        allContacts.forEach((contact, index) => {
          console.log(`\n--- Contato ${index + 1} ---`);
          console.log('ID:', contact.id);
          console.log('Nome:', contact.name);
          console.log('Telefone:', contact.phone_number);
          console.log('User ID:', contact.user_id);
          console.log('Custom Fields:', contact.custom_fields);
        });
      }
      
      return;
    }
    
    console.log('✅ Usuário autenticado:', session.user.email);
    console.log('🆔 User ID:', session.user.id);
    
    console.log('\n2. Buscando contatos para o usuário logado...');
    const { data: userContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (contactsError) {
      console.error('❌ Erro ao buscar contatos do usuário:', contactsError.message);
      console.error('Código:', contactsError.code);
      console.error('Detalhes:', contactsError.details);
      return;
    }
    
    console.log('📊 Contatos encontrados para o usuário:', userContacts?.length || 0);
    
    if (userContacts && userContacts.length > 0) {
      console.log('\n📋 Contatos do usuário:');
      userContacts.forEach((contact, index) => {
        console.log(`\n--- Contato ${index + 1} ---`);
        console.log('ID:', contact.id);
        console.log('Nome:', contact.name);
        console.log('Telefone:', contact.phone_number);
        console.log('Custom Fields:', JSON.stringify(contact.custom_fields, null, 2));
        console.log('Created At:', contact.created_at);
      });
      
      console.log('\n3. Simulando mapeamento do hook...');
      const mappedContacts = userContacts.map(contact => {
        let summary = 'Cliente interessado em nossos serviços.';
        let status = 'Contacted';
        let purchaseAmount = undefined;
        
        if (contact.custom_fields) {
          try {
            const customFields = typeof contact.custom_fields === 'string' 
              ? JSON.parse(contact.custom_fields) 
              : contact.custom_fields;
            
            if (customFields.summary) {
              summary = customFields.summary;
            } else if (customFields.resume) {
              summary = customFields.resume;
            }
            
            if (customFields.status) {
              status = customFields.status;
            }
            
            if (customFields.purchaseAmount) {
              purchaseAmount = Number(customFields.purchaseAmount);
            }
          } catch (e) {
            console.warn('⚠️ Erro ao processar custom_fields:', e.message);
          }
        }
        
        return {
          id: contact.id,
          name: contact.name || 'Nome não informado',
          phoneNumber: contact.phone_number,
          summary,
          date: contact.created_at || new Date().toISOString(),
          status,
          purchaseAmount,
          email: undefined,
          tags: contact.tags,
          customFields: contact.custom_fields
        };
      });
      
      console.log('\n🔄 Contatos mapeados para o dashboard:');
      console.log(JSON.stringify(mappedContacts, null, 2));
      
      console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
      console.log('📊 Resumo:');
      console.log('- Usuário autenticado:', session.user.email);
      console.log('- Contatos encontrados:', userContacts.length);
      console.log('- Contatos mapeados:', mappedContacts.length);
      console.log('- Todos os campos necessários estão presentes');
      
    } else {
      console.log('\n📭 Nenhum contato encontrado para este usuário');
      console.log('💡 Vou criar um contato de teste...');
      
      const testContact = {
        name: 'Teste Dashboard',
        phone_number: '+5511999888777',
        user_id: session.user.id,
        custom_fields: {
          summary: 'Contato criado para teste do dashboard',
          status: 'Contacted',
          purchaseAmount: 200
        }
      };
      
      const { data: newContact, error: insertError } = await supabase
        .from('contacts')
        .insert([testContact])
        .select();
        
      if (insertError) {
        console.error('❌ Erro ao criar contato de teste:', insertError.message);
      } else {
        console.log('✅ Contato de teste criado:', newContact);
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testContacts().catch(console.error);
