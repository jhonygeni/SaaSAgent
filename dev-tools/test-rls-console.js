// Script para testar RLS diretamente no console do navegador
// Copie e cole este código no console do navegador (F12) quando estiver em localhost:8081

console.log('🔍 Iniciando testes de RLS do Supabase...');

// Função para testar diferentes métodos de acesso
async function testAllRLSMethods() {
  const results = [];
  
  try {
    // 1. Acesso direto sem filtros
    console.log('📋 Teste 1: Acesso direto à tabela...');
    const { data: directData, error: directError } = await window.supabase
      .from('usage_stats')
      .select('*')
      .limit(5);
    
    results.push({
      method: 'Acesso Direto',
      success: !directError,
      data: directData,
      error: directError?.message,
      count: directData?.length || 0
    });

    // 2. Com UUID específico
    console.log('📋 Teste 2: Acesso com UUID específico...');
    const { data: uuidData, error: uuidError } = await window.supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', '123e4567-e89b-12d3-a456-426614174000')
      .limit(5);
    
    results.push({
      method: 'UUID Específico',
      success: !uuidError,
      data: uuidData,
      error: uuidError?.message,
      count: uuidData?.length || 0
    });

    // 3. Verificar sessão atual
    console.log('📋 Teste 3: Verificando sessão de autenticação...');
    const { data: { session }, error: sessionError } = await window.supabase.auth.getSession();
    
    results.push({
      method: 'Sessão Auth',
      success: !sessionError,
      data: { 
        hasSession: !!session, 
        userId: session?.user?.id || 'N/A',
        userEmail: session?.user?.email || 'N/A'
      },
      error: sessionError?.message,
      count: session ? 1 : 0
    });

    // 4. Se há sessão, testar com o usuário da sessão
    if (session?.user?.id) {
      console.log('📋 Teste 4: Acesso com usuário da sessão...');
      const { data: sessionUserData, error: sessionUserError } = await window.supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', session.user.id)
        .limit(5);
      
      results.push({
        method: 'Usuário da Sessão',
        success: !sessionUserError,
        data: sessionUserData,
        error: sessionUserError?.message,
        count: sessionUserData?.length || 0
      });
    }

    // 5. Tentar login anônimo
    console.log('📋 Teste 5: Tentando login anônimo...');
    try {
      const { data: anonData, error: anonError } = await window.supabase.auth.signInAnonymously();
      
      results.push({
        method: 'Login Anônimo',
        success: !anonError,
        data: anonData?.user ? { userId: anonData.user.id } : null,
        error: anonError?.message,
        count: anonData?.user ? 1 : 0
      });

      // Se login anônimo funcionou, testar acesso
      if (anonData?.user) {
        const { data: anonAccessData, error: anonAccessError } = await window.supabase
          .from('usage_stats')
          .select('*')
          .eq('user_id', anonData.user.id)
          .limit(5);
        
        results.push({
          method: 'Acesso Anônimo',
          success: !anonAccessError,
          data: anonAccessData,
          error: anonAccessError?.message,
          count: anonAccessData?.length || 0
        });
      }
    } catch (anonErr) {
      results.push({
        method: 'Login Anônimo',
        success: false,
        error: anonErr.message,
        count: 0
      });
    }

  } catch (generalError) {
    console.error('❌ Erro geral nos testes:', generalError);
    results.push({
      method: 'Erro Geral',
      success: false,
      error: generalError.message,
      count: 0
    });
  }

  // Mostrar resultados
  console.log('\n🎯 RESULTADOS DOS TESTES RLS:');
  console.log('=====================================');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.method}:`);
    console.log(`   Sucesso: ${result.success}`);
    console.log(`   Registros: ${result.count}`);
    if (result.error) {
      console.log(`   Erro: ${result.error}`);
    }
    if (result.data && Object.keys(result.data).length > 0) {
      console.log(`   Dados:`, result.data);
    }
    console.log('');
  });

  console.log('=====================================');
  console.log('🔍 Análise:');
  
  const successfulMethods = results.filter(r => r.success);
  const methodsWithData = results.filter(r => r.success && r.count > 0);
  
  console.log(`✅ Métodos que funcionaram: ${successfulMethods.length}/${results.length}`);
  console.log(`📊 Métodos com dados: ${methodsWithData.length}/${results.length}`);
  
  if (methodsWithData.length === 0) {
    console.log('⚠️ PROBLEMA: Nenhum método conseguiu acessar dados reais.');
    console.log('💡 SOLUÇÃO: Provavelmente o RLS está bloqueando o acesso.');
    console.log('   - Verifique se há políticas RLS configuradas');
    console.log('   - Considere fazer login com usuário válido');
    console.log('   - Ou temporariamente desabilite o RLS para testes');
  } else {
    console.log('🎉 SUCESSO: Pelo menos um método conseguiu acessar dados!');
    methodsWithData.forEach(method => {
      console.log(`   - ${method.method}: ${method.count} registros`);
    });
  }

  return results;
}

// Função para inserir dados de teste
async function insertTestData(userId = '123e4567-e89b-12d3-a456-426614174000') {
  console.log(`📝 Tentando inserir dados de teste para usuário: ${userId}`);
  
  try {
    // Gerar dados dos últimos 7 dias
    const testData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      testData.push({
        user_id: userId,
        date: date.toISOString().split('T')[0],
        messages_sent: Math.floor(Math.random() * 50) + 10,
        messages_received: Math.floor(Math.random() * 40) + 8,
        active_sessions: Math.floor(Math.random() * 5) + 1,
        new_contacts: Math.floor(Math.random() * 3)
      });
    }

    // Primeiro tentar limpar dados antigos
    console.log('🗑️ Limpando dados antigos...');
    const { error: deleteError } = await window.supabase
      .from('usage_stats')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.log('⚠️ Aviso ao limpar dados:', deleteError.message);
    }

    // Inserir novos dados
    console.log('➕ Inserindo novos dados...');
    const { data: insertedData, error: insertError } = await window.supabase
      .from('usage_stats')
      .insert(testData)
      .select();

    if (insertError) {
      console.error('❌ Erro na inserção:', insertError.message);
      return { success: false, error: insertError.message };
    } else {
      console.log('✅ Dados inseridos com sucesso!', insertedData);
      return { success: true, data: insertedData };
    }

  } catch (err) {
    console.error('❌ Erro geral na inserção:', err);
    return { success: false, error: err.message };
  }
}

// Executar testes automaticamente
console.log('🚀 Executando testes RLS...');
testAllRLSMethods().then(() => {
  console.log('✅ Testes concluídos! Use insertTestData() para inserir dados de teste.');
});

// Disponibilizar funções globalmente para uso manual
window.testRLS = testAllRLSMethods;
window.insertTestData = insertTestData;
