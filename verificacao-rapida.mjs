#!/usr/bin/env node

/**
 * VERIFICAÇÃO RÁPIDA DE STATUS - ConversaAI Brasil
 * Versão simplificada para diagnóstico rápido
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VERIFICAÇÃO RÁPIDA DE STATUS');
console.log('===============================');
console.log(`📅 ${new Date().toLocaleString('pt-BR')}\n`);

async function quickCheck() {
    const results = [];
    
    // 1. Verificar se consegue conectar
    console.log('🔌 Testando conectividade...');
    try {
        const { data, error } = await supabase.from('subscription_plans').select('count').limit(1);
        if (error) {
            results.push('❌ Conexão: Erro ao conectar com Supabase');
        } else {
            results.push('✅ Conexão: Supabase acessível');
        }
    } catch (err) {
        results.push(`❌ Conexão: ${err.message}`);
    }

    // 2. Verificar planos
    console.log('💳 Verificando planos...');
    try {
        const { data: plans, error } = await supabase.from('subscription_plans').select('name');
        if (error) {
            results.push(`❌ Planos: ${error.message}`);
        } else {
            const freeCount = plans.filter(p => p.name === 'Free').length;
            if (freeCount === 1) {
                results.push('✅ Planos: Plano Free único presente');
            } else if (freeCount > 1) {
                results.push(`⚠️  Planos: ${freeCount} planos Free (duplicatas)`);
            } else {
                results.push('❌ Planos: Plano Free não encontrado');
            }
            results.push(`📊 Total de planos: ${plans.length}`);
        }
    } catch (err) {
        results.push(`❌ Planos: ${err.message}`);
    }

    // 3. Verificar usuários e perfis
    console.log('👥 Verificando usuários...');
    try {
        const { data: profiles, error } = await supabase.from('profiles').select('id');
        if (error) {
            results.push(`❌ Perfis: ${error.message}`);
        } else {
            results.push(`✅ Perfis: ${profiles.length} perfis ativos`);
        }

        const { data: subscriptions, error: subError } = await supabase.from('subscriptions').select('user_id');
        if (subError) {
            results.push(`❌ Assinaturas: ${subError.message}`);
        } else {
            results.push(`✅ Assinaturas: ${subscriptions.length} assinaturas ativas`);
        }
    } catch (err) {
        results.push(`❌ Usuários: ${err.message}`);
    }

    // 4. Verificar estrutura básica
    console.log('🏗️  Verificando estrutura...');
    const tables = ['messages', 'contacts', 'whatsapp_instances', 'agents'];
    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);
            if (error) {
                results.push(`❌ ${table}: ${error.message}`);
            } else {
                results.push(`✅ ${table}: Tabela acessível`);
            }
        } catch (err) {
            results.push(`❌ ${table}: ${err.message}`);
        }
    }

    // Imprimir resultados
    console.log('\n📋 RESULTADOS:');
    console.log('==============');
    results.forEach(result => console.log(result));

    // Determinar status geral
    const errors = results.filter(r => r.startsWith('❌')).length;
    const warnings = results.filter(r => r.startsWith('⚠️')).length;
    const success = results.filter(r => r.startsWith('✅')).length;

    console.log('\n🎯 STATUS GERAL:');
    console.log(`   ✅ Sucessos: ${success}`);
    console.log(`   ⚠️  Atenção: ${warnings}`);
    console.log(`   ❌ Erros: ${errors}`);

    if (errors === 0 && warnings === 0) {
        console.log('\n🎉 SISTEMA PERFEITO!');
        console.log('   Todas as verificações passaram com sucesso.');
    } else if (errors === 0) {
        console.log('\n👍 SISTEMA FUNCIONAL!');
        console.log('   Sistema operacional com algumas melhorias recomendadas.');
    } else {
        console.log('\n⚠️  SISTEMA COM PROBLEMAS!');
        console.log('   Alguns erros precisam ser corrigidos.');
    }

    console.log('\n📝 PRÓXIMAS AÇÕES:');
    console.log('1. Configurar Auth Hooks no Dashboard Supabase');
    console.log('2. Testar criação de usuário end-to-end');
    console.log('3. Verificar envio de emails automáticos');
    console.log('\n📖 Documentação: CONFIGURACAO-AUTH-HOOKS-URGENTE.md');
}

quickCheck().catch(console.error);
