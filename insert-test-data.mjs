#!/usr/bin/env node

// Script para temporariamente desabilitar RLS na tabela usage_stats para desenvolvimento
// ATENÇÃO: Use isso apenas em desenvolvimento, nunca em produção!

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🚨 SOLUÇÃO TEMPORÁRIA: Inserindo dados com usuário mock autenticado');
console.log('⚠️  Esta é uma solução temporária para desenvolvimento\n');

async function insertTestDataWithAuth() {
    try {
        // Estratégia: Simular um usuário autenticado criando uma sessão mock
        console.log('1. Criando usuário de teste...');
        
        // Primeiro, vamos tentar inserir dados diretamente com bypass do RLS
        // usando uma abordagem diferente
        
        console.log('2. Tentando inserir dados de demonstração...');
        
        // Criar dados para os últimos 7 dias
        const testData = [];
        const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            testData.push({
                user_id: mockUserId,
                date: dateStr,
                messages_sent: Math.floor(Math.random() * 50) + 10,
                messages_received: Math.floor(Math.random() * 40) + 8,
                active_sessions: Math.floor(Math.random() * 3) + 1,
                new_contacts: Math.floor(Math.random() * 5),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        }
        
        console.log(`   Preparando ${testData.length} registros...`);
        
        // Tentar inserir cada registro individualmente para ver onde falha
        let successCount = 0;
        for (const record of testData) {
            try {
                const { data, error } = await supabase
                    .from('usage_stats')
                    .insert(record)
                    .select();
                    
                if (error) {
                    console.error(`   ❌ Erro no registro ${record.date}:`, error.message);
                } else {
                    successCount++;
                    console.log(`   ✅ Inserido: ${record.date}`);
                }
            } catch (e) {
                console.error(`   ❌ Exceção no registro ${record.date}:`, e.message);
            }
        }
        
        console.log(`\\n📊 Resultado: ${successCount}/${testData.length} registros inseridos`);
        
        if (successCount === 0) {
            console.log('\\n🔧 O problema persiste. Soluções alternativas:');
            console.log('1. Acesse o Supabase Dashboard');
            console.log('2. Vá para SQL Editor');
            console.log('3. Execute: ALTER TABLE usage_stats DISABLE ROW LEVEL SECURITY;');
            console.log('4. Ou execute o script fix-usage-stats-rls.sql');
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        
        // Sugestão de solução manual
        console.log('\\n🛠️  SOLUÇÃO MANUAL NECESSÁRIA:');
        console.log('1. Abra o Supabase Dashboard em: https://supabase.com/dashboard');
        console.log('2. Acesse seu projeto: hpovwcaskorzzrpphgkc');
        console.log('3. Vá para "SQL Editor"');
        console.log('4. Execute este comando:');
        console.log('   ALTER TABLE usage_stats DISABLE ROW LEVEL SECURITY;');
        console.log('5. Depois execute este script novamente');
    }
}

// Executar
insertTestDataWithAuth();
