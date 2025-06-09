// Script para diagnosticar e corrigir políticas RLS da tabela whatsapp_instances
// Execute: node check-rls-policies.js

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMjkwMzMsImV4cCI6MjA1OTkwNTAzM30.lJc1pNLIDaJu0P0xYm8ddlO0PbKH8NNl9Vkc4kHQR2I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkRLSPolicies() {
  console.log('🔍 Verificando políticas RLS da tabela whatsapp_instances...\n');
  
  try {
    // Primeiro, tentar a consulta problemática para reproduzir o erro
    console.log('📊 1. Testando consulta problemática...');
    const testUserId = 'e8e521f6-7011-418c-a0b4-7ca696e56030';
    
    const { data: problematicQuery, error: problematicError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', testUserId)
      .eq('status', 'connected');
    
    if (problematicError) {
      console.log(`❌ ERRO 406 REPRODUZIDO:`);
      console.log(`   Mensagem: ${problematicError.message}`);
      console.log(`   Código: ${problematicError.code}`);
      console.log(`   Detalhes: ${problematicError.details || 'N/A'}`);
      console.log(`   Hint: ${problematicError.hint || 'N/A'}\n`);
    } else {
      console.log(`✅ Consulta funcionou! Retornou ${problematicQuery?.length || 0} registros\n`);
    }
    
    // Testar consultas separadas
    console.log('📊 2. Testando consultas separadas...');
    
    // Apenas user_id
    const { data: userOnlyData, error: userOnlyError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', testUserId);
    
    if (userOnlyError) {
      console.log(`❌ Erro com filtro user_id: ${userOnlyError.message}`);
    } else {
      console.log(`✅ Filtro user_id: ${userOnlyData?.length || 0} registros`);
    }
    
    // Apenas status
    const { data: statusOnlyData, error: statusOnlyError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('status', 'connected');
    
    if (statusOnlyError) {
      console.log(`❌ Erro com filtro status: ${statusOnlyError.message}`);
    } else {
      console.log(`✅ Filtro status: ${statusOnlyData?.length || 0} registros`);
    }
    
    // Sem filtros
    const { data: noFilterData, error: noFilterError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(5);
    
    if (noFilterError) {
      console.log(`❌ Erro sem filtros: ${noFilterError.message}`);
    } else {
      console.log(`✅ Sem filtros: ${noFilterData?.length || 0} registros`);
    }
    
    console.log('\n📊 3. Verificando estrutura da tabela...');
    
    // Verificar se a tabela existe e sua estrutura
    const { data: tableData, error: tableError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log(`❌ Erro acessando tabela: ${tableError.message}`);
    } else {
      console.log(`✅ Tabela acessível`);
      if (tableData && tableData.length > 0) {
        console.log(`📝 Campos disponíveis: ${Object.keys(tableData[0]).join(', ')}`);
      }
    }
    
    console.log('\n🔒 4. Diagnosticando políticas RLS...');
    
    // Verificar se RLS está habilitado (através de erro específico)
    try {
      const { error: rlsTestError } = await supabase.rpc('check_table_rls', {
        table_name: 'whatsapp_instances'
      });
      
      if (rlsTestError) {
        console.log(`📋 RPC não disponível: ${rlsTestError.message}`);
      }
    } catch (error) {
      console.log(`📋 Não foi possível verificar RLS via RPC`);
    }
    
    console.log('\n💡 5. Possíveis soluções para o erro 406:');
    console.log('   1. Política RLS muito restritiva');
    console.log('   2. Combinação de filtros não permitida');
    console.log('   3. Campo status com tipo incompatível');
    console.log('   4. Índice em falta na tabela');
    console.log('   5. Configuração Accept header incorreta');
    
    console.log('\n🛠️ 6. Tentativas de correção...');
    
    // Tentar diferentes formatos de consulta
    console.log('📊 Testando consulta com .in()...');
    const { data: inData, error: inError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', testUserId)
      .in('status', ['connected']);
    
    if (inError) {
      console.log(`❌ Erro com .in(): ${inError.message}`);
    } else {
      console.log(`✅ Consulta .in() funcionou: ${inData?.length || 0} registros`);
    }
    
    // Tentar com .filter()
    console.log('📊 Testando consulta com .filter()...');
    const { data: filterData, error: filterError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .filter('user_id', 'eq', testUserId)
      .filter('status', 'eq', 'connected');
    
    if (filterError) {
      console.log(`❌ Erro com .filter(): ${filterError.message}`);
    } else {
      console.log(`✅ Consulta .filter() funcionou: ${filterData?.length || 0} registros`);
    }
    
    // Tentar com .match()
    console.log('📊 Testando consulta com .match()...');
    const { data: matchData, error: matchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .match({ user_id: testUserId, status: 'connected' });
    
    if (matchError) {
      console.log(`❌ Erro com .match(): ${matchError.message}`);
    } else {
      console.log(`✅ Consulta .match() funcionou: ${matchData?.length || 0} registros`);
    }
    
    console.log('\n🎯 RESUMO DO DIAGNÓSTICO:');
    if (problematicError) {
      console.log('❌ Problema confirmado: Erro 406 na consulta original');
      console.log('🔧 Recomendações:');
      console.log('   1. Verificar políticas RLS no Supabase Dashboard');
      console.log('   2. Verificar índices na tabela whatsapp_instances');
      console.log('   3. Usar consultas alternativas (.match() ou .filter())');
      console.log('   4. Verificar tipos de dados dos campos');
    } else {
      console.log('✅ Consulta funcionou! O problema pode ter sido resolvido.');
    }
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error.message);
  }
}

// Executar diagnóstico
if (require.main === module) {
  checkRLSPolicies().catch(console.error);
}

module.exports = { checkRLSPolicies };
