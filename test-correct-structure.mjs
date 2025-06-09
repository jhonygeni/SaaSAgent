import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 TESTE COM ESTRUTURA CORRETA DA TABELA');
console.log('='.repeat(60));

async function testCorrectStructure() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Primeiro, vamos tentar encontrar um user_id válido
    console.log('\n1. Buscando usuários existentes...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    let testUserId;
    if (!profilesError && profiles && profiles.length > 0) {
      testUserId = profiles[0].id;
      console.log('✅ Encontrado user_id válido:', testUserId);
    } else {
      // Se não encontrar usuários, vamos gerar um UUID válido
      testUserId = randomUUID();
      console.log('⚠️  Usando UUID gerado para teste:', testUserId);
    }
    
    console.log('\n2. Testando INSERT com estrutura correta...');
    const correctInstance = {
      name: 'test-correct-structure',
      phone_number: '+5511999999999', // Campo correto é phone_number
      status: 'offline',
      user_id: testUserId, // UUID válido
      evolution_instance_id: 'evo-test-123'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert([correctInstance])
      .select();
    
    if (insertError) {
      console.error('❌ Erro INSERT com estrutura correta:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      
      // Se ainda der erro RLS, vamos tentar entender melhor
      if (insertError.code === '42501') {
        console.log('\n🔍 ERRO RLS DETECTADO - Analisando contexto...');
        
        // Verificar se temos sessão autenticada
        const { data: session } = await supabase.auth.getSession();
        console.log('📋 Sessão ativa:', !!session?.session);
        console.log('👤 Usuário autenticado:', !!session?.session?.user);
        
        if (session?.session?.user) {
          console.log('🔑 ID usuário logado:', session.session.user.id);
          console.log('🔑 ID usuário tentando inserir:', testUserId);
          console.log('🔄 IDs coincidem:', session.session.user.id === testUserId);
        }
      }
    } else {
      console.log('✅ INSERT com estrutura correta funcionou!');
      console.log('📄 Dados inseridos:', insertData);
      
      // Limpar o teste
      if (insertData && insertData[0]) {
        await supabase
          .from('whatsapp_instances')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Dados de teste limpos');
      }
    }
    
    console.log('\n3. Testando INSERT apenas com campos obrigatórios...');
    const minimalInstance = {
      name: 'test-minimal-correct',
      user_id: testUserId
    };
    
    const { data: minimalData, error: minimalError } = await supabase
      .from('whatsapp_instances')
      .insert([minimalInstance])
      .select();
    
    if (minimalError) {
      console.error('❌ Erro INSERT minimal:', {
        code: minimalError.code,
        message: minimalError.message
      });
    } else {
      console.log('✅ INSERT minimal funcionou!');
      console.log('📄 Dados inseridos:', minimalData);
      
      // Limpar o teste
      if (minimalData && minimalData[0]) {
        await supabase
          .from('whatsapp_instances')
          .delete()
          .eq('id', minimalData[0].id);
        console.log('🧹 Dados de teste limpos');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testCorrectStructure().catch(console.error);
