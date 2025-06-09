import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Testando persistência de instâncias WhatsApp com autenticação...\n');

async function testAuthenticatedPersistence() {
  try {
    // Primeiro, verificar se há usuário autenticado
    console.log('1. Verificando usuário autenticado...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.log('❌ Nenhum usuário autenticado encontrado');
      console.log('🔧 Tentando testar com user_id fictício que já existe no banco...');
      
      // Primeiro vamos ver que usuários existem
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(5);
      
      if (profilesError) {
        console.error('❌ Erro ao buscar perfis:', profilesError);
        return;
      }
      
      if (profiles && profiles.length > 0) {
        console.log('✅ Perfis encontrados:', profiles);
        const testUserId = profiles[0].id;
        console.log(`🧪 Usando user_id de teste: ${testUserId}`);
        
        // Tentar inserir usando um user_id existente
        await testInsertWithUserId(testUserId);
      } else {
        console.log('❌ Nenhum perfil encontrado no banco de dados');
      }
      
    } else {
      console.log('✅ Usuário autenticado:', userData.user.email || userData.user.id);
      
      // Tentar inserir com usuário autenticado
      await testInsertWithUserId(userData.user.id);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function testInsertWithUserId(userId) {
  console.log(`\n2. Testando inserção na tabela whatsapp_instances com user_id: ${userId}`);
  
  try {
    const testInstance = {
      user_id: userId,
      name: `test_auth_${Date.now()}`,
      status: 'testing',
      evolution_instance_id: `evo_${Date.now()}`,
      session_data: { test: true, auth_test: new Date().toISOString() }
    };
    
    console.log('📝 Dados da instância:', testInstance);
    
    const { data: newInstance, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert(testInstance)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError);
      console.error('Código:', insertError.code);
      console.error('Mensagem:', insertError.message);
      console.error('Detalhes:', insertError.details);
      console.error('Hint:', insertError.hint);
      
      if (insertError.code === '42501') {
        console.log('\n🔒 PROBLEMA IDENTIFICADO: RLS Policy está bloqueando a inserção');
        console.log('🔧 SOLUÇÕES POSSÍVEIS:');
        console.log('   1. Verificar se as políticas RLS estão configuradas corretamente');
        console.log('   2. Verificar se o usuário está devidamente autenticado');
        console.log('   3. Verificar se as políticas permitem INSERT com o user_id atual');
        
        // Testar política RLS
        await testRLSPolicies();
      }
      
    } else {
      console.log('✅ Inserção bem-sucedida:', newInstance);
      
      // Limpar o teste
      const { error: deleteError } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', newInstance.id);
      
      if (!deleteError) {
        console.log('✅ Registro de teste removido com sucesso');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na função testInsertWithUserId:', error);
  }
}

async function testRLSPolicies() {
  console.log('\n3. Testando políticas RLS...');
  
  try {
    // Testar acesso à tabela whatsapp_instances
    const { data, error } = await supabase
      .from('whatsapp_instances')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ RLS bloqueia leitura:', error.message);
    } else {
      console.log('✅ RLS permite leitura, total de registros:', data);
    }
    
    // Verificar se existem políticas para a tabela
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'whatsapp_instances');
    
    if (!policiesError && policies) {
      console.log(`📋 Políticas RLS encontradas para whatsapp_instances: ${policies.length}`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar RLS:', error);
  }
}

// Executar o teste
testAuthenticatedPersistence();
