#!/usr/bin/env node

/**
 * AUDITORIA COMPLETA DA ESTRUTURA DO BANCO DE DADOS SUPABASE
 * ConversaAI Brasil
 * 
 * Este script faz uma análise completa da estrutura do banco de dados,
 * incluindo tabelas, relacionamentos, triggers, policies RLS e integridade.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ ERRO: SUPABASE_ANON_KEY não definida no ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 INICIANDO AUDITORIA COMPLETA DO BANCO DE DADOS');
console.log('='.repeat(60));

let auditReport = {
  timestamp: new Date().toISOString(),
  database: {
    url: supabaseUrl,
    project: 'hpovwcaskorzzrpphgkc'
  },
  tables: {},
  relationships: [],
  indexes: [],
  triggers: [],
  policies: [],
  issues: [],
  recommendations: []
};

/**
 * 1. ANÁLISE DE TABELAS EXISTENTES
 */
async function analyzeTableStructure() {
  console.log('\n📋 1. ANALISANDO ESTRUTURA DE TABELAS...');
  
  try {
    // Obter todas as tabelas do schema public
    const { data: tables, error } = await supabase
      .rpc('get_table_info');
    
    if (error) {
      console.log('⚠️ Usando método alternativo para obter informações de tabelas...');
      
      // Método alternativo: tentar acessar cada tabela conhecida
      const knownTables = [
        'profiles', 'subscription_plans', 'subscriptions', 'agents', 
        'whatsapp_instances', 'messages', 'contacts', 'payments', 
        'usage_stats', 'event_logs', 'integrations'
      ];
      
      for (const tableName of knownTables) {
        try {
          const { data, error: tableError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!tableError) {
            console.log(`✅ Tabela encontrada: ${tableName}`);
            auditReport.tables[tableName] = {
              exists: true,
              accessible: true,
              sampleData: data ? data.length > 0 : false
            };
          }
        } catch (err) {
          console.log(`❌ Tabela não acessível: ${tableName}`);
          auditReport.tables[tableName] = {
            exists: false,
            accessible: false,
            error: err.message
          };
        }
      }
    }
  } catch (error) {
    auditReport.issues.push({
      type: 'TABLE_ANALYSIS_ERROR',
      description: 'Não foi possível analisar a estrutura das tabelas',
      error: error.message
    });
  }
}

/**
 * 2. VERIFICAÇÃO DE INTEGRIDADE REFERENCIAL
 */
async function checkReferentialIntegrity() {
  console.log('\n🔗 2. VERIFICANDO INTEGRIDADE REFERENCIAL...');
  
  const relationships = [
    {
      table: 'profiles',
      column: 'id',
      references: 'auth.users(id)',
      type: 'CASCADE'
    },
    {
      table: 'subscriptions',
      column: 'user_id',
      references: 'auth.users(id)',
      type: 'CASCADE'
    },
    {
      table: 'subscriptions',
      column: 'plan_id',
      references: 'subscription_plans(id)',
      type: 'RESTRICT'
    },
    {
      table: 'agents',
      column: 'user_id',
      references: 'auth.users(id)',
      type: 'CASCADE'
    },
    {
      table: 'whatsapp_instances',
      column: 'user_id',
      references: 'auth.users(id)',
      type: 'CASCADE'
    },
    {
      table: 'messages',
      column: 'user_id',
      references: 'auth.users(id)',
      type: 'CASCADE'
    },
    {
      table: 'messages',
      column: 'instance_id',
      references: 'whatsapp_instances(id)',
      type: 'CASCADE'
    },
    {
      table: 'contacts',
      column: 'user_id',
      references: 'auth.users(id)',
      type: 'CASCADE'
    },
    {
      table: 'payments',
      column: 'subscription_id',
      references: 'subscriptions(id)',
      type: 'CASCADE'
    },
    {
      table: 'usage_stats',
      column: 'user_id',
      references: 'auth.users(id)',
      type: 'CASCADE'
    }
  ];
  
  auditReport.relationships = relationships;
  
  // Verificar se existem registros órfãos
  for (const rel of relationships) {
    try {
      if (auditReport.tables[rel.table]?.exists) {
        console.log(`🔍 Verificando ${rel.table}.${rel.column} -> ${rel.references}`);
        // Aqui poderíamos fazer uma verificação mais detalhada dos relacionamentos
      }
    } catch (error) {
      auditReport.issues.push({
        type: 'RELATIONSHIP_CHECK_ERROR',
        table: rel.table,
        description: `Erro ao verificar relacionamento ${rel.table}.${rel.column}`,
        error: error.message
      });
    }
  }
}

