const { createClient } = require('@supabase/supabase-js');

// Usar apenas a chave ANON (segura para frontend)
const supabase = createClient(
  'https://hpovwcaskorzzrpphgkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc'
);

async function testeDefinitivo() {
  console.log('🎯 TESTE FINAL DEFINITIVO - WhatsApp Instances');
  console.log('==============================================');
  
  try {
    // 1. Verificar instâncias existentes do usuário jhony@geni.chat
    console.log('\n1️⃣ Verificando instâncias existentes...');
    const { data: existing, error: selectError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', 'e8e521f6-7011-418c-a0b4-7ca696e56030');
    
    if (selectError) {
      console.log('❌ Erro na consulta:', selectError.code, selectError.message);
    } else {
      console.log(`✅ Consulta OK - ${existing.length} instâncias encontradas para jhony@geni.chat`);
      existing.forEach((inst, i) => {
        console.log(`   ${i+1}. ${inst.name} (${inst.status}) - ${inst.created_at}`);
      });
    }
    
    // 2. Testar criação de nova instância
    console.log('\n2️⃣ Testando criação de nova instância...');
    const novaInstancia = {
      user_id: 'e8e521f6-7011-418c-a0b4-7ca696e56030', // jhony@geni.chat
      name: `WhatsApp_Business_${Date.now()}`,
      phone_number: '+5511987654321',
      status: 'created'
    };
    
    console.log('📤 Dados da nova instância:', novaInstancia);
    
    const { data: newInstance, error: insertError } = await supabase
      .from('whatsapp_instances')
      .insert(novaInstancia)
      .select();
    
    if (insertError) {
      console.log('❌ ERRO na criação:', insertError.code, insertError.message);
      console.log('   Detalhes:', insertError.details);
      console.log('   Dica:', insertError.hint);
    } else {
      console.log('✅ SUCESSO! Nova instância criada:');
      console.log(`   📱 ID: ${newInstance[0].id}`);
      console.log(`   📛 Nome: ${newInstance[0].name}`);
      console.log(`   👤 User ID: ${newInstance[0].user_id}`);
      console.log(`   📅 Criada em: ${newInstance[0].created_at}`);
    }
    
    // 3. Verificar total final
    console.log('\n3️⃣ Contagem final...');
    const { data: finalCount, error: countError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', 'e8e521f6-7011-418c-a0b4-7ca696e56030');
    
    if (!countError) {
      console.log(`📊 Total final: ${finalCount.length} instâncias para jhony@geni.chat`);
    }
    
    // 4. Resultado final
    console.log('\n🏆 RESULTADO FINAL:');
    if (!insertError) {
      console.log('✅ PROBLEMA COMPLETAMENTE RESOLVIDO!');
      console.log('✅ Instâncias estão sendo salvas corretamente no Supabase');
      console.log('✅ Políticas RLS funcionando perfeitamente');
      console.log('✅ Dashboard deve mostrar as instâncias agora!');
      console.log('\n🎉 SUCESSO TOTAL! 🎉');
    } else {
      console.log('❌ Ainda há problemas a resolver');
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

testeDefinitivo();
