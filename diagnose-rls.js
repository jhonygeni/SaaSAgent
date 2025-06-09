#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseRLSIssue() {
  console.log('🔍 Diagnosticando problema de RLS na tabela whatsapp_instances...\n');
  
  try {
    // 1. Verificar se conseguimos acessar a tabela para leitura
    console.log('1. Testando acesso de leitura...');
    const { data: readData, error: readError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.log('❌ Leitura bloqueada:', readError.message);
    } else {
      console.log('✅ Leitura permitida, registros encontrados:', readData ? readData.length : 0);
    }
    
    // 2. Verificar usuário atual
    console.log('\n2. Verificando autenticação...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData?.user) {
      console.log('❌ Nenhum usuário autenticado');
      console.log('🚨 PROBLEMA PRINCIPAL: Não há usuário autenticado!');
      console.log('   Isso explica porque a inserção falha com RLS');
    } else {
      console.log('✅ Usuário autenticado:', userData.user.id);
    }
    
    // 3. Buscar usuários existentes
    console.log('\n3. Buscando usuários no sistema...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, created_at')
      .limit(3);
    
    if (profilesError) {
      console.log('❌ Erro ao buscar perfis:', profilesError.message);
    } else {
      console.log('✅ Perfis encontrados:', profiles?.length || 0);
      if (profiles && profiles.length > 0) {
        console.log('   Exemplos:', profiles.map(p => ({ id: p.id, email: p.email })));
      }
    }
    
    // 4. Testar inserção com usuário fictício
    if (profiles && profiles.length > 0) {
      console.log('\n4. Tentando inserção com user_id existente...');
      const testUserId = profiles[0].id;
      
      const { data: insertData, error: insertError } = await supabase
        .from('whatsapp_instances')
        .insert({
          user_id: testUserId,
          name: `test_rls_${Date.now()}`,
          status: 'testing',
          evolution_instance_id: 'test_id',
          session_data: { test: true }
        })
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ Inserção falhou:', insertError.message);
        console.log('   Código:', insertError.code);
        
        if (insertError.code === '42501') {
          console.log('🚨 CONFIRMADO: Política RLS está bloqueando a inserção');
          console.log('   Mesmo com user_id válido, a inserção é bloqueada');
          console.log('   Isso indica que as políticas RLS requerem autenticação ativa');
        }
      } else {
        console.log('✅ Inserção bem-sucedida!');
        // Limpar
        await supabase.from('whatsapp_instances').delete().eq('id', insertData.id);
      }
    }
    
    console.log('\n📋 RESUMO DO DIAGNÓSTICO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔴 PROBLEMA IDENTIFICADO:');
    console.log('   As instâncias WhatsApp não são salvas porque:');
    console.log('   1. As políticas RLS requerem usuário autenticado (auth.uid())');
    console.log('   2. Na criação da instância, pode não haver usuário autenticado');
    console.log('   3. Ou a autenticação não está sendo passada corretamente');
    console.log('');
    console.log('🔧 SOLUÇÕES POSSÍVEIS:');
    console.log('   1. Garantir que usuário esteja autenticado antes de criar instância');
    console.log('   2. Modificar as políticas RLS para permitir inserção do sistema');
    console.log('   3. Usar service role key para operações críticas do sistema');
    console.log('');
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  }
}

diagnoseRLSIssue().then(() => {
  console.log('✅ Diagnóstico concluído');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
