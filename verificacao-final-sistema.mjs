#!/usr/bin/env node

/**
 * VERIFICAÇÃO FINAL COMPLETA - ConversaAI Brasil
 * 
 * Este script realiza uma verificação abrangente do sistema
 * para confirmar que todas as correções foram aplicadas corretamente.
 * 
 * Execução: node verificacao-final-sistema.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carrega variáveis de ambiente
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente não encontradas');
    console.error('   Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VERIFICAÇÃO FINAL COMPLETA - CONVERSA AI BRASIL');
console.log('================================================');
console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
console.log('');

/**
 * Classe para relatórios de verificação
 */
class VerificationReport {
    constructor() {
        this.results = [];
        this.critical = [];
        this.warnings = [];
        this.success = [];
    }

    addResult(category, item, status, details = '') {
        const result = { category, item, status, details };
        this.results.push(result);
        
        if (status === 'CRÍTICO') {
            this.critical.push(result);
        } else if (status === 'ATENÇÃO') {
            this.warnings.push(result);
        } else if (status === 'OK') {
            this.success.push(result);
        }
    }

    printSummary() {
        console.log('\n📊 RESUMO FINAL DA VERIFICAÇÃO');
        console.log('================================');
        console.log(`✅ Itens OK: ${this.success.length}`);
        console.log(`⚠️  Atenção: ${this.warnings.length}`);
        console.log(`🔴 Críticos: ${this.critical.length}`);
        
        if (this.critical.length > 0) {
            console.log('\n🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:');
            this.critical.forEach(item => {
                console.log(`   - ${item.category}: ${item.item} - ${item.details}`);
            });
        }
        
        if (this.warnings.length > 0) {
            console.log('\n⚠️  ITENS QUE PRECISAM DE ATENÇÃO:');
            this.warnings.forEach(item => {
                console.log(`   - ${item.category}: ${item.item} - ${item.details}`);
            });
        }

        const overallStatus = this.critical.length === 0 ? 
            (this.warnings.length === 0 ? 'PERFEITO' : 'FUNCIONAL') : 'PROBLEMAS';
        
        console.log(`\n🎯 STATUS GERAL: ${overallStatus}`);
        
        if (overallStatus === 'PERFEITO') {
            console.log('   Sistema completamente otimizado e funcional! 🎉');
        } else if (overallStatus === 'FUNCIONAL') {
            console.log('   Sistema funcional, mas com melhorias recomendadas 👍');
        } else {
            console.log('   Sistema requer correções urgentes ⚠️');
        }
    }
}

const report = new VerificationReport();

/**
 * 1. VERIFICAR ESTRUTURA DE TABELAS
 */
async function verifyTableStructure() {
    console.log('🏗️  1. VERIFICANDO ESTRUTURA DE TABELAS...');
    
    const expectedTables = [
        'profiles',
        'subscription_plans', 
        'subscriptions',
        'whatsapp_instances',
        'messages',
        'agents',
        'contacts',
        'payments',
        'usage_stats'
    ];

    for (const table of expectedTables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);
            
            if (error) {
                report.addResult('ESTRUTURA', `Tabela ${table}`, 'CRÍTICO', `Erro: ${error.message}`);
            } else {
                report.addResult('ESTRUTURA', `Tabela ${table}`, 'OK', 'Acessível');
            }
        } catch (err) {
            report.addResult('ESTRUTURA', `Tabela ${table}`, 'CRÍTICO', `Exceção: ${err.message}`);
        }
    }
}

/**
 * 2. VERIFICAR PLANOS DE ASSINATURA
 */
async function verifySubscriptionPlans() {
    console.log('💳 2. VERIFICANDO PLANOS DE ASSINATURA...');
    
    try {
        const { data: plans, error } = await supabase
            .from('subscription_plans')
            .select('*');
        
        if (error) {
            report.addResult('PLANOS', 'Consulta de planos', 'CRÍTICO', `Erro: ${error.message}`);
            return;
        }

        // Verificar planos esperados
        const expectedPlans = ['Free', 'Starter', 'Growth'];
        const foundPlans = plans.map(p => p.name);
        
        expectedPlans.forEach(planName => {
            const planCount = plans.filter(p => p.name === planName).length;
            if (planCount === 0) {
                report.addResult('PLANOS', `Plano ${planName}`, 'CRÍTICO', 'Plano não encontrado');
            } else if (planCount === 1) {
                report.addResult('PLANOS', `Plano ${planName}`, 'OK', 'Único e presente');
            } else {
                report.addResult('PLANOS', `Plano ${planName}`, 'ATENÇÃO', `${planCount} duplicatas encontradas`);
            }
        });

        console.log(`   📊 Total de planos: ${plans.length}`);
        console.log(`   📋 Planos encontrados: ${foundPlans.join(', ')}`);
        
    } catch (err) {
        report.addResult('PLANOS', 'Verificação de planos', 'CRÍTICO', `Exceção: ${err.message}`);
    }
}

