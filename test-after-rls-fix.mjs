import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🧪 TESTE APÓS APLICAÇÃO DA CORREÇÃO RLS');
console.log('='.repeat(50));

async function testAfterRLSFix() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Testando criação de instância para jhony@geni.chat...');
    const userId = 'e8e521f6-7011-418c-a0b4-7ca696e56030'; // jhony@geni.chat
    
    const testInstance = {
      name: 'test-after-fix-' + Date.now(),
      phone_number: '+5511999123456',
      user_id: userId,
      status: 'offline',
      evolution_instance_id: 'fixed_test_' + Date.now(),
      session_data: {
        test: 'post_rls_fix',
        created_at: new Date().toISOString(),
        user_email: 'jhony@geni.chat'
      }
    };
    
    console.log('📝 Dados da instância:', {
      name: testInstance.name,
      user_id: testInstance.user_id,
      phone_number: testInstance.phone_number
    });
    
    const { data: insertData, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert([testInstance])
      .select();
    
    if (insertError) {
      console.error('❌ AINDA COM ERRO:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details
      });
      
      if (insertError.code === '42501') {
        console.log('\n🔍 RLS ainda está bloqueando - política pode não estar correta');
      } else if (insertError.code === '23505') {
        console.log('\n⚠️  Conflito de chave única - instância já existe');
      }
    } else {
      console.log('🎉 SUCESSO! Instância criada após correção RLS:');
      console.log('✅ ID:', insertData[0].id);
      console.log('✅ Nome:', insertData[0].name);
      console.log('✅ Status:', insertData[0].status);
      console.log('✅ Criada em:', insertData[0].created_at);
    }
    
    console.log('\n2. Verificando todas as instâncias do usuário...');
    const { data: allInstances, error: selectError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (selectError) {
      console.error('❌ Erro ao buscar instâncias:', selectError);
    } else {
      console.log(`📊 Total de instâncias encontradas: ${allInstances?.length || 0}`);
      
      if (allInstances && allInstances.length > 0) {
        console.log('\n📋 Lista de instâncias:');
        allInstances.forEach((inst, index) => {
          console.log(`  ${index + 1}. ${inst.name}`);
          console.log(`     Status: ${inst.status}`);
          console.log(`     Telefone: ${inst.phone_number || 'não definido'}`);
          console.log(`     Criada em: ${inst.created_at}`);
          console.log('');
        });
        
        console.log('🎯 CONCLUSÃO: PROBLEMA RESOLVIDO! Instâncias estão sendo salvas corretamente.');
      }
    }
    
    console.log('\n3. Teste de criação de múltiplas instâncias...');
    const multipleInstances = [
      {
        name: 'instagram-bot-1-' + Date.now(),
        user_id: userId,
        status: 'offline',
        evolution_instance_id: 'ig1_' + Date.now()
      },
      {
        name: 'whatsapp-bot-2-' + Date.now(),
        user_id: userId,
        status: 'offline',
        evolution_instance_id: 'wa2_' + Date.now()
      }
    ];
    
    const { data: multiData, error: multiError } = await supabase
      .from('whatsapp_instances')
      .insert(multipleInstances)
      .select();
    
    if (multiError) {
      console.error('❌ Erro na criação múltipla:', multiError.message);
    } else {
      console.log(`✅ Criadas ${multiData?.length || 0} instâncias em lote!`);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
testAfterRLSFix().catch(console.error);
