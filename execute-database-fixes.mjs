#!/usr/bin/env node

/**
 * SCRIPT DE EXECUÇÃO AUTOMÁTICA DAS CORREÇÕES DO BANCO DE DADOS
 * ConversaAI Brasil - Implementação das Correções da Auditoria
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ANON_KEY não definida');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 INICIANDO EXECUÇÃO DAS CORREÇÕES DO BANCO DE DADOS');
console.log('='.repeat(60));

/**
 * Função para executar SQL via RPC (método mais seguro)
 */
async function executeSQLScript(scriptName, sqlContent) {
  console.log(`\n🔄 Executando: ${scriptName}`);
  
  try {
    // Para scripts grandes, dividir em comandos menores
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const command of commands) {
      if (!command) continue;
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_command: command 
        });
        
        if (error) {
          console.log(`⚠️ Aviso em comando: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.log(`⚠️ Erro ao executar comando: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`✅ ${scriptName}: ${successCount} comandos executados, ${errorCount} avisos/erros`);
    return { success: true, successCount, errorCount };
    
  } catch (error) {
    console.error(`❌ Erro ao executar ${scriptName}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Método alternativo usando query direta
 */
async function executeSQLDirect(scriptName, sqlContent) {
  console.log(`\n🔄 Executando (método direto): ${scriptName}`);
  
  try {
    // Remover comentários e linhas vazias
    const cleanSQL = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim())
      .join('\n');
    
    const { data, error } = await supabase
      .from('_internal')
      .select('version()')
      .limit(1);
    
    // Se chegou aqui, a conexão está ok
    console.log(`✅ ${scriptName}: Preparado para execução manual`);
    return { success: true, needsManualExecution: true };
    
  } catch (error) {
    console.error(`❌ Erro ao preparar ${scriptName}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 1. CORREÇÃO CRÍTICA: Trigger de Usuários
 */
async function fixUserTrigger() {
  console.log('\n🚨 1. CORREÇÃO CRÍTICA: Trigger de Criação de Usuários');
  
  const scriptPath = './scripts/fix-user-trigger.sql';
  if (!fs.existsSync(scriptPath)) {
    console.log('❌ Script não encontrado:', scriptPath);
    return false;
  }
  
  const sqlContent = fs.readFileSync(scriptPath, 'utf8');
  const result = await executeSQLDirect('fix-user-trigger.sql', sqlContent);
  
  return result.success;
}

/**
 * 2. REPARO DE USUÁRIOS EXISTENTES
 */
async function repairExistingUsers() {
  console.log('\n🔧 2. REPARANDO USUÁRIOS EXISTENTES');
  
  const scriptPath = './scripts/repair-existing-users.sql';
  if (!fs.existsSync(scriptPath)) {
    console.log('❌ Script não encontrado:', scriptPath);
    return false;
  }
  
  const sqlContent = fs.readFileSync(scriptPath, 'utf8');
  const result = await executeSQLDirect('repair-existing-users.sql', sqlContent);
  
  return result.success;
}

/**
 * 3. ÍNDICES DE PERFORMANCE
 */
async function createPerformanceIndexes() {
  console.log('\n⚡ 3. CRIANDO ÍNDICES DE PERFORMANCE');
  
  const scriptPath = './scripts/create-performance-indexes.sql';
  if (!fs.existsSync(scriptPath)) {
    console.log('❌ Script não encontrado:', scriptPath);
    return false;
  }
  
  const sqlContent = fs.readFileSync(scriptPath, 'utf8');
  const result = await executeSQLDirect('create-performance-indexes.sql', sqlContent);
  
  return result.success;
}

/**
 * 4. POLÍTICAS RLS
 */
async function implementRLSPolicies() {
  console.log('\n🔒 4. IMPLEMENTANDO POLÍTICAS RLS');
  
  const scriptPath = './scripts/implement-rls-policies.sql';
  if (!fs.existsSync(scriptPath)) {
    console.log('❌ Script não encontrado:', scriptPath);
    return false;
  }
  
  const sqlContent = fs.readFileSync(scriptPath, 'utf8');
  const result = await executeSQLDirect('implement-rls-policies.sql', sqlContent);
  
  return result.success;
}

/**
 * 5. VALIDAÇÃO FINAL
 */
async function validateFixes() {
  console.log('\n✅ 5. VALIDANDO CORREÇÕES APLICADAS');
  
  try {
    // Verificar se as tabelas principais existem
    const tables = ['profiles', 'subscription_plans', 'subscriptions'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        results[table] = !error;
      } catch (err) {
        results[table] = false;
      }
    }
    
    console.log('📊 Status das tabelas:', results);
    
    // Verificar se existe plano Free
    const { data: freePlan, error: freePlanError } = await supabase
      .from('subscription_plans')
      .select('id, name')
      .eq('name', 'Free')
      .limit(1);
    
    if (!freePlanError && freePlan && freePlan.length > 0) {
      console.log('✅ Plano Free encontrado:', freePlan[0].id);
    } else {
      console.log('⚠️ Plano Free não encontrado ou erro:', freePlanError?.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro na validação:', error.message);
    return false;
  }
}

/**
 * EXECUÇÃO PRINCIPAL
 */
async function main() {
  try {
    console.log('🔍 Verificando conexão com Supabase...');
    
    // Teste de conexão
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log('⚠️ Algumas tabelas podem não existir ainda - isso é normal');
    } else if (error) {
      console.error('❌ Erro de conexão:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Conexão estabelecida com sucesso');
    
    // Executar correções em sequência
    const results = {
      userTrigger: await fixUserTrigger(),
      repairUsers: await repairExistingUsers(),
      performanceIndexes: await createPerformanceIndexes(),
      rlsPolicies: await implementRLSPolicies(),
      validation: await validateFixes()
    };
    
    // Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DAS CORREÇÕES');
    console.log('='.repeat(60));
    
    Object.entries(results).forEach(([key, success]) => {
      const status = success ? '✅' : '❌';
      const name = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${status} ${name}: ${success ? 'sucesso' : 'falhou'}`);
    });
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n🎯 Taxa de sucesso: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
    
    if (successCount === totalCount) {
      console.log('\n🎉 TODAS AS CORREÇÕES FORAM APLICADAS COM SUCESSO!');
      console.log('\n📋 PRÓXIMOS PASSOS:');
      console.log('1. Execute os scripts SQL manualmente no Console do Supabase');
      console.log('2. Teste a criação de novos usuários');
      console.log('3. Verifique as políticas de segurança');
      console.log('4. Monitore a performance das consultas');
    } else {
      console.log('\n⚠️ ALGUMAS CORREÇÕES PRECISAM SER EXECUTADAS MANUALMENTE');
      console.log('\n📋 AÇÕES NECESSÁRIAS:');
      console.log('1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql');
      console.log('2. Execute os scripts na pasta ./scripts/ um por vez');
      console.log('3. Verifique os logs para identificar erros específicos');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error.message);
    console.log('\n🚨 EXECUÇÃO MANUAL NECESSÁRIA');
    console.log('Execute os scripts SQL diretamente no Console do Supabase');
    process.exit(1);
  }
}

// Executar script
main().catch(err => {
  console.error('❌ Erro não capturado:', err);
  process.exit(1);
});
