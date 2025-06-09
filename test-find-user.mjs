import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 BUSCANDO USUÁRIOS NA TABELA PROFILES');
console.log('='.repeat(50));

async function findUsers() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Listando todos os usuários...');
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .limit(10);
    
    if (allError) {
      console.error('❌ Erro ao buscar perfis:', allError);
      return;
    }
    
    console.log(`✅ Encontrados ${allProfiles?.length || 0} usuários:`);
    if (allProfiles && allProfiles.length > 0) {
      allProfiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ${profile.email || 'sem email'} (ID: ${profile.id})`);
        console.log(`     Nome: ${profile.full_name || 'sem nome'}`);
        console.log(`     Criado em: ${profile.created_at || 'não informado'}`);
        console.log('');
      });
    }
    
    console.log('\n2. Buscando especificamente por jhonry@geni.chat...');
    const { data: specificUser, error: specificError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'jhonry@geni.chat');
    
    if (specificError) {
      console.error('❌ Erro na busca específica:', specificError);
    } else {
      console.log('📧 Resultado da busca por jhonry@geni.chat:', specificUser);
    }
    
    console.log('\n3. Buscando por termos similares...');
    const { data: similarUsers, error: similarError } = await supabase
      .from('profiles')
      .select('*')
      .or('email.ilike.%jhonry%,email.ilike.%geni%');
    
    if (similarError) {
      console.error('❌ Erro na busca similar:', similarError);
    } else {
      console.log('🔍 Usuários com termos similares:', similarUsers);
    }
    
    // Vamos usar o primeiro usuário encontrado para teste
    if (allProfiles && allProfiles.length > 0) {
      const testUser = allProfiles[0];
      console.log(`\n4. Testando criação de instância com usuário: ${testUser.email}`);
      
      const testInstance = {
        name: 'test-instance-' + Date.now(),
        phone_number: '+5511999888777',
        user_id: testUser.id,
        status: 'offline',
        evolution_instance_id: 'test_' + Date.now()
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('whatsapp_instances')
        .insert([testInstance])
        .select();
      
      if (insertError) {
        console.error('❌ ERRO na criação da instância:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details
        });
        
        if (insertError.code === '42501') {
          console.log('\n🚨 CONFIRMADO: Problema é RLS mesmo com user_id válido!');
          console.log('💡 SOLUÇÃO: Precisamos aplicar o fix das políticas RLS');
        }
      } else {
        console.log('✅ SUCESSO! Instância criada:', insertData);
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

findUsers().catch(console.error);