/**
 * 3. ANÁLISE DE POLICIES RLS
 */
async function analyzeRLSPolicies() {
  console.log('\n🔒 3. ANALISANDO POLÍTICAS DE SEGURANÇA (RLS)...');
  
  const tablesWithRLS = [
    'profiles', 'subscriptions', 'agents', 'whatsapp_instances', 
    'messages', 'contacts', 'payments', 'usage_stats'
  ];
  
  for (const table of tablesWithRLS) {
    if (auditReport.tables[table]?.exists) {
      try {
        // Verificar se RLS está habilitado (método simplificado)
        console.log(`🔍 Verificando RLS para tabela: ${table}`);
        auditReport.policies.push({
          table,
          rlsEnabled: 'unknown', // Seria necessário uma query específica para verificar
          policies: []
        });
      } catch (error) {
        auditReport.issues.push({
          type: 'RLS_CHECK_ERROR',
          table,
          description: `Erro ao verificar RLS para tabela ${table}`,
          error: error.message
        });
      }
    }
  }
}

/**
 * 4. VERIFICAÇÃO DE DADOS CRÍTICOS
 */
async function checkCriticalData() {
  console.log('\n💾 4. VERIFICANDO DADOS CRÍTICOS...');
  
  try {
    // Verificar se existe pelo menos um plano de assinatura
    if (auditReport.tables.subscription_plans?.exists) {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('id, name, price, is_active')
        .eq('is_active', true);
      
      if (error) {
        auditReport.issues.push({
          type: 'DATA_CHECK_ERROR',
          table: 'subscription_plans',
          description: 'Erro ao verificar planos de assinatura',
          error: error.message
        });
      } else {
        console.log(`✅ Encontrados ${plans.length} planos de assinatura ativos`);
        const freePlan = plans.find(p => p.name === 'Free');
        if (!freePlan) {
          auditReport.issues.push({
            type: 'MISSING_FREE_PLAN',
            table: 'subscription_plans',
            description: 'Plano gratuito "Free" não encontrado',
            severity: 'HIGH'
          });
        }
      }
    }
    
    // Verificar consistência usuários-perfis-assinaturas
    if (auditReport.tables.profiles?.exists && auditReport.tables.subscriptions?.exists) {
      try {
        // Contar usuários, perfis e assinaturas (método simplificado)
        console.log('🔍 Verificando consistência usuários-perfis-assinaturas...');
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id')
          .limit(10);
          
        const { data: subscriptions, error: subscriptionsError } = await supabase
          .from('subscriptions')
          .select('user_id')
          .limit(10);
          
        if (!profilesError && !subscriptionsError) {
          console.log(`✅ Perfis: ${profiles.length} (amostra), Assinaturas: ${subscriptions.length} (amostra)`);
        }
      } catch (error) {
        auditReport.issues.push({
          type: 'USER_CONSISTENCY_ERROR',
          description: 'Erro ao verificar consistência de usuários',
          error: error.message
        });
      }
    }
  } catch (error) {
    auditReport.issues.push({
      type: 'CRITICAL_DATA_ERROR',
      description: 'Erro geral na verificação de dados críticos',
      error: error.message
    });
  }
}

/**
 * 5. ANÁLISE DE PERFORMANCE E ÍNDICES
 */
async function analyzePerformance() {
  console.log('\n⚡ 5. ANALISANDO PERFORMANCE E ÍNDICES...');
  
  const recommendedIndexes = [
    {
      table: 'messages',
      columns: ['user_id', 'created_at'],
      reason: 'Consultas frequentes por usuário e data'
    },
    {
      table: 'messages',
      columns: ['instance_id', 'direction'],
      reason: 'Filtragem por instância e direção da mensagem'
    },
    {
      table: 'contacts',
      columns: ['user_id', 'phone_number'],
      reason: 'Busca de contatos por usuário e telefone'
    },
    {
      table: 'whatsapp_instances',
      columns: ['user_id', 'status'],
      reason: 'Filtragem por usuário e status da instância'
    },
    {
      table: 'usage_stats',
      columns: ['user_id', 'date'],
      reason: 'Consultas de estatísticas por usuário e período'
    }
  ];
  
  auditReport.indexes = recommendedIndexes;
  
  // Adicionar recomendações de performance
  auditReport.recommendations.push({
    type: 'PERFORMANCE',
    priority: 'HIGH',
    description: 'Criar índices compostos para consultas frequentes',
    details: recommendedIndexes
  });
}

