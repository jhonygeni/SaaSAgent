import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkJhonyData() {
  console.log('🔍 VERIFICANDO DADOS PARA USUÁRIO 06e9efb8-d2ee-4a7b-9bb1-63f98a0b0d49 (jhony monhol)');
  console.log('='.repeat(70));
  
  try {
    // 1. Buscar dados do usuário específico pelo UUID
    const targetUserId = '6a5a76ea-d9be-4716-995c-98e4aa76fc06'; // UUID do user_id do contato existente
    console.log('\n1. Buscando perfil do usuário por UUID...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', targetUserId)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }
    
    if (!profiles) {
      console.log('⚠️ Usuário com UUID 06e9efb8-d2ee-4a7b-9bb1-63f98a0b0d49 não encontrado na tabela profiles');
      return;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log('  ID:', profiles.id);
    console.log('  Email:', profiles.email);
    console.log('  Nome:', profiles.full_name);
    
    const userId = profiles.id;
    
    // 2. Buscar contatos para este usuário
    console.log('\n2. Buscando contatos...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (contactsError) {
      console.error('❌ Erro ao buscar contatos:', contactsError);
      return;
    }
    
    console.log('📊 Total de contatos encontrados:', contacts?.length || 0);
    
    if (contacts && contacts.length > 0) {
      console.log('\n📋 Contatos encontrados:');
      contacts.forEach((contact, index) => {
        console.log(`\n--- Contato ${index + 1} ---`);
        console.log('ID:', contact.id);
        console.log('Nome:', contact.name);
        console.log('Telefone:', contact.phone_number);
        console.log('Email:', contact.email);
        console.log('Resume:', contact.resume);
        console.log('Status:', contact.status);
        console.log('Valor:', contact.valor);
        console.log('Custom Fields:', JSON.stringify(contact.custom_fields, null, 2));
        console.log('Created At:', contact.created_at);
      });
      
      // 3. Simular mapeamento do hook
      console.log('\n3. Simulando mapeamento do hook...');
      const mappedContacts = contacts.map(contact => {
        let summary = contact.resume || 'Cliente interessado em nossos serviços.';
        let status = contact.status || 'Contacted';
        let purchaseAmount = contact.valor ? Number(contact.valor) : undefined;
        
        // Fallback para custom_fields se os campos diretos não existirem
        if (!contact.resume && contact.custom_fields) {
          try {
            const customFields = typeof contact.custom_fields === 'string' 
              ? JSON.parse(contact.custom_fields) 
              : contact.custom_fields;
            
            if (customFields.summary) summary = customFields.summary;
            if (customFields.status) status = customFields.status;
            if (customFields.purchaseAmount) purchaseAmount = Number(customFields.purchaseAmount);
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
          email: contact.email,
          tags: contact.tags,
          customFields: contact.custom_fields
        };
      });
      
      console.log('\n🔄 Contatos mapeados para o dashboard:');
      mappedContacts.forEach((contact, index) => {
        console.log(`\n--- Contato Mapeado ${index + 1} ---`);
        console.log('Nome:', contact.name);
        console.log('Telefone:', contact.phoneNumber);
        console.log('Resumo:', contact.summary);
        console.log('Status:', contact.status);
        console.log('Valor:', contact.purchaseAmount);
        console.log('Data:', contact.date);
      });
      
    } else {
      console.log('\n📭 Nenhum contato encontrado para este usuário');
      console.log('💡 Vou criar um contato de teste...');
      
      const testContact = {
        name: 'Cliente Interessado Teste',
        phone_number: '+5511999123456',
        user_id: userId,
        resume: 'Cliente interessado em nossos serviços de automação',
        status: 'Contacted',
        valor: 500,
        custom_fields: {
          summary: 'Cliente interessado em automação WhatsApp',
          status: 'Contacted',
          purchaseAmount: 500
        }
      };
      
      const { data: newContact, error: insertError } = await supabase
        .from('contacts')
        .insert([testContact])
        .select();
        
      if (insertError) {
        console.error('❌ Erro ao criar contato:', insertError);
      } else {
        console.log('✅ Contato de teste criado:', newContact);
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkJhonyData();