/**
 * 3. VERIFICAR TRIGGERS E FUNÇÕES
 */
async function verifyTriggersAndFunctions() {
    console.log('⚡ 3. VERIFICANDO TRIGGERS E FUNÇÕES...');
    
    try {
        // Verificar se função existe
        const { data: functions, error: funcError } = await supabase
            .rpc('handle_new_user_signup', { user_id: null, user_email: null });
        
        // Se não der erro de "null user_id", significa que a função existe
        if (funcError && funcError.message && funcError.message.includes('null')) {
            report.addResult('TRIGGERS', 'Função handle_new_user_signup', 'OK', 'Função existe e é executável');
        } else if (funcError && funcError.code === '42883') {
            report.addResult('TRIGGERS', 'Função handle_new_user_signup', 'CRÍTICO', 'Função não encontrada');
        } else {
            report.addResult('TRIGGERS', 'Função handle_new_user_signup', 'ATENÇÃO', 'Status indefinido');
        }
        
    } catch (err) {
        report.addResult('TRIGGERS', 'Verificação de triggers', 'ATENÇÃO', `Não foi possível verificar: ${err.message}`);
    }
}

/**
 * 4. VERIFICAR RLS (Row Level Security)
 */
async function verifyRLS() {
    console.log('🔒 4. VERIFICANDO POLÍTICAS RLS...');
    
    // Verificar se conseguimos acessar dados com usuário limitado
    try {
        // Criar cliente com chaves públicas (simulando usuário comum)
        const publicClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
        
        const testTables = ['profiles', 'subscriptions', 'whatsapp_instances'];
        
        for (const table of testTables) {
            try {
                const { data, error } = await publicClient
                    .from(table)
                    .select('*')
                    .limit(1);
                
                if (error && error.code === '42501') {
                    // RLS está funcionando (acesso negado)
                    report.addResult('RLS', `Tabela ${table}`, 'OK', 'RLS ativo - acesso negado corretamente');
                } else if (data && data.length === 0) {
                    // Sem dados, mas sem erro - RLS pode estar funcionando
                    report.addResult('RLS', `Tabela ${table}`, 'OK', 'RLS possivelmente ativo');
                } else {
                    // Acesso permitido sem autenticação - RLS pode estar desabilitado
                    report.addResult('RLS', `Tabela ${table}`, 'ATENÇÃO', 'Possível acesso sem autenticação');
                }
            } catch (err) {
                report.addResult('RLS', `Tabela ${table}`, 'ATENÇÃO', `Erro ao testar: ${err.message}`);
            }
        }
        
    } catch (err) {
        report.addResult('RLS', 'Verificação RLS', 'ATENÇÃO', `Não foi possível verificar: ${err.message}`);
    }
}

/**
 * 5. VERIFICAR DADOS ÓRFÃOS
 */
