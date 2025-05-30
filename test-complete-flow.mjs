#!/usr/bin/env node

// ===================================
// CONVERSA AI BRASIL - TESTE COMPLETO END-TO-END
// Arquivo: test-complete-flow.mjs
// Data: 2025-01-25
// ===================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hpovwcaskorzrpphgkc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY1NTk0Mjk1NiwiZXhwIjoxOTcxNTE4OTU2fQ.VIaKFTkMmwUIQa21HlvSrO1FhpuEP-OHiDGnJ9VrMGg';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTU5NDI5NTYsImV4cCI6MTk3MTUxODk1Nn0.CqtbnT5KwQsCoRiurG-_T2cyOzHS8m7ktmyKmO5T4S8';

// Cliente service role para operações administrativas
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

// Cliente anônimo para simular usuário
const supabaseClient = createClient(SUPABASE_URL, ANON_KEY);

console.log('🧪 TESTE COMPLETO END-TO-END - CONVERSA AI BRASIL');
console.log('==================================================\n');

async function runCompleteTest() {
  const testResults = {
    database_structure: false,
    user_creation_flow: false,
    triggers_working: false,
    rls_policies: false,
    subscription_plans: false,
    performance_indexes: false,
    integrity_constraints: false
  };

  try {
    // ===================================
    // 1. TESTE DE ESTRUTURA DO BANCO
    // ===================================
    console.log('📋 1. VERIFICANDO ESTRUTURA DO BANCO DE DADOS...');
    
    const tables = [
      'profiles', 'subscription_plans', 'subscriptions', 
      'whatsapp_instances', 'messages', 'contacts', 
      'payments', 'usage_stats', 'agents'
    ];
    
    let tablesExist = 0;
    for (const table of tables) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1);
      
      if (!error) {
        tablesExist++;
        console.log(`   ✅ Tabela '${table}' existe e é acessível`);
      } else {
        console.log(`   ❌ Tabela '${table}' com problema: ${error.message}`);
      }
    }
    
    testResults.database_structure = tablesExist === tables.length;
    console.log(`   📊 Estrutura do banco: ${tablesExist}/${tables.length} tabelas OK\n`);

    // ===================================
    // 2. TESTE DE PLANOS DE ASSINATURA
    // ===================================
    console.log('💳 2. VERIFICANDO PLANOS DE ASSINATURA...');
    
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, name, price, message_limit')
      .order('price');
    
    if (!plansError && plans.length >= 3) {
      console.log('   ✅ Planos encontrados:');
      plans.forEach(plan => {
        console.log(`      - ${plan.name}: R$${(plan.price/100).toFixed(2)} (${plan.message_limit} msgs)`);
      });
      
      const freePlans = plans.filter(p => p.name === 'Free');
      if (freePlans.length === 1) {
        console.log('   ✅ Apenas 1 plano Free (sem duplicatas)');
        testResults.subscription_plans = true;
      } else {
        console.log(`   ⚠️  ${freePlans.length} planos Free encontrados (possível duplicata)`);
      }
    } else {
      console.log('   ❌ Problema com planos de assinatura');
    }
    console.log('');

    // ===================================
    // 3. TESTE DE USUÁRIOS EXISTENTES
    // ===================================
    console.log('👥 3. VERIFICANDO USUÁRIOS EXISTENTES...');
    
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, subscriptions(id, status, subscription_plans(name))')
      .limit(10);
    
    if (!profilesError) {
      console.log(`   ✅ ${profiles.length} perfis de usuário encontrados`);
      
      let usersWithSubscriptions = 0;
      profiles.forEach(profile => {
        if (profile.subscriptions && profile.subscriptions.length > 0) {
          usersWithSubscriptions++;
          const planName = profile.subscriptions[0].subscription_plans?.name || 'N/A';
          console.log(`      - ${profile.full_name || 'Sem nome'}: ${planName}`);
        }
      });
      
      if (usersWithSubscriptions === profiles.length) {
        console.log('   ✅ Todos os usuários têm assinaturas');
        testResults.triggers_working = true;
      } else {
        console.log(`   ⚠️  ${profiles.length - usersWithSubscriptions} usuários sem assinatura`);
      }
    } else {
      console.log('   ❌ Erro ao verificar perfis:', profilesError.message);
    }
    console.log('');

    // ===================================
    // 4. TESTE DE POLÍTICAS RLS
    // ===================================
    console.log('🔒 4. VERIFICANDO POLÍTICAS RLS...');
    
    // Tentar acessar dados como usuário não autenticado
    const { data: publicData, error: rlsError } = await supabaseClient
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (rlsError && rlsError.message.includes('permission denied')) {
      console.log('   ✅ RLS funcionando - dados protegidos para usuários não autenticados');
      testResults.rls_policies = true;
    } else if (!rlsError && publicData && publicData.length === 0) {
      console.log('   ✅ RLS funcionando - sem dados retornados para usuário não autenticado');
      testResults.rls_policies = true;
    } else {
      console.log('   ⚠️  RLS pode não estar funcionando corretamente');
    }
    console.log('');

    // ===================================
    // 5. TESTE DE TRIGGERS DE USUÁRIO
    // ===================================
    console.log('⚡ 5. VERIFICANDO TRIGGERS DE CRIAÇÃO DE USUÁRIO...');
    
    // Verificar se a função handle_new_user_signup existe
    const { data: triggerFunction, error: triggerError } = await supabaseAdmin
      .rpc('check_function_exists', { function_name: 'handle_new_user_signup' })
      .catch(() => ({ data: null, error: 'Function check failed' }));
    
    if (triggerFunction || !triggerError) {
      console.log('   ✅ Função handle_new_user_signup provavelmente existe');
    } else {
      console.log('   ⚠️  Não foi possível verificar a função trigger');
    }
    console.log('');

    // ===================================
    // 6. TESTE DE PERFORMANCE (ÍNDICES)
    // ===================================
    console.log('🚀 6. VERIFICANDO PERFORMANCE (CONSULTAS RÁPIDAS)...');
    
    const startTime = Date.now();
    
    // Consulta que deveria usar índices
    const { data: recentMessages, error: perfError } = await supabaseAdmin
      .from('messages')
      .select('id, created_at, phone_number')
      .order('created_at', { ascending: false })
      .limit(100);
    
    const queryTime = Date.now() - startTime;
    
    if (!perfError) {
      console.log(`   ✅ Consulta de mensagens executada em ${queryTime}ms`);
      if (queryTime < 1000) {
        console.log('   ✅ Performance boa (< 1s)');
        testResults.performance_indexes = true;
      } else {
        console.log('   ⚠️  Performance pode ser melhorada (> 1s)');
      }
    } else {
      console.log('   ❌ Erro na consulta de performance:', perfError.message);
    }
    console.log('');

    // ===================================
    // 7. TESTE DE INTEGRIDADE DE DADOS
    // ===================================
    console.log('🔍 7. VERIFICANDO INTEGRIDADE DE DADOS...');
    
    // Verificar assinaturas órfãs
    const { data: orphanedSubs, error: orphanError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, plan_id, subscription_plans(id)')
      .is('subscription_plans.id', null);
    
    if (!orphanError) {
      if (orphanedSubs.length === 0) {
        console.log('   ✅ Nenhuma assinatura órfã encontrada');
        testResults.integrity_constraints = true;
      } else {
        console.log(`   ⚠️  ${orphanedSubs.length} assinaturas órfãs encontradas`);
      }
    }
    console.log('');

    // ===================================
    // 8. RESUMO DOS TESTES
    // ===================================
    console.log('📊 RESUMO DOS TESTES:');
    console.log('=====================');
    
    const tests = [
      { name: 'Estrutura do Banco', status: testResults.database_structure },
      { name: 'Planos de Assinatura', status: testResults.subscription_plans },
      { name: 'Triggers de Usuário', status: testResults.triggers_working },
      { name: 'Políticas RLS', status: testResults.rls_policies },
      { name: 'Performance/Índices', status: testResults.performance_indexes },
      { name: 'Integridade de Dados', status: testResults.integrity_constraints }
    ];
    
    let passedTests = 0;
    tests.forEach(test => {
      const icon = test.status ? '✅' : '❌';
      console.log(`   ${icon} ${test.name}`);
      if (test.status) passedTests++;
    });
    
    console.log('');
    console.log(`🎯 RESULTADO FINAL: ${passedTests}/${tests.length} testes passaram`);
    
    if (passedTests === tests.length) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Sistema pronto para produção.');
    } else if (passedTests >= tests.length * 0.8) {
      console.log('✅ Maioria dos testes passou. Sistema funcional com pequenos ajustes.');
    } else {
      console.log('⚠️  Vários testes falharam. Correções adicionais necessárias.');
    }
    
    console.log('');
    console.log('🔧 PRÓXIMOS PASSOS RECOMENDADOS:');
    if (!testResults.subscription_plans) {
      console.log('   1. Executar database-cleanup-complete.sql para remover duplicatas');
    }
    if (!testResults.rls_policies) {
      console.log('   2. Aplicar políticas RLS completas');
    }
    if (!testResults.triggers_working) {
      console.log('   3. Verificar e recriar triggers de usuário');
    }
    console.log('   4. Configurar Auth Hooks no dashboard Supabase');
    console.log('   5. Testar criação manual de usuário via interface');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

// Executar testes
runCompleteTest();
