import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSpecificContact() {
  console.log('🔍 VERIFICANDO CONTATO ESPECÍFICO 4e2ad118-10c0-42c0-9c4d-82fd4204fe5b');
  console.log('='.repeat(70));
  
  try {
    // 1. Buscar o contato específico
    const contactId = '4e2ad118-10c0-42c0-9c4d-82fd4204fe5b';
    console.log('\n1. Buscando contato específico...');
    
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single();
    
    if (contactError) {
      console.error('❌ Erro ao buscar contato:', contactError);
      return;
    }
    
    if (!contact) {
      console.log('⚠️ Contato não encontrado');
      return;
    }
    
    console.log('✅ Contato encontrado:');
    console.log('  ID:', contact.id);
    console.log('  User ID:', contact.user_id);
    console.log('  Nome:', contact.name);
    console.log('  Telefone:', contact.phone_number);
    console.log('  Resume:', contact.resume);
    console.log('  Status:', contact.status);
    console.log('  Valor:', contact.valor);
    console.log('  Created At:', contact.created_at);
    console.log('  Custom Fields:', JSON.stringify(contact.custom_fields, null, 2));
    
    // 2. Verificar se existe usuário com esse user_id
    if (contact.user_id) {
      console.log('\n2. Verificando usuário dono do contato...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', contact.user_id)
        .single();
      
      if (profileError) {
        console.error('❌ Erro ao buscar perfil do usuário:', profileError);
      } else if (profile) {
        console.log('✅ Usuário dono do contato:');
        console.log('  ID:', profile.id);
        console.log('  Nome:', profile.full_name);
        console.log('  Email:', profile.email);
      } else {
        console.log('⚠️ Usuário não encontrado para este contato');
      }
    } else {
      console.log('⚠️ Contato não tem user_id definido');
    }
    
    // 3. Verificar todos os usuários jhony monhol
    console.log('\n3. Verificando todos os usuários jhony monhol...');
    const { data: jhonyUsers, error: jhonyError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .ilike('full_name', '%jhony%');
    
    if (jhonyError) {
      console.error('❌ Erro ao buscar usuários jhony:', jhonyError);
    } else {
      console.log('👥 Usuários jhony encontrados:');
      jhonyUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ID: ${user.id} | Nome: ${user.full_name} | Email: ${user.email}`);
      });
      
      // 4. Verificar se algum usuário jhony tem contatos
      console.log('\n4. Verificando contatos para cada usuário jhony...');
      for (const user of jhonyUsers) {
        const { data: userContacts, error: userContactsError } = await supabase
          .from('contacts')
          .select('id, name, status, resume')
          .eq('user_id', user.id);
        
        if (userContactsError) {
          console.error(`❌ Erro ao buscar contatos para ${user.full_name}:`, userContactsError);
        } else {
          console.log(`📊 ${user.full_name} (${user.id}): ${userContacts?.length || 0} contatos`);
          if (userContacts && userContacts.length > 0) {
            userContacts.forEach((contact, index) => {
              console.log(`    ${index + 1}. ${contact.name} - ${contact.status} - ${contact.resume?.substring(0, 50)}...`);
            });
          }
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkSpecificContact();