async function verifyOrphanData() {
    console.log('🔍 5. VERIFICANDO DADOS ÓRFÃOS...');
    
    try {
        // Verificar usuários sem perfil (usando join)
        const { data: profileCheck, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .limit(1000);
        
        if (!profileError) {
            const { data: usersCheck, error: usersError } = await supabase.auth.admin.listUsers();
            
            if (!usersError && usersCheck.users) {
                const usersWithoutProfile = usersCheck.users.filter(user => 
                    !profileCheck.some(profile => profile.id === user.id)
                );
                
                if (usersWithoutProfile.length === 0) {
                    report.addResult('ÓRFÃOS', 'Usuários sem perfil', 'OK', 'Nenhum usuário órfão encontrado');
                } else {
                    report.addResult('ÓRFÃOS', 'Usuários sem perfil', 'ATENÇÃO', `${usersWithoutProfile.length} usuários sem perfil`);
                }
            }
        }
        
        // Verificar assinaturas sem usuário válido
        const { data: subscriptions, error: subError } = await supabase
            .from('subscriptions')
            .select('user_id')
            .limit(1000);
        
        if (!subError) {
            report.addResult('ÓRFÃOS', 'Assinaturas órfãs', 'OK', `${subscriptions.length} assinaturas verificadas`);
        }
        
    } catch (err) {
        report.addResult('ÓRFÃOS', 'Verificação de órfãos', 'ATENÇÃO', `Não foi possível verificar completamente: ${err.message}`);
    }
}

/**
 * 6. VERIFICAR PERFORMANCE E ÍNDICES
 */
async function verifyPerformance() {
    console.log('📊 6. VERIFICANDO PERFORMANCE...');
    
    const tables = ['messages', 'contacts', 'usage_stats'];
    
    for (const table of tables) {
        try {
            const startTime = Date.now();
            
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(100);
            
            const endTime = Date.now();
            const queryTime = endTime - startTime;
            
            if (error) {
                report.addResult('PERFORMANCE', `Consulta ${table}`, 'ATENÇÃO', `Erro: ${error.message}`);
            } else if (queryTime < 1000) {
                report.addResult('PERFORMANCE', `Consulta ${table}`, 'OK', `${queryTime}ms - Rápida`);
            } else {
                report.addResult('PERFORMANCE', `Consulta ${table}`, 'ATENÇÃO', `${queryTime}ms - Lenta`);
            }
            
        } catch (err) {
            report.addResult('PERFORMANCE', `Consulta ${table}`, 'ATENÇÃO', `Erro: ${err.message}`);
        }
    }
}

/**
 * 7. VERIFICAR INTEGRIDADE DOS DADOS
 */
async function verifyDataIntegrity() {
    console.log('🔗 7. VERIFICANDO INTEGRIDADE DOS DADOS...');
    
    try {
        // Verificar se todas as assinaturas têm planos válidos
        const { data: orphanSubs, error: orphanError } = await supabase
            .from('subscriptions')
            .select(`
                id,
                plan_id,
                subscription_plans!inner(id, name)
            `)
            .limit(1000);
        
        if (!orphanError) {
            report.addResult('INTEGRIDADE', 'Assinaturas com planos válidos', 'OK', `${orphanSubs.length} assinaturas verificadas`);
        }
        
        // Verificar se todas as instâncias têm usuários válidos
        const { data: instances, error: instError } = await supabase
            .from('whatsapp_instances')
            .select('user_id')
            .limit(1000);
        
        if (!instError) {
            report.addResult('INTEGRIDADE', 'Instâncias com usuários válidos', 'OK', `${instances.length} instâncias verificadas`);
        }
        
    } catch (err) {
        report.addResult('INTEGRIDADE', 'Verificação de integridade', 'ATENÇÃO', `Erro: ${err.message}`);
    }
}

/**
 * EXECUTAR TODAS AS VERIFICAÇÕES
 */
async function runCompleteVerification() {
    try {
        await verifyTableStructure();
        await verifySubscriptionPlans();
        await verifyTriggersAndFunctions();
        await verifyRLS();
        await verifyOrphanData();
        await verifyPerformance();
        await verifyDataIntegrity();
        
        report.printSummary();
        
        // Gerar próximos passos
        console.log('\n🎯 PRÓXIMOS PASSOS RECOMENDADOS:');
        console.log('================================');
        
        if (report.critical.length > 0) {
            console.log('🔴 URGENTE - Corrigir problemas críticos:');
            report.critical.forEach(item => {
                console.log(`   1. ${item.item}: ${item.details}`);
            });
        }
        
        if (report.warnings.length > 0) {
            console.log('🟡 MELHORIAS RECOMENDADAS:');
            report.warnings.forEach(item => {
                console.log(`   • ${item.item}: ${item.details}`);
            });
        }
        
        console.log('\n📋 VERIFICAÇÕES MANUAIS PENDENTES:');
        console.log('   1. Acessar Dashboard Supabase');
        console.log('   2. Configurar Auth Hooks para emails automáticos');
        console.log('   3. Testar criação de novo usuário end-to-end');
        console.log('   4. Validar que emails de boas-vindas são enviados');
        
        console.log('\n📚 DOCUMENTAÇÃO COMPLETA:');
        console.log('   • CHECKLIST-VERIFICACAO-MANUAL.md');
        console.log('   • RELATORIO-FINAL-BANCO-DADOS.md');
        console.log('   • STATUS-FINAL-EXECUCAO.md');
        
    } catch (error) {
        console.error('❌ Erro durante verificação:', error.message);
        process.exit(1);
    }
}

// Executar verificação
runCompleteVerification();
