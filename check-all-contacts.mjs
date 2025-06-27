import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkAllContacts() {
  console.log('🔍 VERIFICANDO TODOS OS CONTATOS NA TABELA');
  console.log('='.repeat(50));
  
  try {
    // 1. Buscar TODOS os contatos
    console.log('\n1. Buscando todos os contatos...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (contactsError) {
      console.error('❌ Erro ao buscar contatos:', contactsError);
      return;
    }
    
    console.log('📊 Total de contatos encontrados:', contacts?.length || 0);
    
    if (contacts && contacts.length > 0) {
      console.log('\n📋 Todos os contatos:');
      contacts.forEach((contact, index) => {
        console.log(`\n--- Contato ${index + 1} ---`);
        console.log('ID:', contact.id);
        console.log('User ID:', contact.user_id);
        console.log('Nome:', contact.name);
        console.log('Telefone:', contact.phone_number);
        console.log('Status:', contact.status);
        console.log('Resume:', contact.resume);
        console.log('Valor:', contact.valor);
        console.log('Created At:', contact.created_at);
      });
      
      // 2. Verificar se algum user_id corresponde aos nossos usuários jhony
      console.log('\n2. Verificando user_ids...');
      const userIds = [...new Set(contacts.map(c => c.user_id))];
      console.log('User IDs únicos encontrados:', userIds);
      
      // 3. Buscar perfis para esses user_ids
      console.log('\n3. Buscando perfis para esses user_ids...');
      for (const userId of userIds) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', userId)
          .single();
          
        if (profile) {
          console.log(`User ID ${userId}: ${profile.full_name} (${profile.email})`);
        } else {
          console.log(`User ID ${userId}: PERFIL NÃO ENCONTRADO`);
        }
      }
      
    } else {
      console.log('\n📭 Nenhum contato encontrado na tabela!');
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkAllContacts();
