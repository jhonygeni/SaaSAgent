#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 TESTE DE CONTEXTO DE AUTENTICAÇÃO SUPABASE');
console.log('='.repeat(60));

async function testAuthContext() {
  try {
    console.log('\n1. Criando cliente Supabase...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n2. Verificando sessão atual...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Erro ao obter sessão:', sessionError);
    } else {
      console.log('📋 Sessão atual:', {
        user: session?.session?.user ? {
          id: session.session.user.id,
          email: session.session.user.email,
          authenticated: true
        } : null,
        sessionExists: !!session?.session
      });
    }
    
    console.log('\n3. Verificando usuário atual...');
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError);
    } else {
      console.log('👤 Usuário atual:', {
        user: user?.user ? {
          id: user.user.id,
          email: user.user.email,
          authenticated: true
        } : null,
        userExists: !!user?.user
      });
    }
    
    console.log('\n4. Testando SELECT sem autenticação...');
    const { data: selectData, error: selectError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Erro SELECT:', selectError);
    } else {
      console.log('✅ SELECT funcionou - dados encontrados:', selectData?.length || 0);
    }
    
    console.log('\n5. Tentando INSERT sem autenticação...');
    const testInstance = {
      name: 'test-auth-context',
      phone: '+5511999999999',
      status: 'offline',
      webhook_url: 'https://example.com/webhook',
      api_key: 'test-key-123',
      user_id: 'test-user-no-auth' // ID de usuário fake para teste
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert([testInstance])
      .select();
    
    if (insertError) {
      console.error('❌ Erro INSERT sem auth:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
    } else {
      console.log('✅ INSERT sem auth funcionou:', insertData);
    }
    
    console.log('\n6. Testando com user_id específico...');
    // Vamos tentar descobrir um user_id válido
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);
    
    if (!profilesError && profiles && profiles.length > 0) {
      const validUserId = profiles[0].id;
      console.log(`📧 Encontrado usuário válido: ${profiles[0].email} (${validUserId})`);
      
      const testInstanceWithValidUser = {
        ...testInstance,
        name: 'test-with-valid-user',
        user_id: validUserId
      };
      
      const { data: insertWithValidUser, error: insertValidUserError } = await supabase
        .from('whatsapp_instances')
        .insert([testInstanceWithValidUser])
        .select();
      
      if (insertValidUserError) {
        console.error('❌ Erro INSERT com user_id válido:', {
          code: insertValidUserError.code,
          message: insertValidUserError.message,
          details: insertValidUserError.details
        });
      } else {
        console.log('✅ INSERT com user_id válido funcionou:', insertWithValidUser);
      }
    } else {
      console.log('⚠️  Não foi possível encontrar usuários válidos na tabela profiles');
    }
    
  } catch (error) {
    console.error('💥 Erro geral no teste:', error);
  }
}

console.log(`🔑 URL: ${SUPABASE_URL}`);
console.log(`🔑 ANON_KEY: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NÃO DEFINIDA'}`);

testAuthContext().catch(console.error);
