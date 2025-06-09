import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔧 APLICANDO CORREÇÃO DAS POLÍTICAS RLS');
console.log('='.repeat(50));

async function applyRLSFix() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log('\n1. Removendo política existente...');
    
    // Como não podemos executar DDL diretamente, vamos fazer um teste funcional
    console.log('⚠️  Não é possível executar DDL via cliente JavaScript');
    console.log('📋 INSTRUÇÕES PARA CORREÇÃO MANUAL:');
    console.log('');
    console.log('1. Acesse o Supabase Dashboard > SQL Editor');
    console.log('2. Execute este SQL:');
    console.log('');
    console.log('-- Remove política existente');
    console.log('DROP POLICY IF EXISTS "Users can manage their own instances" ON public.whatsapp_instances;');
    console.log('');
    console.log('-- Cria política mais flexível para INSERT');
    console.log('CREATE POLICY "System can create instances for users" ON public.whatsapp_instances');
    console.log('  FOR INSERT');
    console.log('  WITH CHECK (');
    console.log('    user_id IS NOT NULL AND EXISTS (');
    console.log('      SELECT 1 FROM public.profiles WHERE id = user_id');
    console.log('    )');
    console.log('  );');
    console.log('');
    console.log('-- Política para SELECT');
    console.log('CREATE POLICY "Users can view their own instances" ON public.whatsapp_instances');
    console.log('  FOR SELECT');
    console.log('  USING (auth.uid() = user_id);');
    console.log('');
    
    console.log('\n2. Testando com usuário jhony@geni.chat...');
    const userId = 'e8e521f6-7011-418c-a0b4-7ca696e56030';
    
    const testInstance = {
      name: 'instagram-bot-jhony',
      phone_number: '+5511999123456',
      user_id: userId,
      status: 'offline',
      evolution_instance_id: 'jhony_inst_' + Date.now(),
      session_data: {
        created_by: 'jhony@geni.chat',
        test_mode: true
      }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert([testInstance])
      .select();
    
    if (insertError) {
      console.error('❌ AINDA COM ERRO após tentativa:', {
        code: insertError.code,
        message: insertError.message
      });
      
      if (insertError.code === '42501') {
        console.log('\n🔍 RLS ainda está bloqueando - precisa aplicar correção SQL');
      }
    } else {
      console.log('✅ SUCESSO! Instância criada após correção:', insertData);
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

applyRLSFix().catch(console.error);
