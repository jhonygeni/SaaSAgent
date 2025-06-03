#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Diagnóstico do Supabase...\n');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ ERRO: Variáveis de ambiente não encontradas');
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING');
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'OK' : 'MISSING');
    process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUsageStats() {
    console.log('📊 Testando acesso à tabela usage_stats...\n');
    
    try {
        // Teste 1: Verificar se a tabela existe
        console.log('1. Verificando se a tabela usage_stats existe...');
        const { data: tableTest, error: tableError } = await supabase
            .from('usage_stats')
            .select('count')
            .limit(1);
        
        if (tableError) {
            console.error('❌ Erro ao acessar tabela usage_stats:', tableError.message);
            console.error('   Código:', tableError.code);
            console.error('   Detalhes:', tableError.details);
            console.error('   Hint:', tableError.hint);
            return;
        }
        
        console.log('✅ Tabela usage_stats existe e é acessível');
        
        // Teste 2: Contar total de registros
        console.log('\n2. Contando registros na tabela...');
        const { count, error: countError } = await supabase
            .from('usage_stats')
            .select('*', { count: 'exact', head: true });
        
        if (countError) {
            console.error('❌ Erro ao contar registros:', countError.message);
        } else {
            console.log(`✅ Total de registros: ${count}`);
        }
        
        // Teste 3: Buscar primeiros registros
        console.log('\n3. Buscando primeiros registros...');
        const { data: firstRecords, error: firstError } = await supabase
            .from('usage_stats')
            .select('*')
            .limit(5);
        
        if (firstError) {
            console.error('❌ Erro ao buscar registros:', firstError.message);
        } else {
            console.log(`✅ Primeiros registros encontrados: ${firstRecords?.length || 0}`);
            if (firstRecords && firstRecords.length > 0) {
                console.log('   Exemplo:', JSON.stringify(firstRecords[0], null, 2));
            }
        }
        
        // Teste 4: Tentar inserir um registro de teste
        console.log('\n4. Testando inserção de dados...');
        const testData = {
            user_id: '123e4567-e89b-12d3-a456-426614174000',
            date: new Date().toISOString().split('T')[0],
            messages_sent: 10,
            messages_received: 8,
            active_sessions: 1,
            new_contacts: 2
        };
        
        const { data: insertData, error: insertError } = await supabase
            .from('usage_stats')
            .insert(testData)
            .select();
        
        if (insertError) {
            console.error('❌ Erro ao inserir dados de teste:', insertError.message);
            console.error('   Código:', insertError.code);
            console.error('   Detalhes:', insertError.details);
        } else {
            console.log('✅ Dados de teste inseridos com sucesso!');
            console.log('   Dados inseridos:', JSON.stringify(insertData, null, 2));
        }
        
        // Teste 5: Verificar autenticação
        console.log('\n5. Verificando status de autenticação...');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
            console.error('❌ Erro de autenticação:', authError.message);
        } else if (user) {
            console.log('✅ Usuário autenticado:', user.email);
        } else {
            console.log('⚠️ Nenhum usuário autenticado (usando anonkey)');
        }
        
        console.log('\n🎉 Diagnóstico concluído!');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        process.exit(1);
    }
}

// Executar diagnóstico
testUsageStats();
