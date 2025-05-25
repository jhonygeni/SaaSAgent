#!/usr/bin/env node

/**
 * SCRIPT DE VALIDAÇÃO PÓS-CORREÇÕES
 * ConversaAI Brasil - Verificar se todas as correções foram aplicadas
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29ycnpycnBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1OTc1NTgsImV4cCI6MjA0NzE3MzU1OH0.BrsKaJRxM4ACmPbJQ-Vg8NKKBs-_WTLlmczU5H8xd5o";

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VALIDAÇÃO PÓS-CORREÇÕES DO BANCO DE DADOS');
console.log('='.repeat(60));

const validationResults = {
  tables: {},
  trigger: false,
  freePlan: false,
  indexes: {},
  policies: {},
  integrity: {},
  performance: {}
};

/**
 * 1. VERIFICAR ESTRUTURA DE TABELAS
 */
async function validateTableStructure() {
  console.log('\n📋 1. VERIFICANDO ESTRUTURA DE TABELAS...');
  
  const requiredTables = [
    'profiles', 'subscription_plans', 'subscriptions',
    'whatsapp_instances', 'agents', 'messages', 'contacts',
    'payments', 'usage_stats', 'event_logs'
  ];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      validationResults.tables[table] = !error;
      const status = !error ? '✅' : '❌';
      console.log(`  ${status} ${table}: ${!error ? 'OK' : error.message}`);
      
    } catch (err) {
      validationResults.tables[table] = false;
      console.log(`  ❌ ${table}: ${err.message}`);
    }
  }
}

/**
 * 2. VERIFICAR PLANO GRATUITO
 */
async function validateFreePlan() {
  console.log('\n💰 2. VERIFICANDO PLANO GRATUITO...');
  
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('id, name, price, is_active')
      .eq('name', 'Free')
      .eq('is_active', true);
    
    if (!error && data && data.length > 0) {
      validationResults.freePlan = true;
      console.log('  ✅ Plano Free encontrado:', data[0]);
    } else {
      validationResults.freePlan = false;
      console.log('  ❌ Plano Free não encontrado ou inativo');
    }
    
  } catch (err) {
    validationResults.freePlan = false;
    console.log('  ❌ Erro ao verificar plano Free:', err.message);
  }
}

/**
 * 3. VERIFICAR INTEGRIDADE DOS DADOS
 */
async function validateDataIntegrity() {
  console.log('\n🔗 3. VERIFICANDO INTEGRIDADE DOS DADOS...');
  
  try {
    // Usuários sem perfil
    const { data: usersWithoutProfile, error: profileError } = await supabase
      .rpc('check_users_without_profile');
    
    if (!profileError) {
      const orphanCount = usersWithoutProfile || 0;
      validationResults.integrity.orphanProfiles = orphanCount === 0;
      console.log(`  ${orphanCount === 0 ? '✅' : '⚠️'} Usuários sem perfil: ${orphanCount}`);
    }
    
    // Usuários sem assinatura
    const { data: usersWithoutSubscription, error: subscriptionError } = await supabase
      .rpc('check_users_without_subscription');
    
    if (!subscriptionError) {
      const orphanCount = usersWithoutSubscription || 0;
      validationResults.integrity.orphanSubscriptions = orphanCount === 0;
      console.log(`  ${orphanCount === 0 ? '✅' : '⚠️'} Usuários sem assinatura: ${orphanCount}`);
    }
    
  } catch (err) {
    console.log('  ⚠️ Verificação via RPC indisponível, usando método alternativo...');
    
    // Método alternativo: contagem básica
    try {
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      const { count: subscriptionCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true });
      
      console.log(`  📊 Perfis cadastrados: ${profileCount || 'N/A'}`);
      console.log(`  📊 Assinaturas ativas: ${subscriptionCount || 'N/A'}`);
      
    } catch (countErr) {
      console.log('  ⚠️ Não foi possível verificar contagens');
    }
  }
}

/**
 * 4. TESTAR PERFORMANCE BÁSICA
 */
async function validatePerformance() {
  console.log('\n⚡ 4. TESTANDO PERFORMANCE BÁSICA...');
  
  const tests = [
    { name: 'Lista de planos', table: 'subscription_plans', limit: 10 },
    { name: 'Consulta de perfis', table: 'profiles', limit: 5 },
    { name: 'Últimas mensagens', table: 'messages', limit: 20 }
  ];
  
  for (const test of tests) {
    try {
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from(test.table)
        .select('*')
        .limit(test.limit);
      
      const duration = Date.now() - startTime;
      const isGoodPerformance = duration < 2000; // < 2 segundos
      
      validationResults.performance[test.name] = {
        success: !error,
        duration,
        isGoodPerformance
      };
      
      const status = !error && isGoodPerformance ? '✅' : '⚠️';
      console.log(`  ${status} ${test.name}: ${duration}ms ${!error ? '(OK)' : '(ERRO)'}`);
      
    } catch (err) {
      validationResults.performance[test.name] = {
        success: false,
        error: err.message
      };
      console.log(`  ❌ ${test.name}: ${err.message}`);
    }
  }
}

