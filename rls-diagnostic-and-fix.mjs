#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

console.log('🔒 APLICANDO CORREÇÃO RLS CRÍTICA...\n');

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testCurrentState() {
    console.log('1. Testando estado atual das mensagens...');
    
    try {
        // Tentar inserir uma mensagem de teste
        const testMessage = {
            id: crypto.randomUUID(),
            content: 'Teste RLS - ' + new Date().toISOString(),
            role: 'user',
            user_id: '123e4567-e89b-12d3-a456-426614174000', // UUID fictício
            instance_id: 'test-instance',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('messages')
            .insert(testMessage)
            .select();
        
        if (error) {
            console.error('❌ ERRO CONFIRMADO:', error.code, error.message);
            if (error.code === '42501') {
                console.log('💡 Erro 403/42501 confirmado - aplicando correção...\n');
                return true; // Precisa correção
            }
        } else {
            console.log('✅ Inserção funcionando - limpando teste...');
            await supabase.from('messages').delete().eq('id', testMessage.id);
            return false; // Não precisa correção
        }
    } catch (err) {
        console.error('❌ Erro inesperado:', err.message);
        return true; // Assume que precisa correção
    }
}

async function fixRLSManually() {
    console.log('🔧 Aplicando correção manual via SQL direto...\n');
    
    // Como exec_sql não existe, vamos usar uma abordagem diferente
    // Vamos tentar remover e recriar as políticas usando a API diretamente
    
    try {
        console.log('2. Verificando políticas existentes...');
        
        // Primeiro, vamos verificar as políticas atuais
        const { data: policies, error: policiesError } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('schemaname', 'public')
            .eq('tablename', 'messages');
        
        if (policiesError) {
            console.error('❌ Erro ao verificar políticas:', policiesError.message);
        } else {
            console.log(`📋 Encontradas ${policies.length} políticas existentes`);
            policies.forEach(p => console.log(`   • ${p.policyname} (${p.cmd})`));
        }
        
        console.log('\n3. SOLUÇÃO ALTERNATIVA: Aplicando via SQL Scripts...');
        
        // Vamos criar um script SQL que o usuário pode executar manualmente
        const sqlScript = `
-- CORREÇÃO CRÍTICA RLS - EXECUTAR NO SUPABASE DASHBOARD
-- Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/sql

-- 1. Habilitar RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas problemáticas
DROP POLICY IF EXISTS "Users can view messages from their instances" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages to their instances" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages from their instances" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages from their instances" ON public.messages;

-- 3. Criar políticas corretas
CREATE POLICY "allow_select_own_messages" ON public.messages 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "allow_insert_own_messages" ON public.messages 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_update_own_messages" ON public.messages 
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_delete_own_messages" ON public.messages 
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Verificar políticas criadas
SELECT policyname, cmd FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'messages';
`;

        console.log('📝 SQL Script criado: MANUAL-RLS-FIX.sql');
        
        // Salvar o script para execução manual
        await Bun.write('./MANUAL-RLS-FIX.sql', sqlScript);
        
        console.log('\n⚠️  AÇÃO MANUAL NECESSÁRIA:');
        console.log('1. Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/sql');
        console.log('2. Execute o conteúdo do arquivo MANUAL-RLS-FIX.sql');
        console.log('3. Ou copie e cole o SQL acima no SQL Editor do Supabase');
        console.log('\n🔍 Após executar, teste novamente a aplicação.');
        
    } catch (error) {
        console.error('❌ Erro na correção manual:', error.message);
    }
}

async function checkAgentChatComponent() {
    console.log('\n4. Verificando componente AgentChat...');
    
    // Vamos verificar se o user_id está sendo passado corretamente
    try {
        const agentChatPath = './src/components/AgentChat.tsx';
        const fs = await import('fs');
        
        if (fs.existsSync(agentChatPath)) {
            console.log('✅ AgentChat.tsx encontrado');
            
            const content = fs.readFileSync(agentChatPath, 'utf8');
            
            // Verificar se user_id está sendo definido nas inserções
            if (content.includes('user_id:') || content.includes('user_id =')) {
                console.log('✅ user_id está sendo definido no componente');
            } else {
                console.log('⚠️  user_id pode não estar sendo definido corretamente');
                console.log('💡 Verifique se todas as inserções na tabela messages incluem user_id');
            }
            
            // Verificar tratamento de erro 403
            if (content.includes('403') || content.includes('42501')) {
                console.log('✅ Tratamento de erro 403 encontrado');
            } else {
                console.log('⚠️  Considere adicionar tratamento específico para erro 403');
            }
        } else {
            console.log('❌ AgentChat.tsx não encontrado no caminho esperado');
        }
    } catch (error) {
        console.log('❌ Erro ao verificar AgentChat:', error.message);
    }
}

async function main() {
    try {
        const needsFix = await testCurrentState();
        
        if (needsFix) {
            await fixRLSManually();
        } else {
            console.log('✅ RLS já está funcionando corretamente!');
        }
        
        await checkAgentChatComponent();
        
        console.log('\n🎯 RESUMO DA AÇÃO:');
        console.log('• Se o erro 403 persistir, execute o SQL manual no dashboard Supabase');
        console.log('• Verifique se user_id está sendo preenchido na aplicação');
        console.log('• Teste a inserção de mensagens após aplicar as correções');
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

main().catch(console.error);
