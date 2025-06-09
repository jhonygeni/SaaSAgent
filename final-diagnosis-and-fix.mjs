#!/usr/bin/env node

/**
 * Script simples para testar e verificar o problema RLS
 * e fornecer instruções para correção manual
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 DIAGNÓSTICO FINAL - Problema de Persistência WhatsApp Instances');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function diagnoseAndProvideInstructions() {
  try {
    // 1. Buscar usuários existentes
    console.log('\n1. 👥 Verificando usuários existentes...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(3);
    
    if (profilesError) {
      console.log(`❌ Erro ao buscar perfis: ${profilesError.message}`);
      return;
    }
    
    console.log(`✅ Encontrados ${profiles?.length || 0} usuários`);
    if (profiles && profiles.length > 0) {
      profiles.forEach((profile, i) => {
        console.log(`   ${i + 1}. ${profile.email} (${profile.id})`);
      });
    }
    
    // 2. Verificar instâncias existentes
    console.log('\n2. 📱 Verificando instâncias WhatsApp existentes...');
    const { data: instances, error: instancesError } = await supabase
      .from('whatsapp_instances')
      .select('id, name, user_id, status')
      .limit(5);
    
    if (instancesError) {
      console.log(`❌ Erro ao buscar instâncias: ${instancesError.message}`);
    } else {
      console.log(`✅ Encontradas ${instances?.length || 0} instâncias`);
      if (instances && instances.length > 0) {
        instances.forEach((instance, i) => {
          console.log(`   ${i + 1}. ${instance.name} (${instance.status}) - User: ${instance.user_id}`);
        });
      }
    }
    
    // 3. Testar problema de inserção
    console.log('\n3. 🧪 Testando problema de inserção...');
    
    if (profiles && profiles.length > 0) {
      const testUser = profiles[0];
      const testData = {
        user_id: testUser.id,
        name: `test_diagnostic_${Date.now()}`,
        status: 'testing',
        evolution_instance_id: 'test_diagnostic_id',
        session_data: { test: true, diagnostic: true }
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('whatsapp_instances')
        .insert(testData)
        .select()
        .single();
      
      if (insertError) {
        console.log(`❌ PROBLEMA CONFIRMADO: ${insertError.message}`);
        console.log(`   Código de erro: ${insertError.code}`);
        
        if (insertError.code === '42501') {
          console.log('   🚨 Este é o erro RLS (Row Level Security) que impede as instâncias de serem salvas!');
        }
      } else {
        console.log('✅ Inserção funcionou! O problema pode ter sido resolvido.');
        console.log(`   ID da instância criada: ${insertResult.id}`);
        
        // Limpar teste
        await supabase.from('whatsapp_instances').delete().eq('id', insertResult.id);
        console.log('✅ Teste limpo');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  }
}

async function provideInstructions() {
  console.log('\n📋 INSTRUÇÕES PARA CORREÇÃO NO SUPABASE DASHBOARD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('\n🌐 1. Acesse o Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard/projects');
  
  console.log('\n⚡ 2. Vá para SQL Editor:');
  console.log('   • No painel esquerdo, clique em "SQL Editor"');
  console.log('   • Clique em "New Query"');
  
  console.log('\n📝 3. Cole e execute o seguinte SQL:');
  console.log(`
-- CORREÇÃO RLS PARA WHATSAPP_INSTANCES
-- Remove política existente que está muito restritiva
DROP POLICY IF EXISTS "Users can manage their own instances" ON public.whatsapp_instances;

-- Cria políticas mais flexíveis
CREATE POLICY "Users can view their own instances" ON public.whatsapp_instances 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can create instances for users" ON public.whatsapp_instances 
  FOR INSERT 
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = user_id
    ))
  );

CREATE POLICY "Users can update their own instances" ON public.whatsapp_instances 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own instances" ON public.whatsapp_instances 
  FOR DELETE 
  USING (auth.uid() = user_id);
  `);
  
  console.log('\n▶️  4. Clique em "Run" para executar');
  
  console.log('\n✅ 5. Teste a correção:');
  console.log('   • Execute: node simple-persistence-test.mjs');
  console.log('   • Ou teste criando uma instância na aplicação');
  
  console.log('\n🔄 6. Se ainda não funcionar, use a versão mais permissiva:');
  console.log(`
-- VERSÃO MAIS PERMISSIVA (se a anterior não funcionar)
DROP POLICY IF EXISTS "Users can view their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "System can create instances for users" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can update their own instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete their own instances" ON public.whatsapp_instances;

CREATE POLICY "Temporary permissive policy" ON public.whatsapp_instances 
  FOR ALL 
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = user_id
    ))
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (user_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.profiles WHERE id = user_id
    ))
  );
  `);
  
  console.log('\n🎯 EXPLICAÇÃO DO PROBLEMA:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('• O código tenta salvar instâncias WhatsApp no Supabase');
  console.log('• As políticas RLS requerem auth.uid() = user_id');
  console.log('• Durante a criação, pode não haver contexto de usuário autenticado');
  console.log('• Resultado: erro 42501 (violação de política RLS)');
  console.log('• Solução: políticas mais flexíveis que permitem inserção com user_id válido');
  
  console.log('\n📁 ARQUIVOS CRIADOS PARA DEBUG:');
  console.log('• fix-whatsapp-instances-rls.sql - SQL completo para correção');
  console.log('• fix-rls-policies.mjs - Script JavaScript (alternativo)');
  console.log('• simple-persistence-test.mjs - Teste de persistência');
  console.log('• diagnose-rls.js - Diagnóstico detalhado');
}

// Executar diagnóstico e fornecer instruções
diagnoseAndProvideInstructions()
  .then(() => provideInstructions())
  .then(() => {
    console.log('\n🚀 PRÓXIMOS PASSOS:');
    console.log('1. Execute o SQL no Supabase Dashboard');
    console.log('2. Teste com: node simple-persistence-test.mjs');
    console.log('3. Teste na aplicação criando uma instância WhatsApp');
    console.log('4. Verifique se as instâncias aparecem no dashboard');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro:', error);
    process.exit(1);
  });