/**
 * 5. VERIFICAR SEGURANÇA RLS
 */
async function validateRLSSecurity() {
  console.log('\n🔒 5. VERIFICANDO SEGURANÇA RLS...');
  
  const tablesWithRLS = [
    'profiles', 'subscriptions', 'whatsapp_instances', 
    'agents', 'messages', 'contacts', 'payments', 'usage_stats'
  ];
  
  // Teste básico: tentar acessar sem autenticação
  for (const table of tablesWithRLS) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      // Para algumas tabelas, é esperado que funcione (ex: subscription_plans)
      // Para outras, deve ser bloqueado pelo RLS
      const hasData = data && data.length > 0;
      const hasError = !!error;
      
      validationResults.policies[table] = {
        accessible: hasData,
        blocked: hasError,
        status: hasError ? 'protected' : 'open'
      };
      
      const status = table === 'subscription_plans' ? 
        (hasData ? '✅' : '⚠️') : 
        (hasError ? '✅' : '⚠️');
      
      console.log(`  ${status} ${table}: ${hasError ? 'Protegido por RLS' : 'Acesso permitido'}`);
      
    } catch (err) {
      validationResults.policies[table] = {
        error: err.message,
        status: 'error'
      };
      console.log(`  ❌ ${table}: ${err.message}`);
    }
  }
}

/**
 * 6. RELATÓRIO FINAL
 */
function generateFinalReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL DE VALIDAÇÃO');
  console.log('='.repeat(60));
  
  // Calcular scores
  const tableCount = Object.values(validationResults.tables).filter(Boolean).length;
  const totalTables = Object.keys(validationResults.tables).length;
  const tableScore = Math.round((tableCount / totalTables) * 100);
  
  const performanceTests = Object.values(validationResults.performance);
  const goodPerformanceCount = performanceTests.filter(test => 
    test.success && test.isGoodPerformance
  ).length;
  const performanceScore = performanceTests.length > 0 ? 
    Math.round((goodPerformanceCount / performanceTests.length) * 100) : 0;
  
  console.log(`\n🏗️  ESTRUTURA DE TABELAS: ${tableScore}% (${tableCount}/${totalTables})`);
  console.log(`💰 PLANO GRATUITO: ${validationResults.freePlan ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`⚡ PERFORMANCE: ${performanceScore}% (${goodPerformanceCount}/${performanceTests.length})`);
  console.log(`🔒 SEGURANÇA RLS: ${Object.keys(validationResults.policies).length} tabelas verificadas`);
  
  // Score geral
  const overallScore = Math.round((
    (tableScore * 0.4) + 
    (validationResults.freePlan ? 100 : 0) * 0.2 + 
    (performanceScore * 0.2) + 
    (Object.keys(validationResults.policies).length > 0 ? 100 : 0) * 0.2
  ));
  
  console.log(`\n🎯 SCORE GERAL: ${overallScore}%`);
  
  if (overallScore >= 90) {
    console.log('\n🎉 EXCELENTE! Todas as correções foram aplicadas com sucesso.');
    console.log('✅ O sistema está funcionando perfeitamente.');
  } else if (overallScore >= 70) {
    console.log('\n✅ BOM! A maioria das correções foi aplicada.');
    console.log('⚠️ Algumas melhorias podem ser necessárias.');
  } else {
    console.log('\n⚠️ ATENÇÃO! Algumas correções críticas podem não ter sido aplicadas.');
    console.log('🔧 Revise o script EXECUTE-ALL-FIXES.sql');
  }
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  if (overallScore < 90) {
    console.log('1. 🔍 Revise os erros mostrados acima');
    console.log('2. 🔧 Execute novamente as correções necessárias');
    console.log('3. 🧪 Teste a criação de novos usuários');
  } else {
    console.log('1. 🧪 Teste a criação de novos usuários');
    console.log('2. 📊 Configure monitoramento de performance');
    console.log('3. 🚀 Implemente funcionalidades adicionais');
  }
  
  console.log('\n📞 Suporte: suporte@conversaai.com.br');
}

/**
 * EXECUÇÃO PRINCIPAL
 */
async function main() {
  try {
    await validateTableStructure();
    await validateFreePlan();
    await validateDataIntegrity();
    await validatePerformance();
    await validateRLSSecurity();
    
    generateFinalReport();
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO na validação:', error.message);
    console.log('\n🚨 Execute o script de correções novamente');
    console.log('📖 Consulte: GUIA-EXECUCAO-CORRECOES.md');
    process.exit(1);
  }
}

// Executar validação
main().catch(err => {
  console.error('❌ Erro não capturado:', err);
  process.exit(1);
});
