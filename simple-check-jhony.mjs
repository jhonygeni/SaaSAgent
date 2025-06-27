#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.error('❌ SUPABASE_ANON_KEY não configurada');
  console.error('Valor atual:', SUPABASE_ANON_KEY);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function simpleCheck() {
  console.log('🔍 Verificando dados de jhony@geni.chat...\n');
  
  try {
    // 1. Buscar user
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'jhony@geni.chat')
      .single();
    
    if (userError || !user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:', user.email);
    console.log('📝 User ID:', user.id);
    
    // 2. Buscar contatos
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id);
    
    if (contactsError) {
      console.log('❌ Erro ao buscar contatos:', contactsError.message);
      return;
    }
    
    console.log('\n📊 Total de contatos:', contacts?.length || 0);
    
    if (contacts && contacts.length > 0) {
      console.log('\n📋 Contatos encontrados:');
      contacts.forEach((contact, i) => {
        console.log(`${i + 1}. ${contact.name} - ${contact.phone_number}`);
        console.log(`   Status: ${contact.status || 'N/A'}`);
        console.log(`   Resume: ${contact.resume || 'N/A'}`);
        console.log(`   Valor: ${contact.valor || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('\n📭 Nenhum contato encontrado');
      console.log('💡 Criando contato de teste...');
      
      const { data: newContact, error: insertError } = await supabase
        .from('contacts')
        .insert([{
          name: 'Cliente Teste',
          phone_number: '+5511999888777',
          email: 'cliente@teste.com',
          user_id: user.id,
          resume: 'Cliente interessado em automação WhatsApp',
          status: 'Contacted',
          valor: 500
        }])
        .select();
        
      if (insertError) {
        console.log('❌ Erro ao criar contato:', insertError.message);
      } else {
        console.log('✅ Contato criado:', newContact[0].name);
      }
    }
    
  } catch (err) {
    console.error('💥 Erro:', err.message);
  }
}

simpleCheck();