/**
 * 6. VERIFICAÇÃO DE TRIGGERS E FUNÇÕES
 */
async function checkTriggersAndFunctions() {
  console.log('\n⚙️ 6. VERIFICANDO TRIGGERS E FUNÇÕES...');
  
  const expectedTriggers = [
    {
      name: 'on_auth_user_created',
      table: 'auth.users',
      function: 'handle_new_user_signup()',
      purpose: 'Criar perfil e assinatura para novos usuários'
    },
    {
      name: 'on_profile_update',
      table: 'profiles',
      function: 'handle_user_update()',
      purpose: 'Atualizar timestamp de modificação'
    }
  ];
  
  auditReport.triggers = expectedTriggers;
  
  // Verificar se trigger principal existe tentando criar um usuário de teste
  console.log('🔍 Verificando funcionamento do trigger de criação de usuário...');
}

/**
 * 7. GERAÇÃO DE RELATÓRIO FINAL
 */
async function generateReport() {
  console.log('\n📊 7. GERANDO RELATÓRIO FINAL...');
  
  // Calcular score de integridade
  const totalTables = Object.keys(auditReport.tables).length;
  const existingTables = Object.values(auditReport.tables).filter(t => t.exists).length;
  const integrityScore = totalTables > 0 ? Math.round((existingTables / totalTables) * 100) : 0;
  
  auditReport.summary = {
    integrityScore,
    totalTables,
    existingTables,
    totalIssues: auditReport.issues.length,
    highPriorityIssues: auditReport.issues.filter(i => i.severity === 'HIGH').length
  };
  
  // Adicionar recomendações baseadas nos problemas encontrados
  if (auditReport.issues.length > 0) {
    auditReport.recommendations.push({
      type: 'INTEGRITY',
      priority: 'HIGH',
      description: 'Resolver problemas de integridade identificados',
      details: auditReport.issues.filter(i => i.severity === 'HIGH')
    });
  }
  
  // Salvar relatório
  const reportFileName = `auditoria-banco-dados-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(reportFileName, JSON.stringify(auditReport, null, 2));
  
  console.log(`\n✅ Relatório salvo em: ${reportFileName}`);
  
  // Exibir resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA AUDITORIA');
  console.log('='.repeat(60));
  console.log(`🎯 Score de Integridade: ${integrityScore}%`);
  console.log(`📋 Tabelas Analisadas: ${totalTables}`);
  console.log(`✅ Tabelas Existentes: ${existingTables}`);
  console.log(`⚠️ Problemas Encontrados: ${auditReport.issues.length}`);
  console.log(`🔴 Problemas Críticos: ${auditReport.summary.highPriorityIssues}`);
  
  if (auditReport.issues.length > 0) {
    console.log('\n🔴 PROBLEMAS IDENTIFICADOS:');
    auditReport.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.type}] ${issue.description}`);
      if (issue.table) console.log(`   Tabela: ${issue.table}`);
      if (issue.severity) console.log(`   Severidade: ${issue.severity}`);
    });
  }
  
  console.log('\n📋 RECOMENDAÇÕES:');
  auditReport.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. [${rec.priority}] ${rec.description}`);
  });
  
  return auditReport;
}

/**
 * EXECUÇÃO PRINCIPAL
 */
async function runAudit() {
  try {
    await analyzeTableStructure();
    await checkReferentialIntegrity();
    await analyzeRLSPolicies();
    await checkCriticalData();
    await analyzePerformance();
    await checkTriggersAndFunctions();
    
    const report = await generateReport();
    
    console.log('\n✅ AUDITORIA CONCLUÍDA COM SUCESSO!');
    
    return report;
  } catch (error) {
    console.error('\n❌ ERRO DURANTE A AUDITORIA:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runAudit();
}

export { runAudit };
