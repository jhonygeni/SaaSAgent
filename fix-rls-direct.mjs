#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Credenciais diretas (apenas para execução imediata)
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

console.log('🔒 Executando correção CRÍTICA das políticas RLS...\n');

// Criar cliente Supabase com service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function executeSQL(sql, description) {
    console.log(`📋 ${description}...`);
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_command: sql });
        if (error) {
            console.error(`❌ ${error.message}`);
            return false;
        } else {
            console.log('✅ Sucesso');
            return true;
        }
    } catch (err) {
        console.error(`❌ Erro: ${err.message}`);
        return false;
    }
}

async function fixMessagesRLS() {
    console.log('🔧 CORRIGINDO POLÍTICAS RLS DA TABELA MESSAGES\n');
    
    // 1. Habilitar RLS
    await executeSQL(
        'ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;',
        '1. Habilitando RLS na tabela messages'
    );
    
    // 2. Remover todas as políticas antigas
    const oldPolicies = [
        'Users can view messages from their instances',
        'Users can insert messages to their instances',
        'Users can update messages from their instances',
        'Users can delete messages from their instances',
        'Users can access their own messages',
        'Users can insert their own messages',
        'Users can manage their own messages',
        'Users can view their own messages',
        'Users can update their own messages',
        'Users can delete their own messages',
        'Users can access messages via instance'
    ];
    
    console.log('\n2. Removendo políticas antigas...');
    for (const policy of oldPolicies) {
        await executeSQL(
            `DROP POLICY IF EXISTS "${policy}" ON public.messages;`,
            `   Removendo "${policy}"`
        );
    }
    
    // 3. Criar políticas corretas baseadas em user_id
    console.log('\n3. Criando políticas corretas...');
    
    const policies = [
        {
            name: 'allow_select_own_messages',
            description: 'SELECT policy para próprias mensagens',
            sql: `CREATE POLICY "allow_select_own_messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);`
        },
        {
            name: 'allow_insert_own_messages',
            description: 'INSERT policy para próprias mensagens',
            sql: `CREATE POLICY "allow_insert_own_messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);`
        },
        {
            name: 'allow_update_own_messages',
            description: 'UPDATE policy para próprias mensagens',
            sql: `CREATE POLICY "allow_update_own_messages" ON public.messages FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
        },
        {
            name: 'allow_delete_own_messages',
            description: 'DELETE policy para próprias mensagens',
            sql: `CREATE POLICY "allow_delete_own_messages" ON public.messages FOR DELETE USING (auth.uid() = user_id);`
        }
    ];
    
    for (const policy of policies) {
        await executeSQL(policy.sql, `   Criando ${policy.description}`);
    }
    
    // 4. Verificar políticas criadas
    console.log('\n4. Verificando políticas criadas...');
    try {
        const { data, error } = await supabase
            .from('pg_policies')
            .select('policyname, cmd')
            .eq('schemaname', 'public')
            .eq('tablename', 'messages');
        
        if (error) {
            console.error('❌ Erro ao verificar políticas:', error.message);
        } else if (data && data.length > 0) {
            console.log('✅ Políticas ativas:');
            data.forEach(p => console.log(`   • ${p.policyname} (${p.cmd})`));
        } else {
            console.log('❌ Nenhuma política encontrada');
        }
    } catch (err) {
        console.error('❌ Erro ao verificar:', err.message);
    }
    
    console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
    console.log('🔗 Agora teste inserindo uma mensagem através da aplicação');
    console.log('📝 O erro 403 Forbidden deve estar resolvido\n');
}

// Executar correção
fixMessagesRLS().catch(console.error);
