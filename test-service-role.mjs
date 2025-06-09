import { createClient } from '@supabase/supabase-js';

// Vamos tentar usar a service_role key diretamente
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzY1NjEyMCwiZXhwIjoyMDQ5MjMyMTIwfQ.UJNmtYxwPEA-vULU6HpBPAyM3hSf26KzK3bUbRAXF4w';

const supabaseAdmin = createClient(
  'https://hpovwcaskorzzrpphgkc.supabase.co',
  SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testServiceRoleInsert() {
  console.log('🔐 TESTANDO COM SERVICE_ROLE KEY');
  console.log('================================');
  
  try {
    // 1. Verificar se conseguimos fazer SELECT (leitura)
    console.log('1. Testando SELECT...');
    const { data: selectData, error: selectError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .limit(3);
    
    if (selectError) {
      console.log('❌ Erro SELECT:', selectError.message);
    } else {
      console.log(`✅ SELECT OK - ${selectData.length} registros encontrados`);
    }
    
    // 2. Testar INSERT com service_role
    console.log('\n2. Testando INSERT com service_role...');
    const testInstance = {
      user_id: 'e8e521f6-7011-418c-a0b4-7ca696e56030',
      name: `service_role_test_${Date.now()}`,
      phone_number: '+5511999887766',
      status: 'created',
      evolution_instance_id: `srv_${Date.now()}`,
      session_data: { test: 'service_role_insert' }
    };
    
    console.log('📤 Inserindo:', testInstance.name);
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('whatsapp_instances')
      .insert(testInstance)
      .select();
    
    if (insertError) {
      console.log('❌ Erro INSERT:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details
      });
    } else {
      console.log('✅ INSERT OK!', {
        id: insertData[0].id,
        name: insertData[0].name,
        created_at: insertData[0].created_at
      });
    }
    
    // 3. Verificar se a linha foi realmente inserida
    console.log('\n3. Verificando inserção...');
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('whatsapp_instances')
      .select('*')
      .eq('name', testInstance.name);
    
    if (verifyError) {
      console.log('❌ Erro verificação:', verifyError.message);
    } else {
      console.log(`✅ Verificação OK - ${verifyData.length} registros com o nome ${testInstance.name}`);
    }
    
    // 4. Verificar RLS status
    console.log('\n4. Verificando status do RLS...');
    const { data: rlsData, error: rlsError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql_query: "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'whatsapp_instances';" 
      });
    
    if (rlsError) {
      console.log('❌ Erro RLS check:', rlsError.message);
    } else {
      console.log('✅ RLS Status:', rlsData);
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

testServiceRoleInsert();
