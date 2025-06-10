import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NTYxMjAsImV4cCI6MjA0OTIzMjEyMH0.WrYqnftZOEX1FzLG0a4OEqgANOr9-dNxtQ-3R9hqJ50';

console.log('🔍 VERIFICANDO DADOS NA TABELA CONTACTS');
console.log('='.repeat(50));

async function checkContacts() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Verificando dados existentes...');
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .limit(10);
      
    if (error) {
      console.error('❌ Erro ao buscar contatos:', error.message);
      return;
    }
    
    console.log('✅ Total de contatos encontrados:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('\n📄 Primeiros contatos:');
      data.forEach((contact, index) => {
        console.log(`\n--- Contato ${index + 1} ---`);
        console.log('ID:', contact.id);
        console.log('Nome:', contact.name);
        console.log('Telefone:', contact.phone_number);
        console.log('Email:', contact.email);
        console.log('User ID:', contact.user_id);
        console.log('Custom Fields:', contact.custom_fields);
        console.log('Created At:', contact.created_at);
      });
    } else {
      console.log('\nℹ️ Nenhum contato encontrado.');
      console.log('💡 Vamos criar alguns dados de teste...');
      
      // Primeiro, vamos buscar um user_id válido
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      let testUserId = 'test-user-id';
      if (!profilesError && profiles && profiles.length > 0) {
        testUserId = profiles[0].id;
        console.log('✅ Usando user_id real:', testUserId);
      } else {
        console.log('⚠️ Usando user_id de teste:', testUserId);
      }
      
      const testContacts = [
        {
          name: 'João Silva',
          phone_number: '+5511999999999',
          email: 'joao@teste.com',
          user_id: testUserId,
          custom_fields: {
            summary: 'Cliente interessado em automação de WhatsApp',
            status: 'Contacted',
            purchaseAmount: 299
          }
        },
        {
          name: 'Maria Santos',
          phone_number: '+5511888888888',
          email: 'maria@teste.com',
          user_id: testUserId,
          custom_fields: {
            summary: 'Precisa de solução para atendimento ao cliente',
            status: 'Negotiating',
            purchaseAmount: 499
          }
        },
        {
          name: 'Pedro Costa',
          phone_number: '+5511777777777',
          email: 'pedro@teste.com',
          user_id: testUserId,
          custom_fields: {
            summary: 'Comprou pacote premium no mês passado',
            status: 'Purchased',
            purchaseAmount: 899
          }
        }
      ];
      
      const { data: insertedData, error: insertError } = await supabase
        .from('contacts')
        .insert(testContacts)
        .select();
        
      if (insertError) {
        console.error('❌ Erro ao inserir dados de teste:', insertError.message);
      } else {
        console.log('✅ Dados de teste inseridos com sucesso:', insertedData?.length || 0);
        console.log('\n📋 Dados inseridos:');
        insertedData?.forEach((contact, index) => {
          console.log(`\n--- Contato ${index + 1} ---`);
          console.log('ID:', contact.id);
          console.log('Nome:', contact.name);
          console.log('Telefone:', contact.phone_number);
          console.log('Custom Fields:', JSON.stringify(contact.custom_fields, null, 2));
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkContacts().catch(console.error);
