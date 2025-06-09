import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 TESTE COM USUÁRIO AUTENTICADO - jhonry@geni.chat');
console.log('='.repeat(60));

async function testWithAuthenticatedUser() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Buscando usuário jhonry@geni.chat na tabela profiles...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('email', 'jhonry@geni.chat')
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }
    
    if (!profiles) {
      console.log('⚠️  Usuário jhonry@geni.chat não encontrado na tabela profiles');
      return;
    }
    
    console.log('✅ Usuário encontrado:', {
      id: profiles.id,
      email: profiles.email,
      name: profiles.full_name
    });
    
    const userId = profiles.id;
    
    console.log('\n2. Testando criação de instância para usuário autenticado...');
    const testInstance = {
      name: 'instagram-bot-test',
      phone_number: '+5511999888777',
      user_id: userId,
      status: 'offline',
      evolution_instance_id: 'inst_' + Date.now(),
      session_data: {
        created_by: 'authenticated_user',
        test: true
      }
    };
    
    console.log('📝 Dados da instância:', testInstance);
    
    const { data: insertData, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert([testInstance])
      .select();
    
    if (insertError) {
      console.error('❌ ERRO na criação da instância:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      
      // Análise específica do erro RLS
      if (insertError.code === '42501') {
        console.log('\n🔍 ANÁLISE DO ERRO RLS:');
        console.log('- Código 42501 = Violação de política de segurança');
        console.log('- Usuário ID:', userId);
        console.log('- Problema: RLS está bloqueando mesmo com user_id válido');
        console.log('- Possível causa: Contexto de autenticação não está sendo reconhecido pelo RLS');
      }
    } else {
      console.log('✅ SUCESSO! Instância criada:', insertData);
    }
    
    console.log('\n3. Verificando instâncias existentes do usuário...');
    const { data: existingInstances, error: selectError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId);
    
    if (selectError) {
      console.error('❌ Erro ao buscar instâncias:', selectError);
    } else {
      console.log(`✅ Instâncias encontradas: ${existingInstances?.length || 0}`);
      if (existingInstances && existingInstances.length > 0) {
        console.log('📋 Lista de instâncias:');
        existingInstances.forEach((inst, index) => {
          console.log(`  ${index + 1}. ${inst.name} (${inst.status}) - ID: ${inst.id}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

console.log(`🔑 Supabase URL: ${SUPABASE_URL}`);
console.log(`🔑 ANON Key configurada: ${!!SUPABASE_ANON_KEY}`);

testWithAuthenticatedUser().catch(console.error);
