#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔒 Iniciando correção das políticas RLS da tabela messages...\n');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ ERRO: Variáveis de ambiente não encontradas');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'OK' : 'MISSING');
    process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function fixRLSPolicies() {
    console.log('🔧 Corrigindo políticas RLS...\n');
    
    try {
        // 1. Habilitar RLS na tabela messages
        console.log('1. Habilitando RLS na tabela messages...');
        const { error: rlsError } = await supabase
            .rpc('exec_sql', { 
                sql_command: 'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;' 
            });
        
        if (rlsError) {
            console.error('❌ Erro ao habilitar RLS:', rlsError.message);
        } else {
            console.log('✅ RLS habilitado com sucesso');
        }
        
        // 2. Remover políticas antigas
        console.log('\n2. Removendo políticas antigas...');
        const dropCommands = [
            'DROP POLICY IF EXISTS "Users can view messages from their instances" ON public.messages',
            'DROP POLICY IF EXISTS "Users can insert messages to their instances" ON public.messages',
            'DROP POLICY IF EXISTS "Users can update messages from their instances" ON public.messages',
            'DROP POLICY IF EXISTS "Users can delete messages from their instances" ON public.messages',
            'DROP POLICY IF EXISTS "Users can access their own messages" ON public.messages',
            'DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages',
            'DROP POLICY IF EXISTS "Users can manage their own messages" ON public.messages'
        ];
        
        for (const cmd of dropCommands) {
            const { error } = await supabase.rpc('exec_sql', { sql_command: cmd });
            if (error && !error.message.includes('does not exist')) {
                console.error(`❌ Erro ao remover política: ${error.message}`);
            }
        }
        console.log('✅ Políticas antigas removidas');
        
        // 3. Criar novas políticas baseadas em user_id
        console.log('\n3. Criando novas políticas baseadas em user_id...');
        
        const policies = [
            {
                name: 'SELECT policy',
                sql: 'CREATE POLICY "Users can view their own messages" ON public.messages FOR SELECT USING (auth.uid() = user_id)'
            },
            {
                name: 'INSERT policy',
                sql: 'CREATE POLICY "Users can insert their own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id)'
            },
            {
                name: 'UPDATE policy',
                sql: 'CREATE POLICY "Users can update their own messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)'
            },
            {
                name: 'DELETE policy',
                sql: 'CREATE POLICY "Users can delete their own messages" ON public.messages FOR DELETE USING (auth.uid() = user_id)'
            }
        ];
        
        for (const policy of policies) {
            console.log(`   Criando ${policy.name}...`);
            const { error } = await supabase.rpc('exec_sql', { sql_command: policy.sql });
            
            if (error) {
                console.error(`   ❌ Erro ao criar ${policy.name}:`, error.message);
            } else {
                console.log(`   ✅ ${policy.name} criada com sucesso`);
            }
        }
        
        // 4. Verificar políticas criadas
        console.log('\n4. Verificando políticas criadas...');
        await checkPolicies();
        
        console.log('\n🎉 Correção das políticas RLS concluída!');
        console.log('🔗 Agora teste inserindo uma mensagem através da aplicação\n');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
        process.exit(1);
    }
}

async function checkPolicies() {
    try {
        // Usar uma query SQL direta para verificar as políticas
        const { data, error } = await supabase
            .rpc('exec_sql', {
                sql_command: `
                    SELECT policyname, cmd 
                    FROM pg_policies 
                    WHERE schemaname = 'public' AND tablename = 'messages'
                    ORDER BY policyname;
                `
            });
        
        if (error) {
            console.error('❌ Erro ao verificar políticas:', error.message);
            return;
        }
        
        console.log('📋 Políticas RLS ativas na tabela messages:');
        if (data && data.length > 0) {
            data.forEach(policy => {
                console.log(`   • ${policy.policyname} (${policy.cmd})`);
            });
        } else {
            console.log('   ❌ Nenhuma política encontrada');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar políticas:', error.message);
    }
}

// Executar correção
fixRLSPolicies();
